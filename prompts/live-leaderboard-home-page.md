# Implementation prompt: Real, cached, live home page (with TypeGen)

## Goal
Replace `lib/mock-data.ts` on the home page with real Sanity data. Split reads by how often they actually change: `siteConfig`/`categories`/the active `cycle` are cached, CDN-backed, time-based reads (they rarely change); confirmed `leaderboardEntry` documents — the thing that should feel "live" — go through `next-sanity`'s Live Content API (`defineLive`/`SanityLive`) so the leaderboard updates in an already-open tab without a reload. Also set up Sanity TypeGen properly (schema in `studio/`, queries in the root Next app) instead of hand-written result types, and fix the click-through route, which currently only knows mock in-memory entries.

Out of scope, still: the donate/order/webhook write path (Razorpay), and writing click-count increments back to Sanity (needs a write-scoped token — separate approval, as flagged in the original schema prompt).

## Skills / docs read
- AGENTS.md sections 2, 5, 7, 9 (server/client boundary, must-outbid + cycle display rules, mandatory approval for ranking-logic changes)
- `sanity-best-practices` skill: `references/nextjs.md` (Live Content setup, manual `sanityFetch`/caching table), `references/groq.md` (projections, `_ref` filters), `references/typegen.md` (CLI config, automatic vs manual generation, `overloadClientMethods`, unique query names), `references/project-structure.md` (the exact "Studio in `studio/`, frontend at repo root" TypeGen wiring — `typegen.path`/`typegen.generates` relative paths)
- Sanity's hosted docs (fetched live via MCP `read_docs`, since the skill's Live Content section is thin): `/docs/nextjs/query-content-nextjs`, `/docs/nextjs/caching-and-revalidation-in-nextjs`, `/docs/developer-guides/live-content-guide` — confirmed `serverToken`/`browserToken` on `defineLive` are only for Draft Mode/Presentation Tool preview, unrelated to reading published content

## Code inspected
- `app/page.tsx`, `components/leaderboard/*`, `components/ui/Card.tsx` (`CauseCard`), `components/Nav.tsx` — all consume the `Category { slug, title }` / `LeaderboardEntry { id, displayName, companyName?, tagline, url, categorySlug, amount, clickCount, status, confirmedAt }` shapes from `lib/mock-data.ts`
- `app/api/click/[id]/route.ts` — looks up `getEntryById(id)` in the in-memory mock store; would silently 404-redirect-home for every real Sanity `_id`
- `sanity/lib/client.ts`, `queries.ts`, `data.ts`, `token.ts`, `live.ts` — read layer from the previous prompt; `data.ts` uses hand-written `CategoryResult`/etc. types and a token-bearing client; `live.ts` has an unused `defineLive({ client })` scaffold
- `studio/sanity.cli.ts` — currently just `{ api: { projectId, dataset } }`, no `typegen` config
- `app/layout.tsx` — Server Component root layout, no `<SanityLive />` yet
- Confirmed via Sanity MCP: dataset `production` has `aclMode: public` (pre-existing, discussed and kept as-is in the previous turn — you chose to keep it public rather than go private + browser-token)

## Decisions / assumptions
- **Split fetch strategy, not one mechanism for everything** (revised after your pushback on the first draft): `categories`, `siteConfig`, and the active `cycle` are fetched with the plain `client` (`useCdn: true`) plus a time-based `next: { revalidate }`, matching the "Time-based revalidation" guidance in `references/nextjs.md` for content that changes infrequently. Only `getConfirmedEntries` (the actual leaderboard rows) goes through `sanityFetch`/`SanityLive`, since that's the only data where "live" genuinely matters. This means one `<SanityLive/>` subscription tracks one query's sync tags instead of four, and the rarely-changing reads get fast, edge-cached CDN responses instead of being pulled into the live-invalidation path.
  - `categories`, `siteConfig`: `revalidate: 3600` (an hour — these change only through a deliberate Studio edit, at most a few times ever).
  - active `cycle`: `revalidate: 60` — still infrequent to change, but when an admin does the quarterly reset, a shorter window means the flip is picked up same-visit rather than up to an hour later.
- **`defineLive({ client, serverToken: false, browserToken: false })`** — both params exist solely to authorize reading *draft* (unpublished) content for Draft Mode/Presentation Tool preview; they're unrelated to reading published content. This project has no draft-preview feature, and the dataset's `aclMode: public` already means published content (including live leaderboard entries) needs no token to read at all. Setting both `false` is Sanity's documented way to opt out of the draft-specific path and silence the dev-mode warning that assumes a missing token — it is not a security tradeoff, since there is nothing for a token to additionally unlock here.
- **Proper TypeGen, per `references/project-structure.md`'s standalone-Studio pattern** (schema lives in `studio/`, queries live in the root Next app — matches our actual layout):
  - `studio/sanity.cli.ts` gets a `typegen` block: `enabled: true` (auto-regenerates on `sanity dev`/`sanity build`), `path: "../{app,components,sanity}/**/*.{ts,tsx}"` (scoped to where `defineQuery` calls actually live, not the whole repo), `schema: "schema.json"`, `generates: "../sanity.types.ts"` (written to the Next app's root, one level up from `studio/`).
  - `studio/package.json` gets a `typegen` script (`sanity schemas extract --force --enforce-required-fields && sanity typegen generate`) for a manual/CI-friendly run, matching the skill's "Update Types" pattern. `--enforce-required-fields` is used since the schema already declares `rule.required()` throughout (section 8 fields) — this makes generated types non-optional where the schema actually enforces it.
  - Generated `sanity.types.ts` is **committed** (skill's "Option A," recommended for a solo/small-team repo — types available immediately after `git pull`, no CI typegen step needed).
  - `sanity/lib/data.ts`'s hand-written `CategoryResult`/`CycleResult`/`SiteConfigResult`/`LeaderboardEntryResult` types are replaced with generated ones (`CATEGORIES_QUERY_RESULT`, etc., imported from `@/sanity.types`), per the skill's "Automatic Type Inference" pattern — no manual result typing once TypeGen is wired up.
  - Existing query names (`CATEGORIES_QUERY`, `ACTIVE_CYCLE_QUERY`, `SITE_CONFIG_QUERY`, `CONFIRMED_ENTRIES_QUERY`) are already unique, satisfying TypeGen's uniqueness requirement — no renames needed.
- **`sanity/lib/token.ts` is deleted; `SANITY_API_READ_TOKEN` drops from `.env.example`.** With the dataset public and no draft-mode reads, nothing in this data layer needs a token. A future write-scoped token (click-count writes, the payment webhook) is a separate concern with a different name/scope, introduced in its own prompt.
- **A small adapter layer, not a component rewrite.** `sanity/lib/adapters.ts` maps the generated `CATEGORIES_QUERY_RESULT`/`CONFIRMED_ENTRIES_QUERY_RESULT` item shapes onto the existing `Category`/`LeaderboardEntry` types from `lib/mock-data.ts` that every leaderboard component already expects — so `app/page.tsx` is the only file that changes meaningfully; the components and `lib/mock-data.ts`'s exported *types* stay as-is (only its mock arrays stop being imported by the page).
- **Click-through route gets a read-only fix, not a full write path.** `app/api/click/[id]/route.ts` looks up the entry's real `url` by `_id` directly against Sanity (works with no token, dataset is public) and redirects. It does **not** increment `clickCount` in Sanity yet — deferred exactly as originally planned, called out again below so it isn't mistaken for done.
- **Null/empty states handled, not crashed on.** No active `cycle` → existing "No confirmed donations in this view yet" empty state. No `siteConfig` yet → a minimal fallback instead of throwing.

## Files touched
- `studio/sanity.cli.ts` — add `typegen` config block
- `studio/package.json` — add `typegen` script
- `sanity.types.ts` (new, repo root) — generated, committed
- `tsconfig.json` (root) — no change needed; already includes `**/*.ts` at root, which covers the new generated file
- `sanity/lib/client.ts` — add a small `fetchCached(query, params, revalidate)` helper wrapping `client.fetch` with `next: { revalidate }`, generic-passthrough so TypeGen's inferred return types still apply
- `sanity/lib/live.ts` — `defineLive({ client, serverToken: false, browserToken: false })`
- `sanity/lib/data.ts` — rewritten: `getCategories`/`getSiteConfig`/`getActiveCycle` use `fetchCached`; `getConfirmedEntries` uses `sanityFetch` from `live.ts`; all result types come from `@/sanity.types`, no hand-written interfaces
- `sanity/lib/token.ts` — deleted
- `sanity/lib/adapters.ts` — new: `toCategory(...)`, `toLeaderboardEntry(...)` mapping generated types to `lib/mock-data.ts`'s `Category`/`LeaderboardEntry`
- `.env.example` — `SANITY_API_READ_TOKEN` line removed
- `app/layout.tsx` — add `<SanityLive />` inside `<body>`, after `<Providers>{children}</Providers>`
- `app/page.tsx` — becomes an `async` Server Component calling `getLeaderboardData()`, mapping through the adapters, handling null-cycle/null-siteConfig
- `app/api/click/[id]/route.ts` — looks up the entry by `_id` directly against Sanity instead of the mock store; redirects to the real `url` or home if not found

## Requirements
- Home page renders real seeded data (existing `siteConfig`, 3 categories, active cycle) with zero mock imports.
- `categories`/`siteConfig`/active `cycle` are served from Next's data cache (CDN-backed reads), not refetched on every request.
- Publishing a new `confirmed` `leaderboardEntry` reflects on an already-open home page tab without a manual refresh.
- No active cycle → leaderboard empty state, not an error. No `siteConfig` → fallback, not a 500.
- Click-through redirects to the entry's real Sanity `url` for a real `_id`; falls back to `/` for an unknown id.
- `npx sanity schemas extract --force --enforce-required-fields && npx sanity typegen generate` (run from `studio/`) succeeds and produces `../sanity.types.ts` with no manual type definitions left in `sanity/lib/data.ts`.
- No token, of any kind, appears in a browser network request, page source, or bundle.

## Security considerations
- Restating the pre-existing dataset-public tradeoff (discussed and accepted last turn): `razorpayOrderId`/`razorpayPaymentId` on every `leaderboardEntry` remain queryable by anyone directly against Sanity's API, independent of this app. On record again here; belongs on the pre-launch checklist per AGENTS.md section 12.
- No new token introduced anywhere in this prompt (the previous read token is removed, not replaced).
- `app/api/click/[id]/route.ts` still never lets the browser write anything.

## Acceptance criteria
- `npm run lint` and `npm run build` pass clean.
- Home page shows real seeded `siteConfig` copy, real categories, and (once entries exist) real leaderboard rows.
- Publishing a new confirmed entry in Studio updates an open home page tab within a few seconds, no manual reload.
- `sanity.types.ts` exists at repo root, is committed, and `sanity/lib/data.ts` imports its types instead of defining its own.
- `sanity/lib/token.ts` no longer exists; `SANITY_API_READ_TOKEN` no longer referenced anywhere.
- Click route works for a real id, falls back to `/` for a bogus one.

## Checks to run
- `npm run lint`
- `npm run build`
- From `studio/`: `npm run typegen` (or let `sanity dev`'s auto-typegen handle it), confirm `sanity.types.ts` is generated at repo root with no errors
- `npm run dev` (root) — manually verify caching + live-update behavior and the click route

## Manual test steps
1. From `studio/`, run `npm run typegen` — confirm `../sanity.types.ts` is created/updated with no errors.
2. Confirm the Next app's origin is in the Sanity project's CORS origins (`npx sanity cors add http://localhost:3000` from `studio/` if not already added — no `--credentials` needed, nothing here uses a token or cookie).
3. `npm run dev` (root), open `http://localhost:3000/`. Confirm real `siteConfig` cause copy and real category tabs render.
4. Enable fetch logging (`next.config.ts` → `logging.fetches.fullUrl: true`) temporarily; reload and confirm `categories`/`siteConfig`/`cycle` fetches show as cache HITs on a second load within their revalidate window.
5. In Studio, create and publish one `confirmed` `leaderboardEntry` against the active cycle. Watch the still-open home page tab — the entry should appear within a few seconds, no manual refresh.
6. Edit `siteConfig`'s `causeTitle` in Studio, publish — confirm it does *not* update instantly on an open tab (expected: it's on the 3600s cache, not live) but does update after that window or a hard refresh past it.
7. Click an entry's name/logo — confirm it hits `/api/click/[id]` and redirects to the entry's real `url`.
8. Set the active cycle's `isActive` to `false` (without activating another), publish — confirm the home page falls back to the empty leaderboard state within the cycle's 60s revalidate window.
9. Dev tools → Network/Sources — confirm no Sanity token or secret appears anywhere.
10. Resize to 375px — confirm no layout regressions from the data swap.
