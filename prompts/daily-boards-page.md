# Implementation prompt: "Daily" page — UTC-day boards

## Goal
Add a new `/daily` page (linked from the nav) that groups already-confirmed leaderboard entries into one read-only board per UTC calendar day — today shown as "Live", past days shown as closed history — matching the outbid.lol reference. Confirmed via `AskUserQuestion`: this is additive (new page + nav link), does not touch or replace the existing All-time/Today toggle or any other page.

## Skills / docs read
- AGENTS.md (rules 2, 5, 7, 14 — leaderboard reads are server-side/confirmed-only, "resist the urge to build... anything else 'for later' without asking", cycles/scheduling need explicit confirmation before building)

## Code inspected
- `lib/format.ts` — has `isWithinLastDay` (rolling 24h) but nothing for UTC-calendar-day bucketing; will add a small helper here rather than duplicate logic inline.
- `app/categories/page.tsx` + `components/leaderboard/CategoryGrid.tsx` + `CategoryCard.tsx` — the closest existing precedent for "fetch once, group in the page, render read-only cards" with no new Sanity query; following the same shape for `/daily`.
- `components/leaderboard/LeaderboardList.tsx` — already renders a full ranked list of entries (logo, name, amount, tagline, click count, details link) from a plain `LeaderboardEntryResult[]`; reusing this as-is for each day's entries (without the `todayTop` teaser prop, so no nested teaser inside a daily card).
- `sanity/lib/data.ts` (`getLeaderboardData`) — `entries` is the active cycle's confirmed entries, already sorted by amount descending. Grouping by day preserves that order within each day (no re-sort needed).
- `components/Nav.tsx` — text nav links (`About`, `Our Cause`) are plain `<Link>`s in a row; adding `Daily` alongside them, before `About` (matches the reference's nav ordering with Daily first).

## Decisions / assumptions
- **UTC-day bucketing, not a new scheduler**: "today opens / yesterday closes" isn't a cron job or new Sanity field — it's purely computed at render time from each entry's existing `confirmedAt` timestamp (`new Date(confirmedAt).toISOString().slice(0, 10)` groups by UTC calendar date; comparing to today's UTC date via the same method tells us which single group is "Live"). No new schema, no new write path, no automation — this stays squarely display-only, so it doesn't trigger AGENTS.md's "confirm before building a scheduler" concern.
- **Scope stays inside the active cycle**: this only groups the same `entries` already fetched for the active cycle (same data other pages use) — it does not reach into past (inactive) cycles. No cross-cycle history is being built here.
- **A day only exists if it has at least one confirmed entry** — no rendering of empty placeholder days for dates with zero activity (there's no reliable "site launch date" to anchor an empty calendar from, and the reference itself only lists days that had claims).
- **Live day**: the single group whose UTC date matches today's UTC date (if any) gets a "Live" badge + "This day is still open for claims" caption, same framing as the reference. Past days just show the date and listing count, no status copy implying anything is "closed to new claims" (nothing in this codebase actually closes a day to new bids — a new confirmed entry today just lands in today's live group, that's it).
- **Full entries per day, not capped** — each day's board reuses `LeaderboardList` as-is (same rows as the main leaderboard), no separate top-3-only card style. Simpler and consistent with `LeaderboardList` already existing.
- **Nav placement**: `Daily` added as a new text link in `components/Nav.tsx`, positioned before `About`.

## Files touched
- `lib/format.ts` — add `utcDateKey(iso: string): string` and `formatUtcDate(dateKey: string): string` helpers.
- `app/daily/page.tsx` (new) — fetches `getLeaderboardData()`, groups `entries` by UTC day, renders one `DailyBoard` per group (most recent first).
- `components/leaderboard/DailyBoard.tsx` (new) — one day's card: header (date, Live badge + caption if live, else listing count), then `<LeaderboardList entries={dayEntries} />`.
- `components/Nav.tsx` — add the `Daily` link.

## Requirements
- No new Sanity query — reuse `getLeaderboardData()`'s existing `entries`.
- Read-only; no write path, no new document type, no scheduled job.
- Empty overall state (zero confirmed entries in the active cycle) shows a plain "No confirmed donations yet" message instead of an empty page.

## Security considerations
- None — purely a read-side regrouping/display of already-confirmed, already-fetched data.

## Acceptance criteria
- `npm run lint` passes clean (existing unrelated warnings aside).
- `npm run build` succeeds.
- `/daily` lists one card per UTC day that has confirmed entries, most recent first, today's card (if any) marked "Live".
- Each day's entries are ranked/sorted by amount descending, reusing the same row styling as the main leaderboard.
- `Daily` appears in the nav and links to `/daily`.

## Checks to run
- `npm run lint`
- `npm run build`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000/daily`.
2. Confirm confirmed entries are grouped into day cards, most recent first.
3. If any entries were confirmed today (UTC), confirm that day's card shows the "Live" badge/caption; other days show only date + listing count.
4. Click through an entry's logo/name in a daily card — confirm it still goes through `/api/click/[id]` like the main list.
5. Click "Daily" in the nav from any page — confirm it navigates to `/daily`.
6. Confirm `/`, `/today`, and `/category/[slug]` are visually/functionally unchanged.
