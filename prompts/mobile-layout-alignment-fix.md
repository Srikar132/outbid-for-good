# Leaderboard & ClaimBand Mobile Alignment Fix

## 1. Goal
Fix alignment, spacing, and vertical centering issues across `LeaderboardList.tsx` and `ClaimBand.tsx` on mobile devices (down to 320px screen widths).

## 2. Identified Alignment Issues
1. **Leaderboard Entry Rows (`LeaderboardList.tsx`)**:
   - `items-start` on mobile created uneven top-alignment between the rank text `#1`, logo avatar, and name text.
   - Amount display on mobile was mixed into the top flex header without fixed vertical alignment with the rank/avatar.
   - Bullet point metadata line (`category`, `timeAgo`, `clicks`, `see details`) lacked uniform flex centering and vertical baseline alignment.
2. **Claim Band Input Pill (`ClaimBand.tsx`)**:
   - `px-6` on the "Claim rank" button crowded out the text input field on mobile screens (< 380px).
   - Category selector button and input field lacked consistent padding and flex shrink behavior.

## 3. Proposed Fixes
- **In `LeaderboardList.tsx`**:
  - Use `flex items-center` on the row `li` for vertical alignment across all screen sizes.
  - Standardize Rank `#1`: `text-body-lg sm:text-h3 font-extrabold w-6 sm:w-8 shrink-0 text-center text-accent-500`.
  - Standardize Logo Avatar: `h-11 w-11 sm:h-14 sm:w-14 shrink-0 flex items-center justify-center`.
  - Layout Main Content & Amount:
    - On mobile (< sm): Main info (name + tagline + metadata) on the left, amount cleanly aligned on the right in `flex shrink-0 flex-col items-end justify-center`.
    - Truncate long names (`truncate`) and long URLs (`max-w-[100px] sm:max-w-none truncate`).
  - Align Metadata Row: `flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-small text-neutral-500`.
- **In `ClaimBand.tsx`**:
  - Adjust "Claim rank" / "Reclaim rank" button padding to `px-4 sm:px-6` and `text-xs sm:text-sm` so the URL input field has space on narrow screens.
  - Ensure category button and favicon badge have consistent alignment and spacing.

## 4. Target Files
- `components/leaderboard/LeaderboardList.tsx`
- `components/leaderboard/ClaimBand.tsx`

## 5. Security & Boundary Considerations
- UI styling and alignment only.
- No changes to API routes, Sanity schemas, or Razorpay payment handlers.

## 6. Checks & Manual Verification
- Run `npx tsc --noEmit` to verify type safety.
- Run `npm run build` to verify production build.
- Test responsive viewports in browser (iPhone SE 375px, Pixel 7 412px, Desktop).
