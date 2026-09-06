# Implementation prompt: Donate flow through Razorpay checkout

## Goal
Wire the donate flow from "Claim rank" (ClaimBand) through a confirm screen to actually opening Razorpay's checkout. Scope stops there — **no webhook in this pass**, so no payment ever reaches `confirmed` yet and nothing new appears on the public leaderboard. That's a deliberate boundary confirmed with you (see Decisions), not an oversight; the webhook is its own future prompt.

## Skills / docs read
- AGENTS.md §2 (prompt-approval mandatory — this is the first write path and first real money code in the repo), §5 (server/client boundary — browser never holds a write token or payment secret), §7 (must-outbid is scope-relative, decided in `prompts/scoped-claim-band-rank-preview.md`), §9 (payment flow specifics — server validates amount, webhook is sole source of truth), §10 (anti-abuse baseline), §12 (webhook raw-body signature verification — not yet relevant since no webhook this pass, but the write client built here is what the future webhook route will reuse).
- `prompts/scoped-claim-band-rank-preview.md` — locks in that "current top" is scope-relative (category and/or today), computed via `filterEntries` + `scopeTopAmount` from `lib/filters.ts`. This prompt's server-side validation must use the exact same scoping, not a global top.
- Razorpay Orders API + Checkout.js docs (standard integration: server creates an order, client loads `checkout.js` and opens it with the order id) — followed per AGENTS.md §6 ("follow the package/provider docs" for Razorpay).

## Code inspected
- `components/leaderboard/ClaimBand.tsx` — collects `name`, `category`, `amount`; `claimHref` currently only forwards `amount`, `category`, `name` to `/donate` — **drops `today`**, so a claim made from `/today` or `/category/x?today=true` would lose that half of its scope on the confirm page. Needs fixing as part of this prompt.
- `app/donate/page.tsx` / `components/leaderboard/DonateForm.tsx` — today this is a non-functional preview: `currentTop` is computed as the **global** top (`sorted[0]?.amount`), ignoring category/today scope, and the submit button is literally disabled `Continue (coming soon)`. Both need to change.
- `lib/filters.ts` — `filterEntries(entries, { categorySlug?, today?, q? })` and `scopeTopAmount(filtered)` are the existing, already-correct scoping primitives (used by `app/page.tsx`, `/today`, `/category/[slug]`). Reused here instead of writing new GROQ.
- `sanity/lib/data.ts` / `queries.ts` — `getActiveCycle()`, `getCategories()`, `getSiteConfig()`, `getConfirmedEntries(cycleId)` all exist and are cached appropriately (`fetchCached` for slow-changing docs, `sanityFetch`/live for confirmed entries). No new read queries needed for validation — reuse `getConfirmedEntries` + `filterEntries` + `scopeTopAmount` server-side, same as the client-facing rank preview does conceptually.
- `sanity/lib/client.ts` — the only existing Sanity client is CDN-backed and **read-only** (no token passed). `app/api/click/[id]/route.ts` has a comment explicitly noting writes are deferred pending a write-scoped token — this prompt is where that gets built.
- `studio/schemaTypes/leaderboardEntry.ts` — already has every field this flow needs: `status` (default `pending`), `razorpayOrderId`, `razorpayPaymentId` (unused until the webhook prompt), `confirmedAt` (unused until then), `slug`, `category` ref, `cycle` ref, `amount`. **No schema changes needed.**
- `.env.local` currently has only `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`. No write token, no Razorpay keys, no `razorpay` npm package installed yet.
- `components/ui/Button.tsx`, `components/ui/DonationInput.tsx` — reused for the confirm screen instead of introducing new primitives.

## Decisions
1. **Stop at opening Razorpay checkout — no webhook this pass** (your explicit choice). The entry is created as `pending` with a real `razorpayOrderId`; it will sit `pending` until the future webhook prompt patches it to `confirmed`. Nothing on the public leaderboard changes as a result of this prompt, by design.
2. **Must-outbid floor at order-creation time is scope-relative**, matching what `ClaimBand` displayed: category (if any) AND today (if any), recomputed server-side via `filterEntries`/`scopeTopAmount` — never trusting the client's amount or the client's claimed rank.
3. **Rate limiting is a best-effort in-memory fixed-window limiter** (per IP, e.g. 5 order-attempts/minute), not a durable store. Flagging per AGENTS.md §10: this does **not** hold up under multiple serverless instances/regions on Vercel — it only limits attempts within a single warm instance. A real fix (Upstash Redis via Vercel Marketplace, or Vercel Firewall rate-limit rules) is a follow-up you should decide on before real-money launch, not before this preview.
4. **Profanity/impersonation filter is a small deny-list + pattern check** (obvious slurs, "official", "verified", claims of being the creator/celebrity, or the exact configured `creatorName` from site config used by someone else) — a baseline per §10, not exhaustive. Borderline hits reject with a message to try a different name rather than silently allowing or silently soft-blocking into a review queue (no moderation queue UI exists in Studio beyond the existing `status` field, so a rejected attempt just never creates a document).
5. **No optimistic UI.** After Razorpay checkout opens and either succeeds, fails, or is dismissed, the confirm screen shows a plain state message ("payment submitted, confirmation pending" / "checkout cancelled, nothing charged" / "payment failed, nothing charged") — never a success/leaderboard-style confirmation, since no webhook exists yet to actually confirm anything.
6. **New write client is separate from the existing read client**, `useCdn: false`, using a new `SANITY_API_WRITE_TOKEN` (server-only, never imported by client components).

## Files touched
- `.env.example` — add `SANITY_API_WRITE_TOKEN`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (server-only), `NEXT_PUBLIC_RAZORPAY_KEY_ID` (public key id, safe client-side — required by Razorpay's Checkout.js).
- `package.json` — add `razorpay` (official Node SDK, server-side order creation only; client uses the hosted `checkout.js` script tag, no npm package needed for that side).
- `sanity/lib/writeClient.ts` (new) — `createClient` with `token: process.env.SANITY_API_WRITE_TOKEN`, `useCdn: false`. Throws clearly at call time if the token is missing rather than silently no-op'ing.
- `lib/rate-limit.ts` (new) — `checkRateLimit(key: string, { max, windowMs }): boolean`, in-memory `Map`-based fixed window, with the non-durability caveat as a code comment pointing back to this prompt.
- `lib/moderation.ts` (new) — `moderateNames({ displayName, companyName, creatorName }): { ok: true } | { ok: false; reason: string }`, deny-list + impersonation checks described in Decision 4.
- `lib/scope.ts` — small addition: a helper to parse `{ categorySlug, today }` back out of `URLSearchParams`/query-string values, shared by `app/donate/page.tsx` and `app/api/orders/route.ts` so both sides parse scope identically.
- `components/leaderboard/ClaimBand.tsx` — `claimHref` gains `&today=true` when `scope.today` is set, so the confirm page receives the full scope.
- `app/donate/page.tsx` — rewritten: reads `amount`, `category`, `name`, `today` from `searchParams`; loads `getLeaderboardData()`; computes the scope-relative top via `filterEntries`/`scopeTopAmount` (matching `ClaimBand`'s own math exactly); if the requested amount no longer clears that floor (someone else claimed in the meantime) or the category slug is invalid, shows an inline "this has changed, go back and re-claim" state instead of a stale confirm screen; otherwise renders the new `ConfirmClaim` client component with everything it needs as props.
- `components/leaderboard/DonateForm.tsx` → replaced by `components/leaderboard/ConfirmClaim.tsx` (rename reflects what it now does — confirm-and-pay, not a generic donation form):
  - Props: `scope`, `scopeTopAmount`, `minimumIncrement`, `amount`, `category` (resolved title, not just slug), `initialName`, `categories` (for the company field's category display only — category itself is fixed from the claim, not re-selectable here, matching the outbid.lol reference where the confirm step shows rank/price as read-only and only collects checkout details).
  - Local state: `name` (editable, prefilled), `company` (optional), `agreed` (ToS checkbox), `status: "idle" | "submitting" | "checkout-open" | "submitted" | "cancelled" | "failed"`, `error: string | null`.
  - Summary block: rank (`#1{scopeLabel}`), price (`amount`), and the same "goes live only when payment confirms, someone else can outbid you" framing AGENTS.md's trust-first tone calls for — no gimmicky countdown/urgency copy.
  - ToS checkbox gates the button, same pattern as the reference screenshot (checkbox required before "Continue to checkout" is enabled) — links to `/terms` (already exists in `app/terms`).
  - On submit: `POST /api/orders` with `{ amount, categorySlug, today, displayName, companyName }`. On a 4xx, surface the server's rejection reason inline (amount-too-low / rate-limited / name-rejected) rather than a generic error — the user needs to know why to retry correctly.
  - On success response `{ orderId, amount, currency, keyId, entryId }`: dynamically inject the `https://checkout.razorpay.com/v1/checkout.js` script (once, cached across renders), then `new window.Razorpay({...}).open()` with `prefill.name`, `handler` → `status: "submitted"`, `modal.ondismiss` → `status: "cancelled"`.
- `app/api/orders/route.ts` (new) — `POST` handler:
  1. Resolve client IP from `x-forwarded-for` (Vercel sets this); `checkRateLimit` — 429 with a clear message if tripped.
  2. Parse/validate body: `amount` (finite integer ≥ 1), `categorySlug` (optional string), `today` (optional boolean), `displayName` (required, trimmed, length-bounded), `companyName` (optional, length-bounded). Reject malformed input with 400.
  3. `moderateNames(...)` against `getSiteConfig()`'s `creatorName` — reject with 400 + reason on a hit.
  4. `getActiveCycle()` — 400 ("no active cycle") if none; this is a real state the Studio can produce between cycles, not just a theoretical guard.
  5. If `categorySlug` given, confirm it exists in `getCategories()` — 400 if not (stale/tampered link).
  6. `getConfirmedEntries(cycle._id)` → `filterEntries(..., { categorySlug, today })` → `scopeTopAmount(...)` → required floor = `top + minimumIncrement` (from `getSiteConfig()`). Reject with 400 + the real current floor if the submitted amount doesn't clear it — this is the actual enforcement AGENTS.md §9 requires, independent of whatever the client displayed.
  7. Generate a slug: `slugify(displayName) + "-" + crypto.randomUUID().slice(0, 6)` (no slugify dependency exists yet — a tiny local lowercase/hyphenate/strip-non-alphanumeric function is enough, it doesn't need to be pretty, just unique and URL-safe).
  8. Create the `leaderboardEntry` draft via the write client: `status: "pending"`, `displayName`, `companyName`, `amount`, `slug`, `category: {_ref}`, `cycle: {_ref}`. Capture the returned `_id`.
  9. Create the Razorpay order: `amount * 100` (paise), `currency: "INR"`, `receipt: entryId`, `notes: { entryId }`.
  10. Patch the entry with `razorpayOrderId`.
  11. Return `{ orderId, amount, currency: "INR", keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, entryId }`.
  - If the Razorpay order call fails after the Sanity doc was created, leave the doc as `pending` with no `razorpayOrderId` (harmless — it never shows publicly, and Studio can clean up abandoned pendings) and return 502 to the client. Don't attempt a compensating delete — simpler and matches "never architect around funds/state you don't control," per AGENTS.md's spirit of not overbuilding retry/rollback machinery for a preview-scope pass.

## Requirements
- Clicking "Claim rank" in `ClaimBand` from any of the four scopes (`/`, `/today`, `/category/x`, `/category/x?today=true`) lands on `/donate` with the full scope preserved and shows that scope's correct floor.
- `/donate`'s confirm screen never lets "Continue to checkout" fire with the ToS box unchecked.
- The order-creation route re-validates the amount against the live scope floor at submit time — a stale/tampered amount in the URL cannot create an under-floor order.
- A rejected name/company (profanity/impersonation) never creates a Sanity document.
- Razorpay Checkout opens with the real server-created `order_id` — the client never fabricates or guesses one.
- No entry becomes visible on the public leaderboard as a result of anything in this prompt — confirm by checking `status` stays `pending` in Studio after a full test run.
- The Sanity write token and Razorpay key secret are never sent to or readable from the browser (verify in Network tab / view-source).

## Security considerations
- Amount, category, and scope are all re-derived server-side from Sanity, never trusted from the request body beyond "this is what the user is claiming to want" — matches AGENTS.md §9 exactly.
- Rate limiting here targets order *attempts* (Razorpay order-spam), per §10 — it runs before any Sanity write or Razorpay call.
- The moderation check runs before the Sanity write, so a rejected submission leaves no trace document.
- `SANITY_API_WRITE_TOKEN` and `RAZORPAY_KEY_SECRET` are read only inside `app/api/orders/route.ts` (a server route) and `sanity/lib/writeClient.ts` — grep after implementation to confirm neither string appears in any client component or is passed as a prop.
- This still isn't a complete anti-abuse story (no CAPTCHA, no durable rate-limit store) — flagging again so it isn't mistaken for launch-ready.

## Acceptance criteria
- `npm run lint` and `npm run build` pass clean.
- `npm install razorpay` succeeds and is reflected in `package.json`/lock file.
- Manual test steps below all pass against Razorpay **test mode** keys.

## Checks to run
- In `web` (repo root, since it's the Next.js workspace): `npm run lint`, `npm run build`.
- Start `npm run dev` and manually walk the test steps below — do not claim they passed without actually running them.

## Manual test steps
1. Add test-mode `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` and a `SANITY_API_WRITE_TOKEN` (Editor-level, this dataset) to `.env.local`.
2. From `/`, claim a rank with a valid name → confirm screen shows the correct global floor and category.
3. From `/category/<slug>?today=true`, claim a rank → confirm screen's floor matches that scope, not the global one; check the URL carried `today=true` through.
4. Try to submit with the ToS box unchecked → button stays disabled.
5. Submit a valid claim → Razorpay test checkout opens with the correct amount and prefilled name.
6. Complete a test-mode payment (Razorpay test card) → confirm screen shows "submitted / confirmation pending" — not a success/leaderboard message.
7. In Sanity Studio, confirm a new `leaderboardEntry` exists with `status: pending`, correct `amount`/`category`/`cycle`, and a populated `razorpayOrderId`. Confirm it does **not** appear on the public leaderboard.
8. Repeat a claim but dismiss the Razorpay modal without paying → confirm screen shows "cancelled, nothing charged".
9. Try submitting an amount below the current floor via a manually edited URL (bypass the client check) → server rejects with 400 and the real floor, no document created.
10. Try a name like "Official <configured creatorName>" → rejected, no document created.
11. Fire 6+ rapid claim attempts from the same browser/IP within a minute → the later ones 429.
12. Confirm (view-source / Network tab) that no Razorpay secret or Sanity write token ever appears in a client-side response or bundle.

## Needs your attention (carry into the report after building)
- No webhook exists yet — every entry created here stays `pending` forever until that follow-up prompt is built and approved. Flag this to the user again in the closing report.
- Rate limiting is in-memory only; not durable across serverless instances. Flag as a pre-launch gap.
- Creator partnership is still unconfirmed (AGENTS.md §1) — the moderation check reads `creatorName` from site config, which may be unset; if unset, impersonation-of-creator checking is a no-op until that field is filled in.
