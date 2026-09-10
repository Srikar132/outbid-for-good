# Implementation prompt: "Most active categories" section on /categories

## Goal
Add a "Most active categories" hero section to the top of `/categories` (highlighted card, top 3 categories ranked by most recent claim activity, each showing claim count / time-since-last-claim / current leader), matching the outbid.lol reference. Also add the missing "Categories" nav link (page exists today but isn't linked anywhere in the nav).

## Skills / docs read
- AGENTS.md (rules 2, 8 — category is a Sanity taxonomy, not a hardcoded enum; don't hardcode category names)

## Code inspected
- `app/categories/page.tsx` — already fetches `getLeaderboardData()` and builds `summaries` (per category: `topEntries`, `total`, `topAmount`) sorted by `topAmount`. No "most recently active" concept exists yet.
- `components/leaderboard/CategoryGrid.tsx` / `CategoryCard.tsx` — the existing full grid below the hero; staying as-is, unchanged.
- `lib/format.ts` — `timeAgo()` is hour/day-granularity only (`"5d ago"`, min `"1h ago"`), used by the main leaderboard rows. The reference needs minute-level precision ("14 minutes ago"), so adding a separate long-form helper rather than changing `timeAgo` and risking the existing rows' styling/behavior.
- `lib/category-icons.tsx` — `categoryIcons[slug]` + `defaultCategoryIcon` fallback; reusing as-is (categories are Sanity-driven, not hardcoded — this file already treats slugs as data, just maps known ones to an icon and falls back otherwise).
- `components/Nav.tsx` — just added the `Daily` link before `About`; adding `Categories` right after it the same way.

## Decisions / assumptions
- **"Most active" = most recent claim activity**, i.e. sort categories by their single most recent `confirmedAt` among that category's entries, descending. This matches the reference's data (all three example cards show "2 claims" but differ only in recency — "14 minutes ago" / "4 hours ago" / "9 hours ago" — so recency is the sort key, not claim count).
- Only categories with **at least 1 confirmed entry** are eligible (an empty category can't be "active"). Top 3 shown; if fewer than 3 categories have any entries, show only that many. If **zero** categories have any entries, the whole section is omitted (no empty "Most active" block), consistent with how the Today-top-ranking teaser and Daily page already handle the no-data case.
- Card content per active category: rank label (`#1 HOTTEST` for the first, `#2`/`#3` for the rest — matching the reference's exact copy), category icon + title, `{count} claims` and `{timeAgoLong(mostRecentConfirmedAt)}`, and a "Leading **{name}** — {amount}" line using that category's current top entry (`topEntries[0]`).
- New `timeAgoLong(iso)` helper in `lib/format.ts` for minute/hour/day granularity ("14 minutes ago", "4 hours ago", "2 days ago") — kept separate from the existing abbreviated `timeAgo` used elsewhere so the main leaderboard rows are untouched.
- This section sits above the existing full category grid, which is otherwise unchanged.
- Purely a read-side computation over data already fetched in `getLeaderboardData()` — no new Sanity query, no schema change.

## Files touched
- `lib/format.ts` — add `timeAgoLong(iso: string): string`.
- `app/categories/page.tsx` — compute the "most active" top-3 (most-recent-claim sort) alongside the existing `summaries`, pass to a new component.
- `components/leaderboard/MostActiveCategories.tsx` (new) — the tinted hero card with up to 3 sub-cards.
- `components/Nav.tsx` — add the `Categories` link next to the just-added `Daily` link.

## Requirements
- No new Sanity query.
- Section omitted entirely when there's no confirmed activity in any category.
- Existing `CategoryGrid`/`CategoryCard` grid below is unchanged.

## Security considerations
- None — read-only display of already-fetched, already-confirmed data.

## Acceptance criteria
- `npm run lint` passes clean (existing unrelated warnings aside).
- `npm run build` succeeds.
- `/categories` shows the "Most active categories" hero above the grid when at least one category has a confirmed entry, ranked by recency of last claim, with correct claim counts, "time ago" text, and leader name/amount.
- Section doesn't render when there's no confirmed activity anywhere.
- `Categories` appears in the nav and links to `/categories`.

## Checks to run
- `npm run lint`
- `npm run build`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000/categories`.
2. Confirm the "Most active categories" card appears above the grid, top category marked "#1 HOTTEST".
3. Confirm claim counts, "time ago" text, and "Leading {name} — {amount}" are correct for each shown category.
4. Click "Categories" in the nav from another page — confirm it navigates to `/categories`.
5. If there are currently very few confirmed entries, confirm the section still renders correctly with just 1–2 cards rather than breaking layout.
