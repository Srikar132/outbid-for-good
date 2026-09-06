# Implementation prompt: Entry detail page (`/entry/[id]`)

## Goal
Build the page `LeaderboardList`'s "see details" link already points at (`/entry/[id]`) but which doesn't exist yet. Visually modeled on `desgin/entry-detail-page.png` (outbid.lol's listing-detail page), reworked in our own visual language and reworded so every section reinforces this project's moto: a transparent, must-outbid donation leaderboard for one cause, confirmed-payment-only, guest checkout, no accounts.

## Skills / docs read
- AGENTS.md sections 2 (workflow — prompt approval required for anything touching ranking logic), 5 (server/client boundaries — read-only public pages, server-mediated click route), 7 (must-outbid + quarterly cycle rules, confirmed-payments-only), 8 (data model), 9 (never trust client amounts).
- `sanity-best-practices` skill: GROQ projections/`count()` subqueries for rank computation, TypeGen automatic inference.
- `node_modules/next/dist/docs/` — App Router dynamic route (`app/entry/[id]/page.tsx`), `notFound()` for the 404 case.

## Code inspected
- `components/leaderboard/LeaderboardList.tsx:77` — the existing `see details` link to `/entry/${entry.id}`, and the exact meta-row shape (category icon, time-ago, hostname, click count) this page should stay visually consistent with.
- `components/leaderboard/LeaderboardSection.tsx` — category/view/search filtering; category is local `useState`, only `q` is URL-driven today.
- `app/page.tsx`, `sanity/lib/data.ts`, `sanity/lib/queries.ts`, `sanity/lib/adapters.ts` — the real (already-migrated) Sanity read layer: `fetchCached` for slow-changing content, `sanityFetch`/Live for confirmed entries.
- `studio/schemaTypes/leaderboardEntry.ts`, `category.ts`, `cycle.ts` — current fields. No per-entry "raise history" or repeat-payment concept exists: one `leaderboardEntry` = one confirmed payment, one `razorpayOrderId`/`razorpayPaymentId` (singular).
- `app/api/click/[id]/route.ts` — server-mediated redirect, click-count write-back already deferred (no write-scoped token yet).
- `components/ui/Card.tsx`, `Badge.tsx`, `Button.tsx`, `StatusDot.tsx`, `lib/category-icons.tsx`, `app/globals.css` (type scale, color tokens, dark mode) — existing design system to build within, no new visual language invented.
- **Fixed in passing, not part of this feature**: `studio/sanity.cli.ts`'s `typegen` config was missing `overloadClientMethods: true`, so TypeGen never emitted the `SanityQueries` module augmentation and every `sanityFetch`/`client.fetch` call fell back to `unknown` — this was the `'entries' is of type 'unknown'` error at `app/page.tsx:17`. Added the flag, re-ran `npm run typegen` from `studio/`, confirmed `declare module "@sanity/client" { interface SanityQueries ... }` now exists in `sanity.types.ts` and `tsc --noEmit` is clean.

## Decisions / assumptions
- **Design mapping, section by section** (source image → this page):
  - Breadcrumb ("Leaderboard · AI Agents & Infrastructure") → "Leaderboard · {category title}", both segments linking back (`/` and `/?category={slug}`).
  - Hero card (logo, name, meta row, description, Visit + Copy link) → logo/category-icon avatar, `companyName ?? displayName` as title, meta row (category · time-ago · hostname · click count, reusing `LeaderboardList`'s exact formatters), `tagline` as the description paragraph, a **Visit** button (goes through `/api/click/[id]`, same server-mediated redirect as the list — browser never sees where clicks are counted) and a **Copy link** button.
  - "Category Rank" / "Overall" stat cards → same two cards, computed within the entry's own cycle only (never cross-cycle), each linking out ("See category ranking" → `/?category={slug}`, "See overall ranking" → `/`).
  - "About this ranking" FAQ block → reworded to this project's mechanic (see copy mapping below).
  - "Also in [category]" list → up to 4 other confirmed entries in the same category + cycle, ranked, reusing the list-row visual language.
  - Outbid.lol's site chrome (top nav, footer link farm, DR badge) → **not copied**; this page keeps our existing `<Nav>` and no footer link farm (none exists elsewhere in this app).
- **"About this ranking" copy, mapped to real data, nothing fabricated**:
  - Overview line: "{name} donated ₹{amount} to rank #{overallRank} of {overallTotal} on the board." (real numbers, no invented "visitors have opened" stat).
  - "Has {name} donated today?" → reuses the exact 24h window `LeaderboardSection` already uses for its Today/All-time toggle (`DAY_MS`), so this line and the home page's "Today" filter can never disagree.
  - "How do I outbid {name}?" → only shown when the entry's cycle `isActive`; reads "Anyone can take this rank for ₹{amount + minimumIncrement} or more" with a **Donate** button to `/donate?amount=...&category=...`, using the real `siteConfig.minimumIncrement`, not a hardcoded number. If the cycle has ended, this is replaced with "This cycle has ended — it's part of the past-champions archive" (no outbid CTA on read-only history, per AGENTS.md section 7).
- **"Raised N times" has no equivalent in our data model, and I'm not building the feature it implies.** You asked to add the missing stat as a schema field rather than drop it, but on inspection outbid.lol's "51,810 visitors have opened see.io" line is the *same number* as its meta-row click count — it already has a home in our existing `clickCount` field, no new field needed there. The only genuinely-missing concept is "raised N times": on outbid.lol the same lister pays repeatedly to reclaim/top up one listing. Our schema and payment flow don't support that — one `leaderboardEntry` maps to exactly one confirmed Razorpay payment (singular `razorpayOrderId`/`razorpayPaymentId`), and there's no guest-identity mechanism to let a returning donor find their own entry to add to it. Building that "self-raise" mechanic for real (webhook logic for topping up an existing entry, switching payment-id fields to a history array, order-creation validation for "raise" vs "new") is a payment/ranking-logic change in its own right and squarely hits AGENTS.md section 2's "no exceptions" approval rule — bundling it into a detail-page prompt would be scope creep I'm flagging rather than quietly doing.
  - What I'm proposing instead, staying inside "add a schema field": add `raiseCount` (number, default `1`, min `1`) to `leaderboardEntry` — Studio-editable, e.g. if you manually record an offline top-up donation against an existing entry and bump both `amount` and `raiseCount` by hand. The detail page displays it ("Confirmed once" / "Confirmed {n} times") straight from whatever value is stored. **No webhook or donate-flow code changes accompany this field** — it will read `1` for every entry created through the normal payment flow until/unless a self-raise flow is separately approved and built.
  - **Tell me if that's not what you meant** — if you actually want the self-service "pay again to raise your own listing" mechanic built, that needs its own prompt (payment flow + webhook changes) per section 2, not this one.
- **Rank computation is server-side GROQ, not client math.** `categoryRank`/`categoryTotal`/`overallRank`/`overallTotal` are computed with `count()` subqueries scoped to the entry's own `cycle._ref` (and `category._ref` for the category rank) — never across cycles, matching section 7's "amounts never carry over across cycles."
- **Data goes through `sanityFetch`/Live, not `fetchCached`.** Rank position depends on the same confirmed-entries data that's already live-tracked on the home page; using the same live query keeps an open detail-page tab's rank from silently going stale the way a time-cached read would.
- **Non-confirmed and unknown ids both 404.** The GROQ query filters `status == "confirmed"`; a missing match calls Next's `notFound()`. This matches "only confirmed entries render publicly" and avoids ever leaking a pending/failed donor attempt's details via a guessed id.
- **Copy link copies the donor's own URL** (per your answer) — same destination as Visit, using the browser clipboard API client-side (no data leaves the browser, nothing written to Sanity).
- **Category-rank/overall-rank links filter the home page via `?category=slug`** (per your answer) — small, additive change to `LeaderboardSection`: it seeds its category `useState` from `useSearchParams().get("category")` the same way it already reads `q`, instead of always defaulting to `"all"`.
- **`app/donate/page.tsx` still reads `lib/mock-data.ts`, not Sanity** (pre-existing gap, not introduced or fixed here) — the detail page's "Donate" CTA link still works (it's just a URL with query params), but `currentTop` on the donate page itself will be pre-existing-stale until that page gets its own Sanity migration. Flagging, not fixing, since it's out of this prompt's scope.

## Files touched
- `studio/schemaTypes/leaderboardEntry.ts` — add `raiseCount` field (number, `initialValue: 1`, `validation: rule.min(1)`, description noting it's Studio-editable only, not auto-incremented by the payment flow).
- `studio/schema.json`, `sanity.types.ts` — regenerated via `npm run typegen` (from `studio/`) after the schema change.
- `sanity/lib/queries.ts` — add `ENTRY_DETAIL_QUERY` (entry + category + cycle + computed ranks + up to 4 sibling entries in the same category/cycle).
- `sanity/lib/data.ts` — add `getEntryDetail(id)` using `sanityFetch`.
- `sanity/lib/adapters.ts` — add `toEntryDetail(...)` mapping the generated result onto a new `EntryDetail` type.
- `lib/mock-data.ts` — add the `EntryDetail` type (fields: everything `LeaderboardEntry` has, plus `logoUrl`, `category: {slug, title}`, `cycle: {isActive, startDate, endDate}`, `raiseCount`, `categoryRank`, `categoryTotal`, `overallRank`, `overallTotal`, `siblings: Array<{id, name, amount, logoUrl}>`).
- `app/entry/[id]/page.tsx` — new Server Component: fetch, `notFound()` on miss, render the sections below.
- `components/leaderboard/EntryDetail.tsx` (new) — presentational sections (hero card, rank stat cards, about-this-ranking block, also-in-category list), kept out of the page file so the page stays a thin data-fetch + `notFound()` wrapper.
- `components/leaderboard/LeaderboardSection.tsx` — seed initial category from `?category=` search param.

## Requirements
- `/entry/[id]` for a real confirmed entry's `_id` renders: breadcrumb, hero card (logo/avatar, name, tagline, meta row, Visit + Copy link), category-rank card, overall-rank card, About-this-ranking block, Also-in-category list (or nothing if none).
- `/entry/[id]` for an unknown id, or an id whose entry is `pending`/`failed`, renders Next's standard 404 (`notFound()`) — never leaks that a non-confirmed entry exists.
- All rank numbers and the sibling list are computed within the entry's own cycle (and category, for category rank) — never mixed across cycles.
- Outbid CTA only appears when the entry's cycle is the active one; archived-cycle entries show the "cycle has ended" message instead, no outbid CTA.
- "See category ranking" / "See overall ranking" links land on `/` with the leaderboard pre-filtered to that category (or unfiltered, for overall).
- Visit goes through the existing `/api/click/[id]` route — the browser never learns the donor's raw URL from page source in a way that bypasses the click-count path (link `href` is the internal route, not the external URL).
- Copy link copies the donor's URL to the clipboard client-side, with a brief confirmation state (e.g. button label flips to "Copied").
- `raiseCount` renders whatever is stored (defaulting to 1) — no fabricated numbers, no client-side guess.
- Mobile-first: the hero card, stat cards, and lists reflow cleanly at 375px width (stat cards stack, hero card buttons wrap).

## Security considerations
- The GROQ query filters `status == "confirmed"` server-side; no branch of the page ever renders a pending/failed entry's donor name, amount, or URL.
- No new write path: `raiseCount` is Studio-only, no route accepts a client-supplied value for it.
- No token of any kind reaches the client — this page uses the same `sanityFetch`/Live pattern the home page already uses safely.
- Copy-link and Visit both operate on data already public on the leaderboard; nothing sensitive is exposed by this page that a confirmed leaderboard row didn't already expose.

## Acceptance criteria
- `npm run lint` and `npm run build` pass clean (root workspace).
- `npx tsc --noEmit` clean (already fixed the pre-existing `unknown` error as part of this work; must stay clean after the new code).
- In Studio: `raiseCount` field exists on Leaderboard Entry documents, editable, defaults to 1.
- Visiting `/entry/[id]` for a real confirmed entry shows correct rank numbers matching what's visible on `/` for the same cycle.
- Visiting `/entry/[id]` for a bogus id shows a 404, not a crash or blank page.
- `/?category=<slug>` pre-selects that category tab on load.
- Resizing to 375px shows no layout breakage on the new page.

## Checks to run
- From `studio/`: `npm run typegen` (after the schema edit), confirm `sanity.types.ts` updates with no errors.
- Root: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Root: `npm run dev` — you already have this running, so I will not start or restart any dev server myself; I'll ask you to check the pages against the manual test steps below in your own running instance.

## Manual test steps (for you to run — no server started on my end)
1. In Studio, confirm the new "Raise count" field appears on an existing Leaderboard Entry and defaults to 1 for entries that don't have it set.
2. On the home page, click "see details" on any confirmed entry — confirm it lands on `/entry/[id]` with the new layout, correct name/tagline/category/time-ago/hostname/click count.
3. Click **Visit** — confirm it round-trips through `/api/click/[id]` and lands on the donor's real URL.
4. Click **Copy link** — confirm the donor's URL is on your clipboard and the button shows a brief "Copied" state.
5. Confirm the Category Rank and Overall Rank numbers match the entry's actual position on `/` for the same cycle.
6. Click "See category ranking" — confirm `/` loads with that category tab pre-selected. Click "See overall ranking" — confirm `/` loads unfiltered.
7. If the entry is in the active cycle and isn't already #1, confirm the "How do I outbid" line shows the correct next-minimum amount and the Donate button pre-fills that amount/category.
8. In Studio, mark the entry's cycle inactive (or view an entry from an already-archived cycle, if one exists) — confirm the outbid CTA is replaced with the "cycle has ended" message.
9. Visit `/entry/does-not-exist` — confirm a 404 page, not a crash.
10. In Studio, set a `pending` or `failed` entry's id and visit its `/entry/[id]` directly — confirm 404, not the entry's details.
11. Resize the browser to 375px on `/entry/[id]` — confirm the hero card, stat cards, and also-in-category list all reflow without horizontal scroll or overlap.
12. Toggle dark mode — confirm the hero card border/background and stat cards keep readable contrast.
