# Implementation prompt: Scope-relative ClaimBand + live rank preview

## Goal
Replace `ClaimBand`'s single global "beat the current top" number with a scope-relative one: "Claim #1" means #1 *within whatever view you're on* (home = overall, `/today` = today's top, `/category/[slug]` = that category's top, and a new combined `/category/[slug]?today=true` = that category's top today). Add a live "you'd rank #N" preview that recomputes as the donor adjusts the amount, via a debounced fetch with a skeleton while it's loading.

## Skills / docs read
- AGENTS.md §2 (prompt-approval is mandatory here — this changes the must-outbid rule itself, not just display), §7 (must-outbid mechanic, minimum increment), §9–10 (server-side amount validation, anti-abuse baseline).
- `prompts/leaderboard-filter-routes.md` (the immediately preceding prompt) — this one **supersedes its decision #1** ("no combined category+today route in this pass"). We're adding that combined scope now.

## Code inspected
- `components/leaderboard/ClaimBand.tsx` — `"use client"` already, holds `amount`/`name`/`category`/`open` state; currently takes a precomputed `nextMinBid` prop (always the *global* top + increment, computed by whichever page renders it) and just steps around it.
- `components/leaderboard/DonateForm.tsx` — the actual donate flow is **not built yet**: its submit button is literally `Continue (coming soon)`, disabled, no order-creation route exists in this codebase yet. So there is no existing server-side amount-validation code to migrate — this prompt only needs to get the *display/preview* layer right; the real order-creation validation (built later, its own prompt per AGENTS.md §2) will need to honor whatever scope rule we lock in here.
- `lib/filters.ts` — `filterEntries(entries, { categorySlug?, today?, q? })` already supports category **and** today simultaneously (it's just three independent `.filter()` calls) — the combined scope's filtering logic already exists, only the route/UI to reach it is missing.
- `app/page.tsx`, `app/today/page.tsx`, `app/category/[slug]/page.tsx` — each computes `topEntry` from the **full unfiltered** entries and passes a single global `nextMinBid` to `ClaimBand`, per the filter-routes prompt's explicit correctness rule ("must-outbid is always against the real #1"). This prompt intentionally overrides that rule based on your decision below.
- `components/leaderboard/CategoryTabs.tsx` / `ViewToggle.tsx` — link-based (no client JS), but their hrefs currently drop the other axis entirely (category tab always goes to `/` or `/category/[slug]`, never preserving `?today=true`; "Today" always goes to `/today`, dropping any active category).
- `sanity/lib/queries.ts` — `ENTRY_DETAIL_QUERY`'s `categoryRank`/`overallRank` pattern (count of confirmed entries with `amount > ^.amount`, scoped by `cycle._ref`/`category._ref`) is the template for the new rank-preview query, just parameterized by an arbitrary hypothetical `$amount` instead of an existing document's own amount.

## Decisions (confirmed with you already)
1. **Scoped top is now the real enforced floor, not just a display number.** Donating from `/category/company` only needs to beat Company's current top (+ minimum increment) — not the global top. This is a genuine change to the must-outbid mechanic (AGENTS.md §7), which is why this needed the prompt-approval gate even though no payment code exists yet to touch. Whoever builds the real order-creation route later must validate against the *scope the donor claimed from*, not always the global top — I'll leave a clear pointer to this prompt in that future work.
2. **Live rank preview is fetch-based with a skeleton** (your explicit choice over the instant client-side alternative I raised) — a debounced call to a new read-only API route as the amount changes, recomputing rank/total for the current scope.
3. **Combined category+today scope reuses the existing `/category/[slug]` route** with a `?today=true` search param, rather than a new `/category/[slug]/today` segment or a `/today?category=` variant — one canonical URL per state, consistent with how `?q=` already composes. `/today` itself stays as the dedicated no-category route.

## New scope model
A shared shape used everywhere this needs to reason about "which view": `{ categorySlug?: string; today?: boolean }`, plus a human label for copy ("", " in Company", " today", " in Company today"). Introduced as a small `lib/scope.ts` helper (`buildScopeLabel`, `buildScopeHref`) so `ViewToggle`/`CategoryTabs`/`ClaimBand` all compose URLs and copy the same way instead of three slightly-different implementations.

## Files touched
- `lib/scope.ts` (new) — `type Scope = { categorySlug?: string; today?: boolean }`; `scopeLabel(scope, categories)` → `" in Company"` / `" today"` / `" in Company today"` / `""`; `scopeHref(scope, { base: "/" | "/category/[slug]" ... })` helpers for building the four URL shapes consistently.
- `lib/filters.ts` — add `scopeTopAmount(filtered: LeaderboardEntryResult[])` → `filtered[0]?.amount ?? 0` (trivial, but named once instead of `?? 0` repeated in three pages).
- `sanity/lib/queries.ts` — add `SCOPE_RANK_PREVIEW_QUERY`: given `$cycleId`, optional `$categorySlug`, optional `$since`, and a hypothetical `$amount`, returns `{ rank, total }` via the same `count()`-subquery pattern `ENTRY_DETAIL_QUERY` already uses, dereferencing `category->slug.current` so the API route only needs a slug, never a category `_id` lookup.
- `sanity/lib/data.ts` — add `getScopeRankPreview({ cycleId, categorySlug, since, amount })` using the plain `client` (not `sanityFetch`/Live — this is an on-demand preview call, not part of the tracked live render tree), matching how `app/api/click/[id]/route.ts` already uses `client.fetch` directly.
- `app/api/rank-preview/route.ts` (new) — `GET` handler reading `amount`, `category` (slug, optional), `today` (`"true"`, optional) from the query string; resolves the active cycle, computes `since` as `now - 24h` when `today=true` (same rolling window as everywhere else), calls `getScopeRankPreview`, returns `{ rank, total }` JSON. Read-only count query, no order/payment created — no rate-limiting needed beyond the client-side debounce (cheap Sanity count query, not a Razorpay order-spam vector like real bid attempts are).
- `components/leaderboard/ClaimBand.tsx` — rewritten:
  - Drops the `nextMinBid` prop entirely. New props: `scope: Scope`, `scopeTopAmount: number`, `minimumIncrement`, `categories`, `cycleId`.
  - `claimAmount = scopeTopAmount + minimumIncrement` computed internally (replaces the externally-passed `nextMinBid`), and the amount stepper's floor moves with it.
  - Debounced (~300ms) effect: on `amount` change, fetch `/api/rank-preview?amount=...` plus whatever scope params apply, set `previewRank`/`previewTotal`/`loading`.
  - Renders a small skeleton (pulsing rounded rect) in place of "#{previewRank}" while `loading` is true.
  - Headline copy becomes scope-aware: "Claim #1{scopeLabel} for ₹{claimAmount}".
- `components/leaderboard/ViewToggle.tsx` — gains a `categorySlug?` prop; "Today" link becomes `/category/{slug}?today=true` when a category is active, else `/today`; "All-time" link becomes `/category/{slug}` when a category is active, else `/`. Preserves `?q=` as before.
- `components/leaderboard/CategoryTabs.tsx` — gains a `today?` prop; category links append `?today=true` when active; "All" link becomes `/today` when `today` is active, else `/`. Preserves `?q=` as before.
- `components/leaderboard/LeaderboardSection.tsx` — prop shape changes from separate `activeCategorySlug`/`activeView` to a single `scope: Scope`, threaded to both tab components.
- `app/page.tsx` / `app/today/page.tsx` / `app/category/[slug]/page.tsx` — each now reads `today` from `searchParams` where relevant (`/category/[slug]` gains this), builds its own `Scope`, computes `scopeTopAmount` from its own `filterEntries(...)` result (no longer fetching/using the *global* top for `ClaimBand`), and passes `scope`/`scopeTopAmount`/`cycleId` down instead of `nextMinBid`.

## Requirements
- `/`, `/today`, `/category/[slug]`, and `/category/[slug]?today=true` each show a `ClaimBand` amount that is that scope's own top + minimum increment — never the global top when viewing a narrower scope.
- Adjusting the amount in `ClaimBand` triggers a debounced rank/total preview fetch, scoped identically to whatever page it's rendered on; a skeleton shows while that fetch is in flight.
- Category tabs and the All-time/Today toggle always preserve the *other* active axis (category survives toggling Today; today survives switching category) and `?q=` — no more silently dropping a filter when switching the other one.
- `/category/[slug]?today=true` is a real, bookmarkable, directly-loadable URL (not dependent on client navigation state).
- No change to what's actually stored or confirmed — this is entirely a read/display-and-preview layer; no webhook, schema, or write-path changes.

## Security considerations
- `/api/rank-preview` is read-only (a `count()` query), takes no write action, and never touches Razorpay — it's not a bid attempt, so AGENTS.md §10's rate-limit-bid-attempts rule doesn't apply to it directly, but the client-side debounce keeps request volume sane regardless.
- The scoped-floor decision (§1 above) must be re-stated and honored whenever the real donate/order-creation route is eventually built — flagging clearly now so that future work doesn't silently default back to a global-only check.

## Acceptance criteria
- `npm run lint` and `npm run build` pass clean.
- `ClaimBand`'s amount differs correctly between `/`, `/today`, `/category/[slug]`, and `/category/[slug]?today=true` when the underlying data supports different tops per scope.
- Typing/stepping the amount shows a skeleton then an updated "#{rank} of {total}" preview, scoped correctly.
- Switching category while on `/today` (or vice versa) preserves both filters via the combined URL.
- `/category/[slug]?today=true` loads correctly on a fresh direct visit.

## Checks to run
- `npm run lint`
- `npm run build`
- You already have `npm run dev` running — I won't start or restart it; you'll manually test against your own instance.

## Manual test steps (for you to run)
1. Visit `/`, `/today`, and a couple of `/category/[slug]` pages — confirm `ClaimBand`'s amount differs per scope where the data supports it.
2. On `/category/company`, click "Today" — confirm the URL becomes `/category/company?today=true` (category preserved) and the list/ClaimBand update to that combined scope.
3. On `/category/company?today=true`, click a different category tab — confirm `today=true` is preserved in the new URL.
4. On any of the four scopes, adjust `ClaimBand`'s amount with the +/- steppers — confirm a brief skeleton, then an updated "#{rank} of {total}" reflecting that scope.
5. Visit `/category/company?today=true` directly (fresh load, no prior client navigation) — confirm it renders correctly immediately.
6. Confirm `?q=` still survives all of the above navigations.
7. Resize to 375px and toggle dark mode on all four scope combinations.
