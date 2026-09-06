# Implementation prompt: URL/handle identity + favicon + reclaim detection in ClaimBand

## Goal
`ClaimBand`'s single text input currently collects a free-text display name. Change it to collect the donor's **identity** — a website URL or an `@handle` — the same thing `leaderboardEntry.url` already stores. As they type: resolve a favicon for a URL, detect if that identity already has a confirmed entry in the active cycle, and if so swap the button/copy to "Reclaim" instead of "Claim". This is read-only detection (a lookup), no ranking or write-path change — but it feeds directly into the payment funnel, so it gets the same prompt-approval as the rest of this flow.

## Skills / docs read
- AGENTS.md §2 (prompt-approval — this shapes what identity gets attached to a payment), §7 (must-outbid mechanic must not be relaxed — reclaiming still has to beat the same scope floor, no special-casing), §8 (`url` is "a website URL or @handle").
- `prompts/donor-profile-fields.md` — `ConfirmClaim` already has an independent `url` field (added there); this prompt's job is to get `ClaimBand` to *feed* that field with a resolved value, not duplicate it.

## Code inspected
- `components/leaderboard/ClaimBand.tsx` — the `name` state/input is currently free text ("Your name or brand"), forwarded to `/donate?...&name=`. No identity concept exists yet.
- `components/leaderboard/ConfirmClaim.tsx` — already has its own `url` state/input (text box, validated as `http`/`https` on submit). Today it always starts empty; this prompt makes `/donate` prefill it from what `ClaimBand` resolved.
- `app/donate/page.tsx` — reads `amount`/`category`/`today`/`name` from `searchParams`, passes `initialName` to `ConfirmClaim`. Needs an `initialUrl` (and reclaim-awareness) added the same way.
- `studio/schemaTypes/leaderboardEntry.ts` — `url` is `required().uri({ scheme: ['http','https'] })`. A bare `@handle` cannot be stored as-is; per your decision, it resolves to `https://instagram.com/<handle>`.
- `sanity/lib/queries.ts` / `data.ts` — `getActiveCycle()`, `getConfirmedEntries(cycleId)` already exist and return `url` per entry (`CONFIRMED_ENTRIES_QUERY` includes it). No new GROQ needed — reuse and filter in-memory, same pattern `filterEntries`/`scopeTopAmount` already use.
- `app/api/rank-preview/route.ts` — the existing debounced-lookup pattern (`ClaimBand`'s `useEffect` + 300ms `setTimeout` + fetch) is the template this prompt's identity-lookup fetch follows.

## Decisions
1. **`@handle` → `https://instagram.com/<handle>`** (your explicit choice), since donors here are this Instagram creator's audience/brands. Anything else (bare domain like `github.com`, or a full `https://...` URL) is treated as a URL directly, prefixed with `https://` if no scheme was typed.
2. **Match scope: confirmed entries in the active cycle only**, normalized (lowercase host, `www.` stripped, trailing slash stripped, protocol ignored) — consistent with every other must-outbid/rank computation in this app being active-cycle-scoped. Past-cycle entries never trigger "reclaim" (they're frozen history, per AGENTS.md §7).
3. **"Reclaim" is UX-only in this pass — no merge-on-confirm logic yet.** Detecting a match changes button copy and shows a small "already on the board" banner; the actual `/api/orders` call still always creates a brand-new `pending` entry (same as any claim). Whether a reclaim should eventually *update* the existing confirmed entry (same identity, bumped amount/`raiseCount`) instead of creating a sibling document is a real decision, but it can only be finalized at webhook-confirmation time — which doesn't exist yet (per `prompts/donate-checkout-flow.md`'s scope boundary). Flagging clearly for that future prompt rather than half-building it now.
4. **Favicon source: Google's public favicon service** (`https://www.google.com/s2/favicons?sz=64&domain_url=<url>`), fetched directly by the browser via an `<img>` tag — no backend call, no API key, matches how everyone does this cheaply. Shown only for URL-type identities; `@handle` entries get a plain "@" glyph instead (Instagram doesn't expose a public no-auth favicon-by-handle endpoint).

## Files touched
- `lib/identity.ts` (new) — pure functions, usable client- and server-side:
  - `parseIdentity(input: string): { url: string; kind: "url" | "handle" } | null` — `@x` → `https://instagram.com/x`; bare text with a `.` and no spaces → prefixed `https://` and validated via `new URL(...)`; anything else → `null` (not yet a recognizable identity, so no favicon/lookup fires).
  - `normalizeIdentityUrl(url: string): string` — lowercase host, strip `www.`, strip trailing slash, drop protocol — the comparison key used both client-side (none needed) and server-side (lookup + orders matching).
  - `faviconUrlFor(url: string): string` — the Google favicon URL builder.
- `app/api/entry-lookup/route.ts` (new) — `GET`, query param `url` (already-resolved identity URL from `parseIdentity`, not raw user input). Loads `getActiveCycle()` + `getConfirmedEntries(cycleId)`, finds the first entry whose `normalizeIdentityUrl(entry.url)` matches, returns `{ exists: true, displayName, amount, categorySlug } | { exists: false }`. Read-only, same shape of risk as `/api/rank-preview` (cheap query, no write, no Razorpay) — debounce is the only throttle needed, no rate limiter.
- `components/leaderboard/ClaimBand.tsx`:
  - Renames the `name` input's purpose to identity: placeholder becomes `"Website URL or @handle"`, `name` state renamed `identityInput`.
  - Parses `identityInput` via `parseIdentity` on change (no debounce needed for parsing, it's local/synchronous); when it resolves, shows the favicon (or "@" glyph for a handle) as a small inline avatar at the input's leading edge.
  - Debounced (~300ms, same timing as the existing rank-preview effect) fetch to `/api/entry-lookup?url=...` whenever the parsed identity's resolved URL changes; stores `{ exists, displayName, amount }` in state.
  - Button label becomes `"Reclaim rank"` when `exists` is true, `"Claim rank"` otherwise; the helper text under the headline gets a second line when reclaiming: `"Already on the board as {displayName} at ₹{amount}."`
  - `claimHref` now sends `url=<resolved identity url>` instead of `name=`; drops the old `name` param entirely (identity replaces it — `ConfirmClaim`'s separate "Display Name" field, from the previous prompt, is what donors fill in on the confirm screen itself).
- `app/donate/page.tsx` — reads `url` from `searchParams` instead of `name`; passes `initialUrl` to `ConfirmClaim` (in place of `initialName`, which goes away — the confirm screen's Display Name field starts blank, same as today, since `ClaimBand` no longer collects a name).
- `components/leaderboard/ConfirmClaim.tsx` — `initialName` prop replaced with `initialUrl: string`; the existing `url` state initializes from it (`useState(initialUrl)`) instead of always starting empty. No other change — the field, its validation, and submit payload already exist from the previous prompt.

## Requirements
- Typing a bare domain (`github.com`), a full URL, or `@handle` all resolve to a valid identity and show a favicon/glyph; anything else (plain free text with no dot, no `@`) shows neither and doesn't trigger a lookup.
- When the resolved identity matches a confirmed entry in the active cycle, the button reads "Reclaim rank" and the existing entry's name/amount is shown; otherwise it reads "Claim rank" as today.
- The must-outbid floor is completely unaffected by reclaim detection — same scope-relative floor either way, no special lower bar for a "reclaim."
- `/donate` receives and prefills the resolved URL into `ConfirmClaim`'s existing `url` field; the donor can still edit it before submitting.
- `/api/entry-lookup` never creates, patches, or deletes anything — verify it's a pure `GET` with no write client import.

## Security considerations
- `/api/entry-lookup` is read-only and only returns data already public on the leaderboard (display name, amount, url match) — no new information disclosure beyond what `/` already shows.
- Reusing `getConfirmedEntries`/`getActiveCycle` (already-cached reads) means no new Sanity write-token surface is introduced by this prompt.

## Acceptance criteria
- `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass clean.

## Checks to run
- `npm run lint`
- `npx tsc --noEmit -p tsconfig.json`
- `npm run build`

## Manual test steps
1. On `/`, type `github.com` into ClaimBand's input → a GitHub favicon appears, button still says "Claim rank" (assuming no confirmed entry has that URL yet).
2. Type `@somehandle` → an "@" glyph shows instead of a favicon; identity resolves to `https://instagram.com/somehandle`.
3. In Studio, confirm an existing `leaderboardEntry` with a known `url` in the active cycle (temporarily flip its `status` to `confirmed` if none exist yet, and set an amount). Type that same URL (or a `www.`/trailing-slash variant of it) into ClaimBand → button switches to "Reclaim rank" and shows the existing name/amount.
4. Click through to `/donate` from a resolved identity → confirm the URL field is prefilled with what you typed (normalized), and Display Name is blank and editable.
5. Confirm typing plain free text with no dot/`@` (e.g. "hello") shows no favicon/glyph and never fires a lookup (check Network tab — no `/api/entry-lookup` request).
6. Confirm reclaiming still enforces the normal scope floor — try to claim below the current top even when "Reclaim rank" is showing, confirm it's still blocked the same way as any other claim.
