# Fix: ConfirmClaim URL field doesn't support @handle like ClaimBand does

## Goal

`ClaimBand.tsx` (leaderboard "claim rank" bar) accepts either a full URL or an
`@handle` in its identity input, via `parseIdentity()` in `lib/identity.ts` —
`@handle` gets rewritten to `https://instagram.com/handle` before being passed
to `/donate?...&url=`.

`ConfirmClaim.tsx` (the form on `/donate`, which actually creates the
Razorpay order) never runs that same parsing. Its field is labeled
"Website / handle URL" but validates with `isValidHttpUrl()` only — a plain
`http(s)://` check. If a donor edits the pre-filled URL on the confirm screen
and types `@handle` directly (which the label invites), submission silently
blocks: button stays disabled, error reads "Enter a valid http(s) URL," no
handle support despite what the label promises.

Fix: make `ConfirmClaim` use the same `parseIdentity()` logic as `ClaimBand`,
so the two forms behave identically and the label is honest.

## Skills / docs read

None needed — this is a same-repo consistency fix, not new schema/GROQ/Next.js
routing work. Re-read `lib/identity.ts`, `components/leaderboard/ClaimBand.tsx`,
`components/leaderboard/ConfirmClaim.tsx`, `app/donate/page.tsx`.

## Code inspected

- `lib/identity.ts` — `parseIdentity(input)` returns `{ url, kind } | null`.
  `@handle` → `{ url: "https://instagram.com/<handle>", kind: "handle" }`.
  Plain domain/URL → normalized `{ url, kind: "url" }` via `new URL()`.
  `isValidHttpUrl(value)` — separate helper, just checks `protocol` is
  `http:`/`https:` on a parseable URL. Used today by `ConfirmClaim` alone.
- `components/leaderboard/ClaimBand.tsx` — uses `parseIdentity(identityInput)`
  for validation, favicon/handle icon switching, and building `claimHref`'s
  `&url=` param (always the *normalized* `identity.url`, never raw input).
- `components/leaderboard/ConfirmClaim.tsx` — receives `initialUrl` (already
  normalized by ClaimBand, since that's the only caller). Has its own
  editable `url` state seeded from `initialUrl`. `canSubmit` requires
  `isValidHttpUrl(url.trim())`. Sends `url: trimmedUrl` (raw trimmed input,
  not re-normalized) to `POST /api/orders`.
- `app/donate/page.tsx` — passes `params.url ?? ""` straight through as
  `initialUrl`, no parsing on the server side either.

## Decisions / assumptions

- Only fixing the identity/URL field's validation + parsing consistency.
  Not touching amount validation, category logic, or anything in
  `/api/orders` — this is a pure client-side input-parsing fix.
- Will normalize through `parseIdentity` on both change and submit, so a
  donor typing `@handle` on the confirm screen gets the same
  `https://instagram.com/<handle>` normalization ClaimBand already does.
  This keeps whatever `/api/orders` and the entry-lookup dedupe logic
  already expect (a normalized URL string), unchanged.
- Favicon preview (`faviconUrlFor`) should use the parsed URL, not raw input,
  matching ClaimBand's behavior (handle inputs get an `@` icon there, but
  ConfirmClaim currently has no such icon — out of scope to add one; just
  fixing validation/normalization, not the icon UI).
- Error message text updates from "Enter a valid http(s) URL." to something
  covering both forms, e.g. "Enter a valid URL or @handle." Small copy change,
  flagging it here rather than treating as out of scope silently.

## Files expected to touch

- `components/leaderboard/ConfirmClaim.tsx` only.

## Requirements

1. Replace the `isValidHttpUrl(url.trim())` check in `canSubmit` with
   `parseIdentity(url.trim()) !== null`.
2. Compute `identity = parseIdentity(url.trim())` once, reuse for:
   - `avatarSrc` (favicon lookup uses `identity?.url` instead of raw
     `trimmedUrl`)
   - the submit payload's `url` field (send `identity?.url` — the normalized
     form — not raw `trimmedUrl`)
3. Update the inline error message and placeholder text to match ClaimBand's
   wording ("URL or @handle").
4. No change to `/api/orders`, `app/donate/page.tsx`, or any server route —
   this is purely `ConfirmClaim`'s own state/validation.

## Security considerations

- None new. `parseIdentity` already runs client-side in `ClaimBand` today;
  reusing it in `ConfirmClaim` doesn't change what reaches the server —
  server-side amount/category validation in `/api/orders` is untouched.
- The URL sent to `/api/orders` was already client-supplied and presumably
  re-validated/sanitized server-side (not touching that here) — no new trust
  boundary crossed.

## Acceptance criteria

- Typing `@handle` directly into the ConfirmClaim URL field normalizes it
  and enables the submit button (given name + agreement are also filled),
  identical to typing it in ClaimBand.
- Typing a plain domain (`example.com`) or full URL still works exactly as
  before.
- Invalid input (no dot, contains spaces, empty after `@`) shows the updated
  error copy and keeps submit disabled.
- Arriving at `/donate` via ClaimBand with a handle already resolves to
  `https://instagram.com/<handle>` in the field (unchanged from today, since
  ClaimBand already normalizes before the redirect).

## Checks to run

- `npm run lint` and `npm run build` in `web` (routes/config not touched, but
  build still worth running since this is the payment-adjacent flow).
- Manual test in Razorpay test mode: claim a rank from the leaderboard using
  `@somehandle`, confirm the confirm-page field shows the normalized URL,
  submit through to a test payment, confirm order creation succeeds.
- Manual test: land on `/donate` directly (no `url` param), type `@handle`
  into the field by hand, confirm submit enables and payload carries the
  normalized URL (check Network tab on the `/api/orders` POST).

## Manual test steps

1. `npm run dev` in `web`.
2. On `/`, use the claim band, type `@testhandle`, click "Claim rank."
3. On `/donate`, confirm URL field shows `https://instagram.com/testhandle`.
4. Clear the field, type `@anotherhandle` by hand — button should enable
   once name + checkbox are also filled.
5. Clear the field, type `not a url` — error shows, button stays disabled.
6. Fill in a real test flow, submit, confirm Razorpay test checkout opens and
   `/api/orders` payload's `url` field is the normalized `https://...` form
   (DevTools Network tab).
