# Sectioned Pagination for the Leaderboard

## Context

The home leaderboard renders **every** confirmed entry in one unbroken list. `LeaderboardList` maps the full array with no slicing, so the page grows without bound as the cycle fills up, and there is no way to reach entries below the fold except scrolling. The reference design (outbid.lol) instead breaks page 1 into a podium, a "today" strip, grouped rows, and a `TOP 20` marker, then pages the rest 50 at a time.

Two secondary problems surfaced while planning:

- **Ranks are wrong during search.** `LeaderboardList.tsx:45` renders `#{index + 1}` against the *filtered* array, so searching shows the 7th-place donor as `#1`. Pre-existing, but pagination makes it far more visible. Fixed here.
- `getLeaderboardData()` is called by every route (and again by `app/layout.tsx`), always fetching the full entry set. **This plan does not change that** — see Non-goals.

Outcome: page 1 matches the reference structure, pages 2+ are flat continuations with correct absolute ranks, and all filter/search/pagination state lives in the URL with no new client components.

## Decisions (confirmed with user)

| Decision | Choice |
|---|---|
| Slicing | **In JS**, downstream of `filterEntries`. No GROQ `$offset`/`$limit`, no `sanity.types.ts` regen. |
| Page size | **50** |
| Pages 2+ | Flat rows, no heroes / strip / divider |
| Today strip | **Home page 1 only** |
| Heroes + `TOP 20` divider | Page 1 of **all three** routes (`/`, `/today`, `/category/[slug]`) |
| Search rank bug | **Fixed** in this change |

## Page 1 layout (target)

```
┌──────────────────────────────────────────────────────────┐
│ #1  ● see.io                                   ₹17,001   │  hero cards
│ #2  ● Tutti                                    ₹16,000   │  top 3 by amount,
│ #3  ● JONI                                     ₹14,028   │  all-time, 3 tints
├──────────────────────────────────────────────────────────┤
│ ● Today's top ranking                          See all > │  HORIZONTAL strip
│ ┌────────────┐  ┌────────────┐  ┌────────────┐           │  3 cards side by side
│ │#1 OutSwipe │  │#2 Scimmia  │  │#3 Rereader │           │  last 24h only
│ │   ₹41      │  │   ₹36      │  │   ₹15      │           │  different entries
│ └────────────┘  └────────────┘  └────────────┘           │
├──────────────────────────────────────────────────────────┤
│ #4   Outrank                                   ₹13,005   │  compact rows,
│ #5   Orynth                                    ₹12,716   │  hairline dividers
│ ...  through #10                                         │
│ #11  ... through #20                                     │
│                      ── TOP 20 ──                        │  divider pill
│ #21  ... through #50                                     │
│                                                          │
│              ‹  [1] 2  3  4  …  57  ›                    │  pagination
│                   1 – 50 of 2,841                        │  range caption
└──────────────────────────────────────────────────────────┘
```

The strip is **horizontal**: `sm:grid sm:grid-cols-3` on desktop, horizontal snap-scroll on mobile (§6). It sits **between #3 and #4**. Its entries are the last 24 hours ranked by amount — an independent list from the hero cards, which stay all-time top-3 by amount and are unaffected.

Strip card anatomy (compact — deliberately not a full row): rank badge, `EntryAvatar size="sm"`, name (truncated), amount, one-line tagline (truncated). No category, no timestamp, no click count, no `details` link.

## Non-goals

Not touched: `app/donate/actions.ts`, `lib/filters.ts`, `sanity/lib/queries.ts`, `sanity/lib/data.ts`, `sanity.types.ts`, `app/api/**`, `app/layout.tsx`, `CategoryTabs.tsx`, `ViewToggle.tsx`, `ClaimBand.tsx`, `next.config.ts`.

**Money path stays intact.** `app/donate/actions.ts` computes the outbid floor via `getConfirmedEntries` → `filterEntries` → `scopeTopAmount`. All slicing here happens in the view layer *after* that, so the floor keeps seeing the complete unsliced amount-desc array. Per AGENTS.md §2 this plan doubles as the required implementation prompt; on approval it is committed as `prompts/leaderboard-sectioned-pagination.md`.

Also unchanged: the double `getLeaderboardData()` fetch per render, and GROQ-level paging. Both are real scale concerns, logged as follow-ups, out of scope here.

---

## 1. `lib/pagination.ts` (new)

Single home for all slicing math.

```ts
export const PAGE_SIZE = 50;

export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[raw.length - 1] : raw;  // ?page=1&page=2 -> 2
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export type PageResult<T> = {
  items: T[]; page: number; totalPages: number; total: number;
  startIndex: number; rangeStart: number; rangeEnd: number;
};

export function paginate<T>(entries: T[], requestedPage: number): PageResult<T>;
export function pageWindow(page: number, totalPages: number): (number | "gap-left" | "gap-right")[];
```

`paginate` clamps: `totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))`, `page = min(max(1, requestedPage), totalPages)`.

**Clamp, do not `notFound()`.** `<SanityLive />` re-renders these server components on Sanity mutations, so the board can shrink between render and click — 404-ing a link the page itself just rendered is a real failure mode. `?page=999` degrades to the last page.

`pageWindow` — two distinct gap markers, not one shared string, because both can appear at once and would collide as React keys:

```
totalPages <= 6         -> [1..totalPages]
page <= 3               -> [1, 2, 3, 4, "gap-right", tp]
page >= tp - 2          -> [1, "gap-left", tp-3, tp-2, tp-1, tp]
else                    -> [1, "gap-left", page-1, page, page+1, "gap-right", tp]
```

Page 1 of 57 → `1 2 3 4 … 57`, matching the reference. Max 7 slots — the mobile budget in §6 is sized for this.

## 2. URL state — where `page` survives and where it dies

`categoryTabHref` and `viewToggleHref` in [lib/scope.ts](lib/scope.ts) build URLs **from scratch** through the private `withQuery`, emitting only the keys they are handed. So `page` is absent by construction on tab and toggle clicks — the reset to page 1 is already correct.

> **Do not add a `page` argument to `categoryTabHref` or `viewToggleHref`.** The reset depends on them building fresh.

The base-URL mapping (`/` vs `/today` vs `/category/x`, plus `today=true` only on category routes) is currently duplicated in both. A third copy in `pageHref` would drift, so extract it:

```ts
function scopeBase(current: Scope) {
  if (current.categorySlug)
    return { href: `/category/${current.categorySlug}`, today: current.today ? "true" : undefined };
  return { href: current.today ? "/today" : "/", today: undefined };
}

export function pageHref(page: number, current: Scope, q?: string) {
  const { href, today } = scopeBase(current);
  return withQuery(href, { today, q, page: page > 1 ? String(page) : undefined });
}
```

`withQuery` skips falsy values, so page 1 yields the bare canonical `/` for free.

[components/SearchBox.tsx](components/SearchBox.tsx) copies existing params via `new URLSearchParams(searchParams.toString())`, so `page` would survive a keystroke and strand the user on page 4 of a 3-result search. Add one line in `applyQuery` after the `q` set/delete:

```ts
params.delete("page");
```

| Navigation | `page` | Mechanism |
|---|---|---|
| Category tab | dropped | `categoryTabHref` builds fresh (no change) |
| All-time/Today toggle | dropped | `viewToggleHref` builds fresh (no change) |
| Typing in search | dropped | `params.delete("page")` |
| Pagination link | set, scope + `q` preserved | new `pageHref` |

## 3. Component decomposition

**Every new component is a Server Component.** Matches the existing zero-client-state pattern, and lets `LeaderboardSection` pass a `Map` without a serialization boundary. `SearchBox` remains the only client component involved.

### Shared atoms — extracted from today's `LeaderboardList.tsx`

The three visual variants differ in wrapper and typography, not in the risky logic. Share at the atom level rather than a `variant` prop matrix.

- **`EntryAvatar.tsx`** — owns `logoTint` (currently `LeaderboardList.tsx:8-12`) and the `/api/click/{entry._id}` anchor with the favicon → `AtSign` → `CategoryIcon` → initial fallback chain (lines 48-68). Props `{ entry, size?: "sm" | "md" | "lg" }`. This is the click-through URL and identity fallback logic — exactly what a copy-paste would silently rot.
- **`EntryMeta.tsx`** — the `category • timeAgo • N clicks • details` line (lines 85-99) including the `/entry/{slug}` link. Props `{ entry }`.

### Shells

- **`EntryHeroCard.tsx`** — large tinted `<li>` for ranks 1-3. Props `{ entry, rank }`. Extend today's `getRankBg` from 2 tiers to 3: `#F7EBE3` / `#F9F0EA` / `#FAF5F0`, dark `#28211C` / `#231E1B` / `#1E1B19`.
- **`EntryRow.tsx`** — compact `<li>` for #4 onward. No rounded background; hairlines come from `divide-y` on the parent `<ol>`, which also cuts DOM weight vs 50 rounded cards.
- **`TodayStrip.tsx`** — props `{ entries }` (full today-filtered list; slices 3 itself so header and slice stay together). Returns `null` when empty. `<section aria-labelledby>` + `<h2>` "Today's top ranking" + `<Link href="/today">See all →</Link>` + cards. Each card is a single `<a href="/api/click/{id}">` with **no** `EntryMeta` and no `/entry/{slug}` link — [prompts/fix-leaderboard-list-hydration-nesting.md](prompts/fix-leaderboard-list-hydration-nesting.md) records this repo has already been bitten by `<a>` inside `<a>`. Use [CategoryCard.tsx:38-56](components/leaderboard/CategoryCard.tsx#L38-L56) as the visual reference for the compact row, but do not share code with it — different semantics.
- **`SectionDivider.tsx`** — props `{ label }`. `<div role="separator">` with two `h-px flex-1` rules flanking a centered pill. Rendered **between** `<ol>` elements, never inside one — a `<div>` sibling of `<li>`s is invalid HTML and the same class of bug as the hydration fix above.
- **`Pagination.tsx`** — see §5.

### Orchestrators (modified)

**`LeaderboardList.tsx`** loses all per-entry markup:

```ts
type Props = {
  items: LeaderboardEntryResult[];
  startIndex: number;
  showSections: boolean;
  rankById?: Map<string, number>;
  todayEntries?: LeaderboardEntryResult[];
};
```

- `items.length === 0` → existing empty-state card, unchanged.
- `showSections === false` → one `<ol className="divide-y">` of `EntryRow`.
- `showSections === true` → heroes `<ol>` (`items.slice(0,3)`), `TodayStrip` if `todayEntries` given, `<ol start={4}>` rows 4-10, `<ol start={11}>` rows 11-20, `<SectionDivider label="TOP 20" />`, `<ol start={21}>` rows 21-50.

Guard each section on a non-empty slice so short boards emit no empty `<ol>`s or stray dividers.

**`LeaderboardSection.tsx`** becomes the pagination coordinator. New props `page`, `todayEntries?`, `rankById?`:

```ts
const pageData = paginate(entries, page);
const searching = !!q?.trim();
const showSections = pageData.page === 1 && !searching;
```

Then `CategoryTabs` / `ViewToggle` (unchanged), `LeaderboardList`, `Pagination`.

## 4. Rank correctness

One formula, one place, in `LeaderboardList`:

```ts
const rankAt = (i: number) => rankById?.get(items[i]._id) ?? startIndex + i + 1;
```

Every section renders `items.slice(a, b).map((entry, i) => <X rank={rankAt(a + i)} />)`. The index passed is always the index within `items`, so no per-section arithmetic exists to get wrong — heroes included.

**The search fix.** Each route already computes the scope-filtered array to get `topAmount` and throws it away inside `scopeTopAmount(filterEntries(entries, scope))`. Hoist and reuse it:

```ts
const scoped    = filterEntries(entries, scope);
const topAmount = scopeTopAmount(scoped);                  // identical value, no behaviour change
const filtered  = q ? filterEntries(scoped, { q }) : scoped;
const rankById  = q ? new Map(scoped.map((e, i) => [e._id, i + 1])) : undefined;
```

`filterEntries(scoped, { q })` is safe: with `categorySlug`/`today` undefined both predicates short-circuit to true, so the result is identical to today's `filterEntries(entries, {...scope, q})`.

Also **suppress sectioning while searching**. Search hits are a filtered subset; promoting their top 3 to podium cards would misrepresent them as the board's top 3. Flat rows with true ranks is the honest rendering.

## 5. Pagination component

Server component, `<Link>`s only.

```
<nav aria-label="Leaderboard pagination" class="flex flex-col items-center gap-2 pt-4">
  <ul class="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5"> prev | numbers | next </ul>
  <p class="text-small text-neutral-500 tabular-nums">1 – 50 of 2,841</p>
</nav>
```

- Prev/next enabled → `<Link href={pageHref(...)} rel="prev"|"next" aria-label="Previous page">` with lucide `ChevronLeft`/`ChevronRight` (already a dependency).
- Prev/next disabled → `<span aria-disabled="true" class="opacity-40 pointer-events-none">`, **not** a `<Link>`. Disabled anchors don't exist in HTML; a span keeps them out of the tab order.
- Current page → `<span aria-current="page" class="bg-accent-500 text-white">`, not a self-link.
- Gap → `<span aria-hidden="true">…</span>`.
- Caption → en-dash, `toLocaleString("en-IN")` to match `formatAmount`. No currency here, so the ₹-vs-$ concern doesn't arise.
- `total === 0` → return `null`. `totalPages === 1` → caption only, skip the `<ul>` ("1 – 12 of 12" is still useful).
- Leave Next's default scroll-to-top; do **not** pass `scroll={false}`. Unlike `SearchBox`'s in-place `router.replace`, jumping to the top of a fresh page is expected.

## 6. Mobile-first

Target: no horizontal overflow at 360px. Page gutter is `px-4` from each route's `<main>`.

**Today strip** — horizontal scroll, matching the existing `CategoryTabs` `overflow-x-auto scrollbar-none` pattern:

```
wrapper: -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 scrollbar-none
         sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0
card:    w-[72%] shrink-0 snap-start sm:w-auto
```

Negative margin + padding bleeds the scroll area to the screen edge without breaking the gutter. 72% deliberately shows a sliver of card 2 so the scroll affordance is discoverable.

**Pagination** — `flex-wrap` + `justify-center` so the worst case degrades to a second line. Slots `h-10 min-w-10` (44px touch target), `text-small tabular-nums`. Seven slots ≈ 304px, inside the 328px available at 360px.

**Hero cards** — full-width stacked rows at all breakpoints, not a 3-column podium: #1 needs to dominate, not share a row. `p-4 sm:p-5`, avatar `h-12 w-12 sm:h-14 sm:w-14`, amount `text-h3 tabular-nums`.

**Compact rows** — `divide-y divide-neutral-200 dark:divide-white/5`, `py-3 sm:py-3.5`, rank column `w-8` (must fit `#100` — today's `w-6` does not), name `truncate`, amount `shrink-0`. Keep `EntryMeta`'s existing `overflow-hidden` + per-item `shrink-0`/`truncate` treatment; it already works at 360px.

## 7. Files

**Create (8)** — `lib/pagination.ts`, and in `components/leaderboard/`: `EntryAvatar.tsx`, `EntryMeta.tsx`, `EntryRow.tsx`, `EntryHeroCard.tsx`, `TodayStrip.tsx`, `SectionDivider.tsx`, `Pagination.tsx`.

**Modify (7)**

| File | Reason |
|---|---|
| [components/leaderboard/LeaderboardList.tsx](components/leaderboard/LeaderboardList.tsx) | Becomes sectioning orchestrator; markup moves to new components |
| [components/leaderboard/LeaderboardSection.tsx](components/leaderboard/LeaderboardSection.tsx) | Calls `paginate`, decides `showSections`, renders `Pagination` |
| [lib/scope.ts](lib/scope.ts) | Add `pageHref` + private `scopeBase` |
| [components/SearchBox.tsx](components/SearchBox.tsx) | `params.delete("page")` |
| [app/page.tsx](app/page.tsx) | Read `page`; hoist `scoped`; build `rankById`; pass `todayEntries` |
| [app/today/page.tsx](app/today/page.tsx) | Same, minus `todayEntries` |
| [app/category/[slug]/page.tsx](app/category/[slug]/page.tsx) | Same, keeping the existing `today` param |

`searchParams` widens to `Promise<{ q?: string; page?: string }>` (`/`, `/today`) and `Promise<{ q?: string; today?: string; page?: string }>` (category). `todayEntries` is `filterEntries(entries, { today: true })` — reuses the existing helper, no new date logic.

## 8. Edge cases

| Case | Behaviour |
|---|---|
| 0 entries | Empty-state card; `Pagination` and `TodayStrip` both `null` |
| 1-2 entries | 1-2 heroes; later slices empty, their `<ol>`s skipped; no divider |
| 3 exactly | 3 heroes only |
| < 20 | No divider — gate on `items.length > 20 && startIndex === 0` |
| 50 exactly | One page, caption "1 – 50 of 50", no numbers |
| 51 exactly | Page 2 = one row, rank `#51`, next disabled |
| No entries in last 24h (home) | `TodayStrip` returns `null`; a `null` child emits no DOM node, so the parent flex `gap` leaves no hole |
| Search → 3 results | `showSections` false, flat rows, true ranks, caption "1 – 3 of 3" |
| Search → 120 results | Paginated flat rows; ranks are true board ranks, non-contiguous — correct |
| `?page` garbage / out of range | Clamped; URL left as typed |
| Live mutation shrinks board on last page | Clamping shows the new last page — a further argument against `notFound()` |

## 9. Verification

**Checks:** `npx next build` (authoritative — runs type checking plus the route type generation `tsc --noEmit` depends on; required since routes and server components changed) and `npx eslint .`. Then `npm run dev` for the manual pass.

**Test data:** if the local dataset has < 51 confirmed entries, page 2 is unreachable. Temporarily set `PAGE_SIZE = 5` (uncommitted), exercise every state, restore to 50, re-run the build. Keeping `PAGE_SIZE` in one module exists partly for this.

1. `/` — three distinct hero tints; Today strip with 3 cards and a working "See all →"; rows #4-10, #11-20; centered `TOP 20` pill; rows #21-50; pagination `1 2 3 4 … N`, prev disabled, caption "1 – 50 of N".
2. `/?page=2` — flat rows starting at **#51**, no heroes/strip/divider, both arrows enabled, caption "51 – 100 of N".
3. `/?page=999` → last page, next disabled. `/?page=abc`, `?page=0`, `?page=-1` → 1. `?page=1&page=3` → 3.
4. From `/?page=3`: click a category tab → `/category/<slug>` with **no** `page`. Click the Today toggle → `/today`, no `page`. Type in search → keeps `q`, drops `page`.
5. **Search rank acceptance test:** search a donor, cross-check their displayed rank against their rank on the unsearched board. Must match.
6. `/today` — heroes + sections + `TOP 20`, **no** Today strip. `/category/<slug>?today=true&page=2` — every arrow and number keeps `today=true` and the same category.
7. Click page 1 from page 2 → URL is the bare `/`, no `?page=1`.
8. 360px viewport: strip scrolls and snaps, pagination on one line. Run `document.documentElement.scrollWidth === document.documentElement.clientWidth` on pages 1 and 2 — must be `true`.
9. Keyboard: current page not focusable, disabled arrows skipped. Check console for `<a>`-in-`<a>` hydration warnings on page 1 — the strip and hero cards are new anchor sites.
10. Dark mode on pages 1 and 2 — three hero tints, divider hairlines, `divide-y` rules all read correctly.
11. **Money-path smoke test:** on `/?page=2`, confirm the `ClaimBand` headline amount is byte-identical to `/` page 1, then open `/donate` and confirm the floor is unchanged. Repeat on `/category/<slug>?page=2`. Proves slicing never leaked into `scopeTopAmount`.
12. Mutate an entry in Studio while sitting on `/?page=2` — `<SanityLive />` must re-render without throwing.

**Reminders:** currency stays ₹ via `formatAmount` (the reference screenshots show `$` — do not copy). Creator partnership remains unconfirmed per AGENTS.md §12; nothing here assumes it.
