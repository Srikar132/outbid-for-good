# Implementation prompt: "Today's top ranking" teaser section

## Goal
On the All-time leaderboard view, insert a compact "Today's top ranking" teaser section after the 3rd entry (matching the outbid.lol reference: a small "🔴 Today's top ranking ... See all →" strip with 3 mini rank cards, sitting between rank #3 and #4 of the main all-time list).

## Skills / docs read
- AGENTS.md (rules 2, 3, 7 — leaderboard is read-only/confirmed-only, Today is a filter within the active cycle, no new leaderboard/cycle concept)

## Code inspected
- `components/leaderboard/LeaderboardList.tsx` — renders the main `<ol>` of confirmed entries, one `<li>` per entry, numbered `#{index+1}` sequentially. No secondary/nested section today.
- `lib/filters.ts` — `filterEntries(entries, { categorySlug, today, q })` filters an already amount-sorted array (sort happens in the Sanity query, see below) and preserves order; `today` uses `isWithinLastDay(entry.confirmedAt)`.
- `sanity/lib/data.ts` — `getLeaderboardData()` returns `entries` for the active cycle already sorted by amount descending (confirms `scopeTopAmount` in `lib/filters.ts` can safely read `filtered[0]`).
- `lib/scope.ts` — `viewToggleHref("today", scope, q)` already builds the correct "switch to Today" URL for the current scope (`/today`, or `/category/{slug}?today=true` if a category is active), including preserving `q`. Reusing this for the section's "See all" link instead of hand-rolling a new URL builder.
- `app/page.tsx`, `app/today/page.tsx`, `app/category/[slug]/page.tsx` — all three already fetch the full (unfiltered-by-today) `entries` array and compute `filtered = filterEntries(entries, { ...scope, q })` for the main list. A second `filterEntries(entries, { categorySlug: scope.categorySlug, today: true, q })` slice (top 3) gives the teaser's data with no new Sanity query.

## Decisions / assumptions
- **Only shown on all-time views** (`!scope.today`) — on `/today` itself the main list already *is* today's ranking, so the teaser would be redundant. This means it renders on `/` and on `/category/[slug]` when not `?today=true`, never on `/today` or a category page with `?today=true`.
- **Position**: inserted immediately after the 3rd main-list entry (i.e., after index 2). If the main list has 3 or fewer entries, the teaser renders after the last one instead (no attempt to force a 4th slot that doesn't exist).
- **Empty state**: if there are zero confirmed entries today (in the current scope), the teaser doesn't render at all — no empty "Today's top ranking" block.
- **Content**: top 3 today-confirmed entries (independently ranked #1–#3 for *today*, not continuing the main list's numbering — matches the reference, where the mini section has its own #1/#2/#3). Each mini card shows rank, small logo/avatar, truncated name, amount — no tagline, click count, or "details" link (kept deliberately lighter than the full list rows).
- **Layout**: 3 cards in a row on `sm:` and up (`grid-cols-3`), stacked full-width on mobile (primary traffic per AGENTS.md §3) — this is the one layout judgment call being made without a mockup for the mobile case, since the reference screenshot is desktop-only.
- **"See all" link**: reuses `viewToggleHref("today", scope, q)` — no new URL logic.
- Purely a read display of already-confirmed data already being fetched — no new Sanity query, no ranking/payment logic touched, no change to how anything is written or validated.

## Files touched
- `components/leaderboard/TodayTopRanking.tsx` (new) — the teaser block: header row + up to 3 mini cards.
- `components/leaderboard/LeaderboardList.tsx` — accepts new optional props `todayTop?: LeaderboardEntryResult[]` and `todayHref?: string`; splices `<TodayTopRanking />` into the `<ol>` after the 3rd `<li>` (or at the end if fewer than 3 entries) when `todayTop` is non-empty.
- `app/page.tsx` — computes the today-top-3 slice and passes it + `viewToggleHref("today", scope, q)` to `LeaderboardList`.
- `app/category/[slug]/page.tsx` — same, but only when `!scope.today` (the page already handles both cases via the `today` search param).
- `app/today/page.tsx` — no change (teaser intentionally omitted here).

## Requirements
- No new Sanity fetch — reuse the `entries` already loaded per page.
- Teaser must not appear when scope is already `today: true`.
- Teaser must not appear when there are no confirmed entries today in that scope.
- Existing main-list rendering, numbering, and click-through behavior unchanged.

## Security considerations
- None — pure read-only display of already-confirmed, already-fetched data. No new data access, no write path.

## Acceptance criteria
- `npm run lint` passes clean (existing unrelated warnings aside).
- `npm run build` succeeds.
- On `/` with 4+ confirmed entries and at least 1 confirmed today, the teaser renders between rank #3 and #4.
- On `/` with 0 confirmed entries today, no teaser renders.
- On `/today`, no teaser renders regardless of data.
- "See all" navigates to the correct Today URL for the current scope (verified for both `/` → `/today` and a category page → `/category/{slug}?today=true`).

## Checks to run
- `npm run lint`
- `npm run build`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000`.
2. If there are fewer than 4 confirmed entries today, add test entries in Sanity Studio (or via existing seed data) so both the main list has 4+ entries and at least 1 is confirmed within the last 24h.
3. Confirm the "Today's top ranking" strip appears between rank #3 and #4, with up to 3 mini cards, correctly ranked and amount-sorted for today only.
4. Click "See all" — confirm it lands on `/today` (or `/category/{slug}?today=true` from a category page) showing the same entries as full rows.
5. Visit `/today` directly — confirm no teaser section appears there.
6. Temporarily filter/confirm a scenario with 0 entries today (or test on a fresh category with none) — confirm the teaser is omitted entirely, no empty block.
7. Resize to mobile width — confirm the 3 mini cards stack full-width and remain tappable.
