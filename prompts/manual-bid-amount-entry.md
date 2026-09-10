# Implementation prompt: Manual entry for the bid amount

## Goal
In `ClaimBand`, let the donor type the bid amount directly instead of only stepping it with the +/- buttons. The amount typed still only ever reaches the server as a value the existing server-side checks (floor, integer, rate limit) already validate — no new trust is placed in the client.

## Skills / docs read
- AGENTS.md (rules 2, 7, 9, 10 — must-outbid mechanic, "never trust a client-supplied amount", anti-abuse baseline)

## Code inspected
- `components/leaderboard/ClaimBand.tsx` — `amount` is `useState<number>(claimAmount)`, only ever changed by the `step()` handler on the +/- buttons; rendered as static text `₹{amount.toLocaleString("en-IN")}` inside the `<h1>`. `amount` feeds the rank-preview fetch (debounced) and the `claimHref` query string.
- `app/donate/actions.ts` (`createClaim`) — server already re-derives `floor = scopeTopAmount + minimumIncrement` from Sanity data and rejects with `{ code: "OUTBID", floor }` if `amount < floor`; also rejects non-integer/`< 1` amounts. The client amount is never trusted as-is today (the stepper can already be clicked below the floor — see gap noted below), so allowing typed input doesn't weaken anything the server enforces.
- `app/donate/page.tsx` — also independently checks `amountValid = amount >= floor` before rendering `ConfirmClaim`, showing a "This rank has changed" screen otherwise. This is the existing UI-level backstop for a stale/too-low amount, stepper or typed.

## Decisions / assumptions
- Replace the static `<span>` amount display with an `<input>` inline in the `<h1>`, styled to match (`text-display`, `tabular-nums`, accent color), so it reads the same as today until focused.
- Track the raw text in a new `amountText: string` state (init `String(claimAmount)`); derive the numeric `amount` from it each render (`parseInt(amountText, 10) || 0`). `step()` now writes `amountText`.
- While typing: strip non-digit characters on every keystroke (`inputMode="numeric"`, `pattern="[0-9]*"`), no comma formatting (matches the reference screenshot's unformatted `$17006`), no forced floor-clamping mid-keystroke (so the user can clear the field and type a fresh number).
- On blur: clamp to a minimum of 1 (`Math.max(1, amount)`) and write the clamped value back so the field never sits empty/zero. This mirrors the existing stepper's floor of `minimumIncrement`, not the true bid floor — see gap below.
- Fire the existing `claim_amount_adjusted` PostHog event on blur when the committed amount actually changed (not on every keystroke), with `direction: "manual"`.
- **Gap flagged, not fixed here** (out of scope per the user's ask, but worth calling out per AGENTS.md §10 "flag any gap you see"): neither the stepper today nor this change stops a donor from typing/stepping to an amount below the real floor (`scopeTopAmount + minimumIncrement`) and clicking "Claim rank" — they just land on `/donate` and see a generic "This rank has changed" rejection instead of an inline warning before they click. A follow-up could disable "Claim rank" / show a live "below current floor" warning in `ClaimBand` itself using the already-fetched `preview` data. Flagging for a decision, not building it now.

## Files touched
- `components/leaderboard/ClaimBand.tsx` only.

## Requirements
- No behavior change to the rank-preview fetch, `claimHref`, category picker, or identity input — only how `amount` is produced.
- Input must be keyboard-accessible (numeric input, proper `aria-label`), and clicking the +/- buttons must keep working exactly as before.
- No new client-side trust: the amount is still just a query param to `/donate`, still re-validated server-side.

## Security considerations
- None new. This is a client-side input UX change; `createClaim`'s server-side floor/integer checks are unchanged and remain the actual gate.

## Acceptance criteria
- `npm run lint` passes clean (existing unrelated warnings aside).
- `npm run build` succeeds.
- Clicking into the amount lets you type a number directly; leaving it blank and blurring resets to `1` rather than crashing or showing `NaN`.
- Typing updates the "rank #X" preview text (debounced, same as today) and the amount carried into "Claim rank".
- +/- buttons still increment/decrement by `minimumIncrement` from whatever was typed.

## Checks to run
- `npm run lint`
- `npm run build`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000`.
2. Click the amount in "Claim rank... for ₹X" — confirm it becomes editable and existing digits are selected.
3. Type a new number (e.g. a large value well above the current floor) — confirm the "rank #X of Y" text below updates after the debounce.
4. Click elsewhere to blur — confirm the amount stays as typed (formatted the same as before once you look at "Claim rank" link's resulting `/donate?amount=...`).
5. Clear the field entirely and blur — confirm it resets to `1`, not blank/`NaN`.
6. Click the +/- buttons after typing — confirm they step from the typed value by the configured minimum increment.
7. Click "Claim rank" with a manually-typed amount below the current floor — confirm you land on `/donate` and see the existing "This rank has changed" rejection (same as today's stepper behavior), not a client-side crash.
