# Implementation prompt: Collect url, tagline, logo on the donate flow

## Goal
`leaderboardEntry` has `url` (required, the actual PR payoff — where name/logo link out to), `tagline` (optional, ≤140 chars), and `logo` (optional image) — none are collected anywhere in the donate flow built in `prompts/donate-checkout-flow.md`. Add all three to `ConfirmClaim` and `/api/orders`, including a server-mediated logo upload, so a confirmed entry actually has what it needs to render on the leaderboard (`LeaderboardSection`/entry cards already display `logo`/`url`/`tagline` — only the write side is missing).

## Skills / docs read
- AGENTS.md §5 (server/client boundary — browser never holds a Sanity write token; every write goes through a server route), §8 (data model — `url` is "the actual PR payoff for a company donor"), §2 (prompt-approval required — this still touches the entry-creation write path).
- `prompts/donate-checkout-flow.md` — the flow this extends; its "Needs your attention" section already flagged `url` as a required-but-uncollected field.

## Code inspected
- `studio/schemaTypes/leaderboardEntry.ts` — `url`: `type: 'url'`, `rule.required().uri({ scheme: ['http','https'] })`. `tagline`: `type: 'text', rows: 2`, `rule.max(140)`, not required. `logo`: `type: 'image', options: { hotspot: true }`, not required.
- `app/api/orders/route.ts` — current `POST` validates `amount`/`categorySlug`/`displayName`/`companyName` only, then `writeClient.create({...})` with no `url`/`tagline`/`logo`. This is the write path being extended.
- `sanity/lib/writeClient.ts` — server-only client with `SANITY_API_WRITE_TOKEN`; has `.assets` available via the underlying `@sanity/client` (not yet used anywhere in this repo — `writeClient.assets.upload('image', buffer, { filename, contentType })` is the standard next-sanity/Sanity client API for asset upload, returns a document with `_id` you reference as `{ _type: 'image', asset: { _type: 'reference', _ref: assetId } }`).
- `components/leaderboard/ConfirmClaim.tsx` — currently collects `name`, `company`, ToS checkbox only, then POSTs JSON to `/api/orders`.
- No existing route in this repo does file upload or `request.formData()` — this introduces that pattern for the first time.
- `next.config.ts` — no body-size config; Vercel's default serverless request body cap (~4.5MB) is the practical ceiling regardless of what we set, so client + server both enforce a smaller cap well under that.

## Decisions
1. **Logo upload is a separate route** (`/api/upload-logo`), called first (if a file was chosen) to get an asset id, then that id is passed into the existing `/api/orders` POST body. Keeps `/api/orders` as clean JSON (no multipart), and an aborted/failed logo upload doesn't risk a half-created order.
2. **Upload cap: 2MB, image/* only.** Enforced both client-side (before upload, for fast feedback) and server-side (never trust the client check). No cropping/resizing UI — Sanity's own image pipeline (`hotspot`) handles display-time cropping; we just store the original.
3. **Orphaned assets are an accepted gap, not solved here.** If a donor uploads a logo then abandons checkout, the asset persists unused in Sanity. Same class of gap as the abandoned-pending-entry case already flagged in the checkout-flow prompt — cleanup is a Studio "unused assets" sweep, not app logic, consistent with "don't build retry/rollback machinery for a preview-scope pass."
4. **`url` becomes a real required field in the UI**, blocking submit until it's a valid `http(s)://` URL (mirrors the schema's own `uri({ scheme: ['http','https'] })` rule) — this is the field that was silently missing before, so it now matches what Studio already expects.
5. **`tagline` is optional, capped at 140 chars client-side** to match the schema's `rule.max(140)` and give the donor a live counter instead of a post-submit rejection.

## Files touched
- `app/api/upload-logo/route.ts` (new) — `POST`, `multipart/form-data` via `request.formData()`. Reads the `file` field; rejects if missing, not `image/*`, or over 2MB. Rate-limited via the existing `checkRateLimit` (reuse the same per-IP limiter, a separate bucket key `upload:${ip}`, similar limits to orders). Converts to a `Buffer` (`await file.arrayBuffer()`), calls `writeClient.assets.upload('image', buffer, { filename: file.name, contentType: file.type })`, returns `{ assetId: asset._id }`. On any failure, 502 with a plain message — no stack traces leaked.
- `app/api/orders/route.ts` — extend the parsed/validated body with optional `url` (required, non-empty, must parse as an `http`/`https` URL — reject with 400 and a clear reason otherwise) and `tagline` (optional, ≤140 chars, 400 if longer), and optional `logoAssetId` (string, optional). Add `url`, `tagline`, and `logo: logoAssetId ? { _type: 'image', asset: { _type: 'reference', _ref: logoAssetId } } : undefined` to the `writeClient.create({...})` call.
- `components/leaderboard/ConfirmClaim.tsx`:
  - New state: `url` (text input, required), `tagline` (textarea, optional, live `140 - length` counter), `logoFile` (File | null) + `logoPreview` (object URL for a small preview thumbnail), `logoError`.
  - File input (`accept="image/*"`), client-side check (type + 2MB) before accepting a file — reject with `logoError` inline, don't silently drop it.
  - `canSubmit` now also requires a syntactically valid `url` (use `try { new URL(url) } catch { invalid }` plus a scheme check).
  - `handleSubmit` sequence: if `logoFile` is set, `POST /api/upload-logo` (FormData) first — surface its error and stop if it fails, don't proceed to order creation with a half-done upload; then `POST /api/orders` with `url`, `tagline`, `logoAssetId` added to the existing body.
- No schema changes — all three fields already exist exactly as needed.

## Requirements
- Submitting without a valid `url` is blocked client-side with a clear inline message, and rejected server-side (400) if somehow bypassed.
- `tagline` over 140 chars is blocked client-side and rejected server-side if bypassed.
- A confirmed-later entry (once the webhook exists) will render with whatever logo/tagline/url was submitted here — verify by checking the created Studio document has these fields populated after a real submit, not just `pending` with blanks.
- Uploading a non-image or >2MB file is rejected with a clear message, both client- and server-side.
- No entry is created if a chosen logo fails to upload — no silent "success without logo" divergence from what the donor saw on screen.
- Sanity write token still never reaches the client (the new upload route is server-only, same as `/api/orders`).

## Security considerations
- Server-side file-type/size validation is the actual control — client-side checks are UX only, never trusted alone (matches AGENTS.md's "never trust the client" pattern already used for amount).
- `/api/upload-logo` is rate-limited independently of `/api/orders` — an attacker could otherwise use free-standing uploads (no order required) to fill storage; the per-IP limiter caps that, with the same non-durability caveat already flagged for the orders limiter.
- `url` is validated to be `http`/`https` only (no `javascript:`/`data:` schemes) both because the schema requires it and because it's rendered as an outbound link on the public leaderboard.

## Acceptance criteria
- `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass clean.

## Checks to run
- `npm run lint`
- `npx tsc --noEmit -p tsconfig.json`
- `npm run build`
- Manual walkthrough below against Razorpay test mode (requires the real test keys from the previous prompt to be in place — logo/url/tagline reach Sanity regardless of Razorpay key validity, but full end-to-end needs them).

## Manual test steps
1. On `/donate`, try to submit with `url` empty → blocked, inline message.
2. Enter `not-a-url` as the url → blocked, inline message.
3. Enter a valid `https://example.com` url, a 150-character tagline → blocked/truncated at 140 with a visible counter.
4. Attach a 5MB file as logo → rejected client-side before any upload happens.
5. Attach a `.pdf` as logo → rejected (not `image/*`).
6. Attach a valid small PNG/JPG, fill valid url + short tagline, submit → confirm in Studio the new `pending` entry has `logo` (renders a thumbnail), `url`, and `tagline` populated correctly.
7. Repeat without attaching a logo at all → entry created fine with `logo` unset, `url`/`tagline` still present.
8. Fire 6+ rapid logo uploads from the same browser within a minute → later ones 429 from `/api/upload-logo`.
