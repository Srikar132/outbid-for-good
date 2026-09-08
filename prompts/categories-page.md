# Implementation prompt: `/categories` index page

## Goal
Add a top-level `/categories` page — a grid of category cards (one per Sanity `category` doc), each showing that category's top confirmed donors within the active cycle and a link into `/category/[slug]` for the full ranking. Modeled loosely on outbid.lol's Categories page (screenshot supplied by user), adapted to this app's tone and data shape.

## Skills / docs read
- AGENTS.md §2 (workflow — this is a read-only display page, not money/webhook/ranking logic, but still gets a prompt per the standard loop), §3 (mobile-first, trustworthy-not-gimmicky visual tone), §7 (category is a Sanity taxonomy, not hardcoded; must-outbid amount is always the *global* top, never category-scoped — this page must not imply otherwise), §8 (entry/category/cycle shape).
- `node_modules/next/dist/docs/` — confirmed this is a plain Server Component page, no new route segment config needed.

## Code inspected
- `app/category/[slug]/page.tsx`, `app/page.tsx` — existing pattern: fetch `getLeaderboardData()` once, derive filtered views with `lib/filters.ts`, no client state.
- `sanity/lib/data.ts` / `queries.ts` — `getLeaderboardData()` already returns `{ cycle, categories, siteConfig, entries }` for the active cycle's confirmed entries in one call (cached/live). No new GROQ query needed — grouping by category can happen in-memory, consistent with how `filterEntries` already works at this scale (one cycle, realistically dozens–hundreds of entries).
- `lib/filters.ts` — `filterEntries(entries, { categorySlug })` and `scopeTopAmount` are reusable as-is to get each category's top amount and entry count.
- `lib/category-icons.tsx` — icon per category slug (`individual`, `company`, `brand`, `all`). Falls back to `undefined` for categories seeded in Studio that aren't in this map yet — need a default icon (`LayoutGrid`, matching the "All" tab's icon) rather than rendering nothing.
- `components/leaderboard/LeaderboardList.tsx` — existing rank-row visual language (rank number, tinted icon tile, name, amount) — reused at smaller scale inside each category card rather than reinvented.
- `components/ui/Card.tsx` — plain `Card` wrapper exists; category cards build on it.
- `components/Nav.tsx` — no "Categories" nav link exists today; screenshot's top nav has one. Adding it.
- `lib/format.ts` — `formatAmount` reused for amounts.

## Decisions / assumptions — please confirm before I build
1. **No "online visitors" / "1,510,645 total visitors" / "X claims" marketplace chrome.** That's outbid.lol's multi-tenant SaaS framing (many independent sellers "claiming" slots). This is one cause, one leaderboard — I'll drop that chrome entirely rather than fake numbers or repurpose them into something misleading.
2. **No separate "hottest / most active" hero row.** The screenshot has 3 featured cards above a plain grid, ranked by recent claim activity. This app doesn't track per-category "claim recency" as its own concept beyond `confirmedAt` on entries, and inventing a "hot" heuristic feels like manufactured urgency for a donation site (fights the "trustworthy not gimmicky" instruction in §3). I'll render one flat, equal-treatment grid of all categories instead, ordered by current category top-amount descending (highest-stakes category first) — tell me if you actually want a featured/hero row and what should drive "hot."
3. **Each card shows up to 3 top confirmed donors** (rank, name/company, amount) for that category in the active cycle, plus a confirmed-donor count and a "See full ranking →" link to `/category/[slug]`. A category with zero confirmed entries still gets a card ("No claims yet — be the first") linking into its (empty) `/category/[slug]` page, not hidden — so newly-seeded categories in Studio are still visible/browsable.
4. **Amounts shown are category-scoped tops, for information only** — this page never implies a donor can beat the *category* top to take rank #1; the real must-outbid target is always the global top (§7), which is already enforced correctly on `/category/[slug]`'s `ClaimBand`. I'll add a small "beating this doesn't guarantee #1 overall" style caption only if the page reads ambiguous once built — flag if you'd rather I add it unconditionally.
5. **No new GROQ query.** Grouping entries by category happens in-memory from the same `getLeaderboardData()` call every other route already makes, consistent with current scale assumptions. If category/entry counts ever grow large, this would want a dedicated aggregation query — not needed now.
6. **Adding a "Categories" link to `Nav.tsx`** (next to "Our Cause"), pointing at `/categories`, visible on all routes (not just leaderboard routes).

## Files touched
- `app/categories/page.tsx` (new) — Server Component. Fetches `getLeaderboardData()`, builds a per-category summary (`topEntries` via `filterEntries` + slice(0,3), `total` count, `topAmount` via `scopeTopAmount`), sorts by `topAmount` desc, renders `CategoryGrid`.
- `components/leaderboard/CategoryGrid.tsx` (new) — grid of `CategoryCard`s, responsive (1 col mobile, 2 col tablet, 3 col desktop — matches screenshot's breakpoints).
- `components/leaderboard/CategoryCard.tsx` (new) — one category's card: icon + title, top-3 mini-rank-list (reusing the visual language from `LeaderboardList`, not the component itself since it needs a compact variant), donor count, "See full ranking →" link to `/category/[slug]`.
- `lib/category-icons.tsx` — add a fallback export (e.g. `defaultCategoryIcon = LayoutGrid`) so a Studio-added category without a matching icon key still renders something instead of nothing.
- `components/Nav.tsx` — add a `Categories` link to `/categories`.

## Requirements
- Server-rendered, no client state — same pattern as every other leaderboard route.
- Every category doc from Sanity appears as a card, including ones with zero confirmed entries.
- Cards are ordered by category top-amount descending; ties broken by category title alphabetically.
- Each card's "See full ranking" links to the real `/category/[slug]` route (already exists, unchanged).
- No must-outbid claim is made against a category-scoped amount anywhere on this page.
- Mobile-first responsive grid, dark-mode consistent with existing surface/ring tokens (`bg-surface`, `dark:ring-1 dark:ring-white/5`).

## Security considerations
- Read-only page, no payment/webhook/write path touched. Uses the same server-side `getLeaderboardData()` fetch (server-only read token) as every other route — no new client-side Sanity access introduced.

## Acceptance criteria
- `npm run lint` and `npm run build` pass clean.
- Visiting `/categories` shows one card per Sanity category document, sorted by top amount desc.
- A category with no confirmed entries still shows a card with an empty/"no claims yet" state and a working link into `/category/[slug]`.
- Clicking "See full ranking" on any card lands on the correct `/category/[slug]` and matches that category's actual top entries.
- Nav shows a "Categories" link on every route, working on mobile and desktop.

## Checks to run
- `npm run lint`
- `npx tsc --noEmit` (or `npm run build`)
- `npm run build`
- You already have `npm run dev` running — manual test against that.

## Manual test steps (for you to run)
1. Visit `/categories` — confirm one card per category configured in Studio, ordered by top amount descending.
2. Confirm a category with zero confirmed entries still renders a card (empty state), not omitted.
3. Click "See full ranking" on a populated category card — confirm it lands on `/category/[slug]` and the top-3 shown on the card match the top of that page's full list.
4. Click "Categories" in the nav from `/`, `/today`, and an entry-detail page — confirm it always reaches `/categories`.
5. Resize to 375px — confirm the grid collapses to a single column and cards remain readable.
6. Toggle dark mode — confirm card surfaces/borders match the rest of the site.
