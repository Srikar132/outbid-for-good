# Implementation prompt: Block claims below the floor in ClaimBand

## Goal
Stop a donor from sending a bid below the scope floor (`scopeTopAmount + minimumIncrement`) from `ClaimBand` to `/donate`. Today the "−" stepper stops at `minimumIncrement`, not at the floor. A typed amount only has a minimum of 1. "Claim rank" stays active when the amount is too low. The donor then lands on `/donate` and sees "This rank has changed", which blames a race that did not occur. AGENTS.md §7 says that the UI must reject a bid below the floor before payment.

This closes the gap that `prompts/manual-bid-amount-entry.md` flagged and left for later.

## Skills / docs read
- AGENTS.md §2 (prompt approval for bid-amount changes), §7 (must-outbid), §9–10 (server-side floor check).
- `prompts/manual-bid-amount-entry.md`, `prompts/scoped-claim-band-rank-preview.md`.

## Code inspected
- `components/leaderboard/ClaimBand.tsx`: `step()` clamps to `minimumIncrement`. `handleAmountBlur` clamps to 1. The "Claim rank" `Link` blocks the click only when no category is selected.
- `app/donate/page.tsx`: one error card for an invalid category and for a low amount. The heading is "This rank has changed" and the body says that someone may have claimed the rank.
- `app/donate/actions.ts`: `createClaim` checks the floor again on the server. This change does not touch it.

## Decisions
- The client floor is `Math.max(1, claimAmount)`. It uses the same `scopeTopAmount` prop that the page already sends, so it matches the server rule for the same scope.
- The "−" and "+" stepper buttons clamp to the floor. "−" is disabled at the floor.
- A typed amount stays as typed. The band does not silently raise the donor's money. If the amount is below the floor, the preview line shows "Below the current floor{scope}. Bid at least ₹X to claim." and "Claim rank" does nothing.
- A blur on an empty or zero field sets the floor, not 1.
- The check uses `amount < floor`, not `preview.rank > 1`. The preview is asynchronous, and a tie with the top amount can still show rank 1.
- A blocked click does not send `claim_rank_clicked`. So that event with `projected_rank > 1` must stay at 0. No new events (AGENTS.md §6).
- `/donate` now has two cards: the category card keeps its text, and the amount card says "Your bid is below the floor" and gives the amount and the floor. It does not say that someone claimed the rank.

## Files touched
- `components/leaderboard/ClaimBand.tsx`
- `app/donate/page.tsx`

## Security considerations
- None new. The server floor check in `createClaim` is unchanged and stays the real gate. This change is UI only.

## Acceptance criteria
- On any scope, "−" cannot go below the floor.
- A typed amount below the floor shows the inline hint, and "Claim rank" does not navigate.
- A direct visit to `/donate` with a low amount shows the new below-floor copy, without the race wording.
- `npx tsc --noEmit` and `npm run lint` pass.

## Checks to run
- `npx next typegen && npx tsc --noEmit`
- `npm run lint`
- `npm run build` (needs real Sanity env)

## Manual test steps
1. `npm run dev`, then open `/category/<slug>` where the category has entries.
2. Click "−" until it stops. Make sure that the amount is the scope top + the minimum increment, and that "−" is disabled.
3. Type an amount below the floor. Make sure that the hint shows in place of the rank preview and that "Claim rank" does not open `/donate`.
4. Clear the field and blur. Make sure that the amount becomes the floor.
5. Open `/donate?amount=1&category=<slug>&scopeCategory=<slug>` directly. Make sure that the card says "Your bid is below the floor" and gives the floor.
