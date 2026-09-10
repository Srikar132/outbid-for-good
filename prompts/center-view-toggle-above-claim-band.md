# Implementation prompt: Move All-time/Today toggle above the claim headline

## Goal
Reposition the existing `ViewToggle` (All-time / Today) so it renders as its own centered row directly above the "Claim rank... for ₹X" headline, matching the outbid.lol reference layout the user shared (toggle centered above "Claim #1 for $X"). Currently it sits to the right of `CategoryTabs`, below the claim band.

## Skills / docs read
- AGENTS.md (rules 2, 3, 7)
- `node_modules/next/dist/docs/` — not needed, no routing/data-fetching change.

## Code inspected
- `components/leaderboard/ClaimBand.tsx` — renders the "Claim rank{label} for ₹{amount}" headline and the claim input row. Receives `scope`, `scopeTopAmount`, `minimumIncrement`, `categories`. Does not currently receive `q` or render `ViewToggle`.
- `components/leaderboard/ViewToggle.tsx` — link-based (no client JS) pill toggle between `/` (`all-time`) and `/today` (or scoped equivalents via `viewToggleHref`). Pure presentational, takes `scope` and optional `q`.
- `components/leaderboard/CategoryTabs.tsx` — link-based category pills, unrelated to this change.
- `components/leaderboard/LeaderboardSection.tsx` — currently renders `CategoryTabs` and `ViewToggle` side by side in one flex row, above `LeaderboardList`.
- `app/page.tsx`, `app/today/page.tsx`, `app/category/[slug]/page.tsx` — all three compose `<ClaimBand ... />` then `<LeaderboardSection ... />` identically, so this change needs to apply consistently across all three (no page-specific logic).

## Decisions / assumptions
- This is a pure layout/presentation change — no new data, no ranking/payment logic touched, so it's low-risk, but still going through the prompt-approval step per AGENTS.md §2.
- `ViewToggle` moves to render inside `ClaimBand`, centered, as the first element in the section — above the "Claim rank..." headline — matching the reference image's stacked order (toggle → headline → input row).
- `ViewToggle` is removed from `LeaderboardSection`'s row so it doesn't appear twice. `LeaderboardSection` keeps `CategoryTabs` alone in that row (it will now span/left-align on its own).
- `ClaimBand` needs a new optional `q` prop to pass through to `ViewToggle` (for preserving the search query string in the toggle links), matching how `LeaderboardSection` already receives `q`. All three call sites (`app/page.tsx`, `app/today/page.tsx`, `app/category/[slug]/page.tsx`) already have `q` in scope from `searchParams`, so this is a one-line prop addition at each call site.
- No change to `viewToggleHref`, `Scope`, or any routing/URL logic — purely moving where the existing component renders.

## Files touched
- `components/leaderboard/ClaimBand.tsx` — import `ViewToggle`, accept `q?: string` prop, render `<ViewToggle scope={scope} q={q} />` centered above the headline.
- `components/leaderboard/LeaderboardSection.tsx` — remove `ViewToggle` import/usage from the tabs row.
- `app/page.tsx` — pass `q={q}` to `ClaimBand`.
- `app/today/page.tsx` — pass `q={q}` to `ClaimBand`.
- `app/category/[slug]/page.tsx` — pass `q={q}` to `ClaimBand` (pending confirmation it follows the same shape as the other two pages).

## Requirements
- Toggle must remain a server-rendered `<Link>`-based component (no new client state) — do not convert it to a client toggle.
- Toggle must render identically (same active/inactive styling) in its new position.
- No duplicate toggle rendered anywhere on the page.
- Responsive: centered on all breakpoints, doesn't crowd the headline on mobile (primary traffic per AGENTS.md §3).

## Security considerations
- None — no data layer, payment, or webhook code touched. Pure UI composition change.

## Acceptance criteria
- `npm run lint` passes clean.
- `npm run build` succeeds.
- On `/`, `/today`, and `/category/[slug]`, the All-time/Today toggle appears once, centered, directly above the "Claim rank... for ₹X" headline.
- Clicking "Today"/"All-time" still navigates correctly and preserves the active category and `?q=` search term.
- `CategoryTabs` still renders correctly on its own in the row above `LeaderboardList`.

## Checks to run
- `npm run lint`
- `npm run build`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000`.
2. Confirm the All-time/Today pill toggle now sits centered above "Claim rank... for ₹X", and is no longer next to the category tabs.
3. Click "Today" — confirm URL becomes `/today`, toggle highlights "Today", category tabs row still works.
4. From `/today`, click a category tab (e.g. "Individual") — confirm URL preserves `today=true`, toggle still shows "Today" active.
5. Add `?q=test` to the URL — confirm both the category tab links and the toggle links preserve `q=test`.
6. Resize to mobile width — confirm the toggle stays centered and doesn't overlap the headline or +/- buttons.
