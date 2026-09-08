# Refactor claim/checkout flow to Zod + useActionState + typed errors + Script

## Goal

Replace the current client-fetch-driven claim flow (`ConfirmClaim.tsx` →
`fetch("/api/upload-logo")` → `fetch("/api/orders")` → manually-loaded
Razorpay `checkout.js` via a hand-rolled script-injection promise) with:

- **Zod** schemas as the single source of truth for claim-form validation,
  shared between client (instant feedback) and server (authoritative check —
  client validation is never trusted alone).
- React 19's **`useActionState`** driving the form, per
  `node_modules/next/dist/docs/01-app/02-guides/forms.md`.
- A **Server Action** replacing both `/api/orders` and `/api/upload-logo`
  route handlers (this app has only one caller of each — `ConfirmClaim.tsx`
  — so folding them into one action removes a redundant round trip without
  losing anything).
- **Typed, discriminated error results** instead of `{ error: string }`
  blobs — every failure path gets a stable `code`, so the client can branch
  on cause (rate-limited vs. outbid vs. moderation vs. server misconfig)
  instead of string-matching.
- Razorpay's checkout script loaded via **`next/script`**
  (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md`)
  instead of manual `document.createElement("script")`.

This only touches the claim/checkout UI and its server-side order-creation
logic. It does not touch the webhook route, ranking/floor logic's math, or
the Sanity schema — those stay exactly as they behave today, just re-homed.

## Skills / docs read

- `node_modules/next/dist/docs/01-app/02-guides/forms.md` — Server Action
  forms, `useActionState`, passing extra args via `.bind()`, pending states.
- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` — security
  model (every action is an untrusted POST entry point regardless of what
  page renders the form; framework CSRF/body-size/encryption are not a
  substitute for input validation, which this refactor adds via Zod).
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md`
  — `<Script>` strategies; using `afterInteractive` + `onReady`/`onError`
  instead of a manual script-load promise.
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/headers.md`
  — `headers()` is async in this Next.js version; Server Actions read the
  client IP via `await headers()`, not `NextRequest` (route handlers get a
  `NextRequest`; actions don't).

## Code inspected

- `components/leaderboard/ConfirmClaim.tsx` — current client state machine
  (`idle/submitting/submitted/cancelled/failed`), manual `loadCheckoutScript`
  script-injection singleton promise, two sequential `fetch` calls, `canSubmit`
  gate using `parseIdentity` (just fixed to match `ClaimBand.tsx`).
- `app/api/orders/route.ts` — full server-side validation today: rate limit
  (`checkRateLimit`, keyed by `getClientIp(req)`), manual `typeof` checks per
  field, `moderateNames`, active-cycle lookup, category existence checks,
  floor re-check against live confirmed entries (`scopeTopAmount`), Sanity
  entry creation (`status: "pending"`), Razorpay order creation, a
  `razorpayOrderId` patch back onto the entry, PostHog `order_created` capture.
  All error responses are `NextResponse.json({ error: string }, { status })`
  — no error codes today.
- `app/api/upload-logo/route.ts` — separate rate limit bucket
  (`upload:${ip}`), image type/size checks, uploads to
  `writeClient.assets.upload`. Only ever called right before `/api/orders`
  from the same form submission.
- `lib/rate-limit.ts`, `lib/moderation.ts`, `lib/identity.ts`,
  `lib/filters.ts` — pure/server-safe helpers, no `NextRequest` coupling
  except `lib/request.ts`.
- `lib/request.ts` — `getClientIp(req: NextRequest)` reads
  `x-forwarded-for` off `req.headers`. Needs a header-source-agnostic version
  since Server Actions don't receive a `NextRequest`.
- `app/donate/page.tsx` — Server Component reading `searchParams`, already
  re-validates `amount`/`category` against the live floor before rendering
  `ConfirmClaim` at all (`categoryInvalid` / `amountValid` checks). This stays
  untouched; it's the page's own defense-in-depth, independent of the action.

## Decisions / assumptions

- **One Server Action, not two.** `createClaim` handles logo upload (if a
  file is present in the submitted `FormData`) and order creation in a single
  function. Rationale: they were always called together from one form
  submission, sequentially, by the one caller; merging removes a network
  round trip and a class of "logo uploaded but order failed, orphaned asset"
  timing question is unchanged (still upload-then-create, just server-side
  now instead of client-orchestrated). Route handlers
  `app/api/orders/route.ts` and `app/api/upload-logo/route.ts` get deleted.
- **`app/donate/actions.ts`** is the new file (`"use server"` at the top),
  colocated with `app/donate/page.tsx`. Not `lib/`, since this is a page-level
  mutation, not a shared utility.
- **`lib/validation/claim.ts`** holds the Zod schema(s), importable from both
  the client (`ConfirmClaim.tsx`, for live per-field errors as the user types)
  and the action (authoritative check). The identity/URL field's schema
  wraps `parseIdentity` from `lib/identity.ts` via `z.string().transform()`
  with `ctx.addIssue` + `z.NEVER` on failure, replacing the ad hoc
  `isValidHttpUrl`/`parseIdentity` checks duplicated across `ConfirmClaim.tsx`
  and `app/api/orders/route.ts` today.
- **Error shape** — a discriminated union so the client can branch without
  string matching:
  ```ts
  type ClaimError =
    | { code: "VALIDATION"; fieldErrors: Partial<Record<ClaimField, string[]>> }
    | { code: "RATE_LIMITED"; retryAfterMs?: number }
    | { code: "MODERATION_REJECTED"; reason: string }
    | { code: "NO_ACTIVE_CYCLE" }
    | { code: "CATEGORY_NOT_FOUND" }
    | { code: "OUTBID"; floor: number }
    | { code: "UPLOAD_FAILED" }
    | { code: "ENTRY_CREATE_FAILED" }
    | { code: "ORDER_CREATE_FAILED" }
    | { code: "SERVER_MISCONFIGURED" };

  type ClaimState =
    | { status: "idle" }
    | { status: "error"; error: ClaimError }
    | {
        status: "success";
        order: { orderId: string; amount: number; currency: string; keyId: string; entryId: string };
      };
  ```
  The action never throws for expected failures (bad input, outbid, rate
  limit) — it returns `{ status: "error", error }`. It only lets an exception
  propagate for truly unexpected failures (e.g. a Sanity/Razorpay SDK throwing
  something not already caught), which Next.js turns into the nearest
  `error.tsx` boundary — this matches "constrain return values, validate
  inputs" from the Server Actions security doc, and gives the UI a fixed set
  of `code`s to render copy for instead of trusting free-text messages.
- **Client-side copy stays server-owned.** The action returns `code`s, not
  final UI strings — `ConfirmClaim.tsx` maps `code` → user-facing message
  (keeps wording centralized in the component, not duplicated server-side).
- **`getClientIp`** changes signature to take a `Headers`-like object
  (`{ get(name: string): string | null }`) instead of `NextRequest`, so both
  the (unrelated, untouched) route handlers and the new Server Action can
  call it — the action passes `await headers()` from `next/headers`.
- **Script loading**: `<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={...} onError={...} />`
  rendered inside `ConfirmClaim.tsx` (only mounted on `/donate`, so it never
  loads on pages that don't need it). `onReady` sets a `scriptReady` boolean;
  Razorpay checkout only opens once both `scriptReady` and a successful
  `state.status === "success"` are true (effect keyed on both, guarded by a
  ref so it only opens once per successful order). `onError` surfaces a
  local "couldn't load checkout, try again" message distinct from the
  action's error codes (it's a client-only failure, the action never ran).
- **Pending state**: `useActionState` returns `[state, formAction, pending]`;
  `pending` replaces the old manual `status === "submitting"` check for
  disabling the submit button / label text. The post-order UI states
  (`submitted` from Razorpay's `handler`, `cancelled` from `modal.ondismiss`,
  `failed` from a checkout-open exception) stay as local `useState` in
  `ConfirmClaim.tsx` exactly as today — those are client-only payment-widget
  events, not Server Action state.
- **Amount/category/scope/today** are passed to the action via `.bind()`
  (the docs' recommended pattern for non-form-field arguments) rather than
  hidden inputs — the action re-validates all of them against the live floor
  and category list regardless, same as today, so this is not a new trust
  boundary either way, just avoids hidden-input tampering being the first
  line of defense.
- Not adding zod validation to `app/donate/page.tsx`'s own `searchParams`
  parsing — out of scope, that logic is unchanged and works today.
- Not touching `/api/entry-lookup` or `/api/rank-preview` (used by
  `ClaimBand.tsx` for live polling/preview) — those are reads, a Server
  Action would gain nothing there per the forms guide's own guidance to use
  Route Handlers for non-mutation requests.

## Files expected to touch

- New: `lib/validation/claim.ts` (Zod schemas + inferred types)
- New: `app/donate/actions.ts` (`"use server"`, the `createClaim` action)
- Edit: `components/leaderboard/ConfirmClaim.tsx` (rewrite to
  `useActionState` + `<Script>`, keep the post-order local status UI)
- Edit: `lib/request.ts` (`getClientIp` takes a `Headers`-like param)
- Delete: `app/api/orders/route.ts`
- Delete: `app/api/upload-logo/route.ts`
- Add dependency: `zod` (not currently in `package.json`)

## Requirements

1. `zod` added to `package.json` dependencies (latest stable v4).
2. `lib/validation/claim.ts` exports a schema covering: `displayName`
   (required, 1–60 chars, trimmed), `companyName` (optional, ≤60 chars),
   `identity`/url-or-handle (required, using `parseIdentity`, normalized
   output), `tagline` (optional, ≤140 chars), and a logo file
   constraint (image `type`, ≤2MB) — mirroring today's limits exactly, no
   silent tightening or loosening.
3. `app/donate/actions.ts`'s `createClaim` action:
   - Re-implements today's `/api/orders` + `/api/upload-logo` logic:
     rate limit (both buckets preserved — order attempts and upload attempts
     tracked the way they are today, or combined if you can justify it's
     equivalent — flag the choice either way), Zod parse → `VALIDATION`
     error with `fieldErrors` on failure, moderation, active-cycle check,
     category checks, live floor re-check → `OUTBID` with the current floor,
     Sanity entry creation, logo upload (if file present) before or as part
     of entry creation, Razorpay order creation, `razorpayOrderId` patch,
     PostHog `order_created` capture — all preserved.
   - Never trusts amount/category from the bound args alone; re-validates
     against a fresh Sanity read exactly as `/api/orders` does today.
   - Returns the typed `ClaimState` shape from Decisions above.
4. `ConfirmClaim.tsx`:
   - Uses `useActionState(createClaim.bind(null, amount, categorySlug, scope.categorySlug ?? null, !!scope.today), { status: "idle" })`
     (or equivalent) for `[state, formAction, pending]`.
   - Renders Zod field errors inline per-field as the user types (client-side
     `safeParse` for instant feedback) AND after a server round trip
     (`state.error.code === "VALIDATION"` → `state.error.fieldErrors`).
   - Maps every other `ClaimError.code` to the same user-facing copy that
     exists today (e.g. `OUTBID` → "Someone else has claimed this. The
     current floor is ₹{floor}.", `RATE_LIMITED` → "Too many attempts. Wait a
     minute and try again.") — no regression in message quality.
   - Loads `checkout.js` via `<Script>`, opens Razorpay only after both the
     script is ready and the action succeeded, keeps the existing
     `submitted`/`cancelled`/`failed` post-checkout screens and PostHog
     capture calls (`checkout_started`, `checkout_payment_submitted`,
     `checkout_cancelled`, `checkout_failed`, `logo_uploaded`) unchanged.
5. `lib/request.ts`'s `getClientIp` accepts a `Headers`-like object; its one
   existing caller in `app/api/click/[id]/route.ts` (if any — verify during
   implementation) and any other route handler still using it are updated to
   pass `req.headers` instead of `req`.
6. Delete `app/api/orders/route.ts` and `app/api/upload-logo/route.ts` once
   `createClaim` fully replaces them.
7. No change to `/api/entry-lookup`, `/api/rank-preview`, `/api/click/[id]`,
   the webhook (there is no webhook route yet per earlier work — if one
   exists, do not touch it), the Sanity schema, or the floor/ranking math in
   `lib/filters.ts`.

## Security considerations

- Per the Server Actions security doc: the action is a public POST endpoint
  regardless of which page renders the form. All server-side checks that
  exist today (rate limit, moderation, floor re-check, category existence,
  active-cycle check) must be preserved exactly — Zod only checks shape, not
  business rules, so it does not replace any of those checks.
- Zod validation happens **inside** the action, not only on the client —
  client-side `safeParse` is UX-only, never trusted as the source of truth
  (matches this project's existing "never trust a client-supplied amount"
  rule, extended to every field here).
- `getClientIp` must still work correctly behind whatever proxy Vercel uses
  — `x-forwarded-for` via `headers()` in a Server Action reflects the same
  incoming request headers a Route Handler would see, so behavior is
  unchanged, just re-sourced.
- Return values from `createClaim` must not leak anything beyond what the
  client needs (order id/amount/currency/keyId/entryId on success, or a
  `code` + minimal context on error) — no raw Sanity documents, no stack
  traces, no internal error messages from Razorpay/Sanity SDKs surfaced
  verbatim to the client.
- Logo upload keeps its own size/type checks inside the action before
  touching Sanity — do not rely on the `<input type="file" accept="image/*">`
  browser hint as a security boundary (it isn't one today either, but stating
  it explicitly here since this is a rewrite).

## Acceptance criteria

- Claiming a rank end-to-end (name, optional company, URL or `@handle`,
  optional tagline, optional logo) behaves identically to today from the
  donor's point of view: same validation messages (or clearer, never
  vaguer), same Razorpay checkout opening, same post-payment screens.
- Submitting invalid input (bad URL/handle, empty name, oversized logo,
  tagline over 140 chars) shows per-field errors without a full page
  reload, both on first client-side check and if a value that passes client
  validation somehow fails server validation.
- Submitting an amount that's since been outbid (floor moved) while the
  Confirm screen was open shows the current floor, same as today's
  `/api/orders` 400 case.
- Rate limiting still triggers after the same attempt threshold.
- `npm run build` succeeds with the two route handlers removed and no
  leftover imports pointing at them.
- No TypeScript `any` introduced for the error/state types — the
  discriminated unions above (or an equivalent you propose) must type-check
  such that accessing `error.fieldErrors` requires first narrowing on
  `error.code === "VALIDATION"`.

## Checks to run

- `npm run lint`
- `npm run build` (routes deleted, new Server Action file, config-adjacent
  change to `lib/request.ts` — build required per project rules)
- Manual Razorpay test-mode walkthrough (below) — required before reporting
  this done, since this rewrites the payment path.

## Manual test steps

1. `npm run dev`.
2. From `/`, claim a rank with a valid `@handle`, name, and a small logo
   image. Confirm inline validation behaves (try an invalid tagline length,
   an invalid URL, an oversized image first, see the button stay disabled
   with the right message each time).
3. Submit with valid data. Confirm the submit button shows a pending state
   during the action, then Razorpay's test checkout opens.
4. Complete a Razorpay test-mode payment. Confirm the "Payment submitted"
   screen appears and the entry later shows as confirmed on the leaderboard
   once the webhook (if present) or manual Studio confirmation processes it.
5. Repeat, but dismiss the Razorpay modal instead of paying — confirm
   "Checkout cancelled" screen, "Try again" resets to the form with prior
   inputs cleared or preserved (match today's behavior).
6. Open two browser tabs on the same claim; submit a lower/equal amount in
   the second after the first succeeds — confirm the `OUTBID` error with the
   correct current floor.
7. Submit 6 times rapidly to trigger the rate limit — confirm the
   `RATE_LIMITED` message appears instead of a generic error.
8. Check the Network tab: confirm there is no more `/api/orders` or
   `/api/upload-logo` request — the claim happens via the Server Action's
   POST to the current route.
