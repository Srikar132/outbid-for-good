# Implementation prompt: Server-rendered filter routes (category, today, search)

## Goal
Replace the home page's client-side filtering (category tabs, All-time/Today toggle, search) with real server-rendered routes and a URL-driven search param, so every filtered view is a plain GET request with no client-side `useState`/`useMemo` filtering: `/` (all-time, all categories), `/category/[slug]` (all-time, one category), `/today` (today, all categories), all composable with `?q=`.

## Skills / docs read
- AGENTS.md sections 2 (workflow — this still isn't ranking/payment logic, but it's a real architecture change, so it gets a prompt anyway per your ask), 3 (mobile-first UI), 7 (must-outbid is against the *global* current top — this constrains the design below).
- `node_modules/next/dist/docs/` — App Router route params vs `searchParams`, Server Components with `<Link>` for zero-JS navigation.

## Code inspected
- `components/leaderboard/LeaderboardSection.tsx` — currently `"use client"`, holds `category`/`view` in `useState`, filters/sorts the full `entries` array in a `useMemo` on every render. `category` seeds from `?category=` (added in the entry-detail-page work), `view` never reads the URL at all.
- `components/leaderboard/CategoryTabs.tsx`, `components/leaderboard/ViewToggle.tsx` — both `"use client"` buttons calling an `onChange` callback into the parent's local state. Neither touches the URL.
- `components/SearchBox.tsx` — already URL-driven (`router.replace(pathname, ...)` with a `q` param) and already `usePathname()`-based, so it's route-agnostic by construction — expected to keep working unchanged once `pathname` is `/`, `/category/[slug]`, or `/today`.
- `app/page.tsx` — fetches `getLeaderboardData()` once (categories, siteConfig, active cycle's confirmed entries), computes `topEntry`/`nextMinBid` from the full entry list for `ClaimBand`, then hands the *same* full list to `LeaderboardSection` for client-side filtering.
- `sanity/lib/data.ts` / `queries.ts` — `getConfirmedEntries(cycleId)` fetches every confirmed entry for the active cycle in one `sanityFetch` (Live) call, already sorted by amount server-side. No category- or date-scoped query variants exist.
- `components/leaderboard/EntryDetail.tsx` — has **three** separate `/?category=${slug}` links, all needing the same fix: the breadcrumb ("Leaderboard · {category.title}"), the "See category ranking" stat card, and the "Also in {category.title} · See all" link. All three exist because of the entry-detail-page prompt's decision to preselect the home page's tab via query param. This prompt supersedes that: category now has its own route, so all three become `/category/${slug}`. (Checked for other occurrences: `ClaimBand.tsx`'s and `EntryDetail.tsx`'s `/donate?...&category=...` links are unrelated — they preset a *new donation's* category, not a leaderboard filter — and stay as query params.)

## Decisions / assumptions — please confirm before I build
1. **No combined category+today route in this pass.** You described three route shapes, not four. So: clicking "Today" while viewing a category drops the category (goes to `/today`); clicking a category tab while on `/today` drops "today" (goes to `/category/[slug]`). If you actually want a combined view (e.g. "today's donations in Company"), that's a fourth route shape (`/category/[slug]/today` or similar) — bigger scope, tell me now rather than after I build the 3-route version.
2. **"Today" stays a rolling 24-hour window**, exactly like today's behavior (`isWithinLastDay`, already used on the entry-detail page's "Has X donated today?" copy) — not a calendar-day boundary. This avoids a timezone decision (whose midnight?) and keeps `/today` and the entry-detail page's own "today" language consistent. Speak up if you actually want calendar-day semantics.
3. **Search stays a simple case-insensitive substring match** on `displayName`/`companyName`, computed in the Server Component after fetching the cycle's confirmed entries — not a GROQ full-text query. This is fine at the expected scale (one cause, one leaderboard, realistically dozens–hundreds of entries per cycle). Flag if you expect entry counts to grow into the thousands; that would call for an actual search index instead of filtering an in-memory array per request.
4. **`/category/[slug]` 404s on an unknown slug** (e.g. a typo'd or deleted category) via `notFound()`, rather than silently falling back to "all" or showing an empty list that looks like a bug.
5. **`ClaimBand`'s "Claim #1 for ₹X" always reflects the true global current top**, never a category- or today-scoped amount, on all three routes. This isn't a display nicety — the must-outbid mechanic (AGENTS.md §7) is always against the real #1, so a donor browsing `/category/company` must still see the actual amount they'd need to beat overall, not the top amount within Company. Practically: every route fetches the *full* confirmed-entries list once (as today), computes `topEntry` from that unfiltered list for `ClaimBand`, and derives the filtered/displayed subset from the same in-memory list — no separate "category top" or "today top" query.

## Files touched
- `lib/filters.ts` (new) — pure functions extracted from the current `useMemo`: `filterEntries(entries, { categorySlug?, today?, q? })`, reusing `isWithinLastDay` from `lib/format.ts`. One shared implementation so `/`, `/category/[slug]`, and `/today` can't drift apart.
- `components/leaderboard/LeaderboardSection.tsx` — drops `"use client"`, `useState`, `useMemo`, `useSearchParams`. Becomes a plain Server Component receiving already-filtered `entries`, the full `categories` list (for tab rendering), `activeCategorySlug` (`"all" | slug`), `activeView` (`"all-time" | "today"`), and `q` (to preserve across tab/toggle links).
- `components/leaderboard/CategoryTabs.tsx` — drops `"use client"`; renders `<Link>`s instead of buttons (`/` for "All", `/category/{slug}` for each category), preserving `?q=` when present, highlighting via `activeCategorySlug` prop instead of local state.
- `components/leaderboard/ViewToggle.tsx` — drops `"use client"`; renders two `<Link>`s ("All-time" → `/`, "Today" → `/today`), preserving `?q=`, highlighting via `activeView` prop.
- `app/page.tsx` — reads `searchParams.q`; fetches full entries as today; computes `topEntry`/`nextMinBid` from the full list; passes `filterEntries(entries, { q })` to `LeaderboardSection` with `activeCategorySlug="all"`, `activeView="all-time"`.
- `app/category/[slug]/page.tsx` (new) — same shape, plus the route's `slug` param; 404s if the slug doesn't match a real category; passes `filterEntries(entries, { categorySlug: slug, q })`.
- `app/today/page.tsx` (new) — same shape; passes `filterEntries(entries, { today: true, q })`, `activeView="today"`.
- `components/leaderboard/EntryDetail.tsx` — all three `/?category=${slug}` links (breadcrumb, "See category ranking", "Also in category · See all") become `/category/${slug}`. The two `/donate?...&category=...` links (here and in `ClaimBand.tsx`) are untouched.
- `components/SearchBox.tsx` — no changes expected (already pathname-agnostic); verify during manual testing rather than editing blind.

## Requirements
- No `useState`/`useMemo` filtering remains anywhere in the leaderboard display path — category, today, and search are all resolved server-side per request.
- `/`, `/category/[slug]`, and `/today` are real, shareable, bookmarkable URLs that render the correct filtered list on a fresh load (no JS required to reach the correct state).
- `?q=` composes correctly with all three routes and survives tab/toggle navigation.
- `ClaimBand` shows the identical "Claim #1 for ₹X" on all three routes for the same cycle state (never scoped to the current filter).
- `/category/does-not-exist` 404s.
- Empty states render correctly for every filter combination with zero matches (e.g. a category with no donations today).
- Mobile layout unchanged — same components, same responsive classes, just server-rendered instead of client-filtered.

## Security considerations
- None of this touches payment, webhook, or write paths — it's a read-side rendering change only. Confirmed-only filtering (`status == "confirmed"`) is unaffected since it already happens in `getConfirmedEntries`'s GROQ query, before any of this new filtering runs.

## Acceptance criteria
- `npm run lint` and `npm run build` pass clean.
- Visiting `/`, `/category/individual` (or whichever real slugs exist), and `/today` directly (fresh load, no client navigation) each show the correct filtered set immediately.
- Tab/toggle links correctly preserve an active `?q=` value across navigation.
- `/category/not-a-real-slug` 404s.
- The "Claim #1 for ₹X" amount is identical across `/`, any `/category/[slug]`, and `/today` at a given moment.

## Checks to run
- `npm run lint`
- `npx tsc --noEmit` (or `npm run build`, which runs its own type check)
- `npm run build`
- You already have `npm run dev` running — I won't start or restart it; you'll manually test against your own running instance.

## Manual test steps (for you to run)
1. Visit `/` — confirm All-time/All-categories renders as today, `ClaimBand` shows the real current top.
2. Click a category tab — confirm the URL becomes `/category/[slug]`, the list updates, and `ClaimBand`'s amount is unchanged from step 1.
3. Click "Today" from a category page — confirm it navigates to `/today` (category dropped, per decision #1) and only entries confirmed in the last 24h show.
4. Type a search term on `/category/[slug]` — confirm the URL gets `?q=...` and the list narrows without leaving the category route.
5. Visit `/category/does-not-exist` directly — confirm a 404, not a blank/broken page.
6. Visit `/today` directly (fresh load, no prior client navigation) — confirm it's correctly filtered immediately (proves it's server-rendered, not dependent on client JS running first).
7. From an entry-detail page, click the breadcrumb category, "See category ranking", and "Also in {category} · See all" — confirm all three land on `/category/[slug]`, not `/?category=[slug]`.
8. Resize to 375px on all three routes — confirm no layout regressions.
9. Toggle dark mode on all three routes.
