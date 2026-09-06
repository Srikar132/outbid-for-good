# Implementation prompt: Standalone Sanity Studio + content models + server-side read data layer

## Goal
Split the currently-embedded Sanity Studio (`app/studio/[[...tool]]/page.tsx`) into its own standalone `studio/` app in this same repo, per AGENTS.md section 5 ("Studio workspace for schema/admin, web workspace for the Next.js site... do not embed the Studio inside Next.js") — the repo was originally scaffolded with an embedded Studio before this instruction was applied; the user has now explicitly asked to fix that. Then model the four documents from AGENTS.md section 8 (cycle, leaderboardEntry, category, siteConfig) inside that standalone Studio, deploy the schema, and build the server-only read layer (GROQ queries + typed fetch functions) in the Next app that a later page-wiring prompt will use to replace `lib/mock-data.ts`.

Out of scope for this prompt: wiring `app/page.tsx` to real data, the donate/order/webhook write path, and the Sanity-backed click-count write (needs a write token — its own small approval per AGENTS.md section 2).

## Skills / docs read
- AGENTS.md sections 2, 5, 6, 7, 8, 9 (data model, workspace separation, server/client boundary, must-outbid + cycle rules, tech stack)
- `sanity-best-practices` skill: `references/nextjs.md` section 1 (standalone Studio setup, CORS, why not embedded) and section 5 (migrating an existing embedded Studio) and section 3 (`useCdn` guidance); `references/schema.md` (defineType/defineField, references vs objects, validation); `references/groq.md` (defineQuery, projections, `_ref` filters, performance rules); `references/studio-structure.md` (singleton pattern for siteConfig)

## Code inspected
- `sanity.config.ts`, `sanity.cli.ts` (root) — embedded Studio config, `'use client'` directive, `basePath: '/studio'`
- `app/studio/[[...tool]]/page.tsx` — `NextStudio` mount, `dynamic = 'force-static'`
- `sanity/schemaTypes/index.ts` — empty (`types: []`)
- `sanity/lib/client.ts`, `sanity/env.ts`, `sanity/lib/live.ts`, `sanity/lib/image.ts` — Next-side client scaffolding, `useCdn: true`, no read token wired anywhere
- `sanity/structure.ts` — generic `documentTypeListItems()`, no singleton handling
- root `package.json` — `sanity`, `@sanity/vision`, `styled-components` currently listed as deps of the Next app (needed only because Studio was embedded); `styled-components` isn't imported anywhere in app code directly (confirmed via search) — it's a Studio-only transitive need
- `tsconfig.json` (root) — includes `**/*.ts`/`**/*.tsx` repo-wide, no exclusion for a future `studio/` folder
- `.gitignore` (root) — `/node_modules` and `.env*` are root-anchored only, won't cover a sibling `studio/node_modules` or `studio/.env`
- `lib/mock-data.ts` — shapes (`Category`, `LeaderboardEntry`, `Cycle`, `SiteConfig`) that new schema/query field names mirror
- `app/api/click/[id]/route.ts` — existing mock click-increment route (server-only redirect pattern, untouched)
- No `.env.example` exists yet anywhere in the repo

## Decisions / assumptions
- **Sibling-folder split, not a full monorepo rename.** Per the `nextjs.md` skill reference's Option A, `studio/` becomes its own app folder at the repo root, sitting next to the existing Next.js app (which stays at the repo root as-is — not moved into a `web/` folder). This matches "two standalone workspaces in one repo" without an unnecessary full-tree move of the Next app. No npm workspaces / monorepo tooling introduced — each app keeps its own `package.json` and is run with its own `npm install`/`npm run dev`, exactly like the skill's reference setup (`next dev` + `sanity dev` in separate terminals).
- **Studio env vars use Sanity's own convention**, not Next's: `studio/.env` (gitignored, not committed) with `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` (Vite-based Studio reads these, not `NEXT_PUBLIC_*`). A committed `studio/.env.example` documents them.
- **Root `.env.example` (new, doesn't exist yet)** documents the Next app's three vars: the two existing `NEXT_PUBLIC_SANITY_*` plus new `SANITY_API_READ_TOKEN` (server-only, Viewer-role token, for the read layer below).
- **No `defineLive`/Visual Editing wiring in this pass.** `sanity/lib/live.ts` stays but unused for now — using a plain server-side `client.withConfig({ token, useCdn: false }).fetch(...)` for the read layer instead, since there's no draft-mode requirement yet and this avoids any token-shaped value needing to reach the browser. Revisit `defineLive` when Visual Editing is actually wanted (that needs the standalone Studio's Presentation tool pointed at the Next app anyway).
- **No TypeGen setup this pass** — project has no `typegen.enabled` config yet; hand-writing result types in the data layer instead of introducing TypeGen as a side effect of an unrelated prompt.
- **Cycle uniqueness ("exactly one active cycle")** enforced by document-level custom validation in the `cycle` schema (warns/errors if another `cycle` already has `isActive == true`) — best-effort in Studio, not a hard DB constraint.
- **`category` icon mapping** stays code-owned (`lib/category-icons.tsx`, keyed by slug) — not added to the schema; categories stay title+slug+description, matching "model data, not presentation."
- **`leaderboardEntry.status`** uses `options.list` (pending/confirmed/failed), matching AGENTS.md section 8, per the schema skill's "boolean vs list" rule.
- **Click count** stays a plain `number` field defaulting to 0, Studio-editable for manual corrections; no write path added from the app in this prompt.
- **CORS**: adding the Next app's localhost origin (and reminding about the eventual prod URL) to the Sanity project's CORS origins is a project-level config change made from the Studio CLI — listed as a manual step for you to run (`npx sanity cors add http://localhost:3000 --credentials` from inside `studio/`), not something this prompt executes automatically, since it touches shared Sanity project settings outside this codebase.

## Files touched

**New `studio/` app:**
- `studio/package.json` — own deps: `sanity`, `@sanity/vision`, `styled-components`, `react`, `react-dom`, `typescript` (versions matching what's already in root, since those were already resolved for this Sanity version)
- `studio/sanity.config.ts` — `defineConfig` with `structureTool({ structure })` + `visionTool`, `basePath: '/'` (no `'use client'` needed — this is a Vite app now, not a Next.js file)
- `studio/sanity.cli.ts` — `defineCliConfig` reading `SANITY_STUDIO_PROJECT_ID`/`SANITY_STUDIO_DATASET`
- `studio/env.ts` — small helper for the two `SANITY_STUDIO_*` vars
- `studio/structure.ts` — singleton pattern for `siteConfig`, filtered generic list for the rest
- `studio/schemaTypes/category.ts`, `cycle.ts`, `leaderboardEntry.ts`, `siteConfig.ts`, `index.ts`
- `studio/tsconfig.json` — Sanity's standard clean-template tsconfig
- `studio/.gitignore` — `node_modules`, `dist`, `.env`
- `studio/.env.example` — `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET` placeholders

**Removed from the Next app:**
- `app/studio/[[...tool]]/page.tsx` (and the now-empty `app/studio/` dir)
- root `sanity.config.ts`, root `sanity.cli.ts`
- `sanity/schemaTypes/` and `sanity/structure.ts` (schema now lives only in `studio/`)
- `sanity`, `@sanity/vision`, `styled-components` removed from root `package.json` dependencies

**Kept/changed in the Next app:**
- `sanity/lib/client.ts`, `sanity/env.ts`, `sanity/lib/image.ts` — unchanged, still the Next app's own read client
- `sanity/lib/token.ts` — new, reads `SANITY_API_READ_TOKEN` server-only
- `sanity/lib/queries.ts` — new, `defineQuery`-wrapped GROQ (categories, active cycle, site config, confirmed entries for a cycle)
- `sanity/lib/data.ts` — new, typed server-only fetch functions built on `client.withConfig({ token, useCdn: false })`
- root `tsconfig.json` — add `"studio"` to the `exclude` array so the Next app's typecheck doesn't try to compile the standalone Studio's Vite app
- root `.gitignore` — broaden `/node_modules` → also cover `studio/node_modules` (either `**/node_modules` or an explicit added line), same idea for a stray `studio/dist`
- `.env.example` (new, root) — `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`

## Schema details

### `category`
- `title` (string, required)
- `slug` (slug, required, source: title)
- `description` (text, optional, short)

### `cycle`
- `title` (string, optional — e.g. "2026 Q3", Studio readability only)
- `startDate` (date, required)
- `endDate` (date, required, custom validation: must be after `startDate`)
- `isActive` (boolean, default `false`, custom validation warns if a second active cycle would exist)

### `leaderboardEntry`
- `displayName` (string, required)
- `companyName` (string, optional)
- `logo` (image, optional, with hotspot)
- `url` (url, required, `http`/`https` only)
- `tagline` (text, optional, max ~140 chars)
- `category` (reference → `category`, required)
- `cycle` (reference → `cycle`, required)
- `amount` (number, required, `min(1)` — real must-outbid validation happens server-side at order-creation time, this is just basic data sanity)
- `clickCount` (number, default `0`, `min(0)`)
- `razorpayOrderId` (string, optional)
- `razorpayPaymentId` (string, optional — webhook idempotency lookups later)
- `status` (`options.list`: pending/confirmed/failed, default `pending`, required)
- `confirmedAt` (datetime, optional)

### `siteConfig` (singleton, fixed `_id: "siteConfig"`)
- `causeTitle` (string, required)
- `causeBlurb` (text, required)
- `fundMessage` (text, required)
- `minimumIncrement` (number, required, `min(1)`)
- `creatorName` (string, optional — left unset/placeholder, creator partnership unconfirmed per AGENTS.md section 1/12)
- `creatorPhoto` (image, optional)
- `creatorBlurb` (text, optional)

## Data layer (GROQ + fetch functions, in the Next app's `sanity/lib/`)
- `CATEGORIES_QUERY` — all categories, `order(title asc)`, `{_id, title, "slug": slug.current, description}`
- `ACTIVE_CYCLE_QUERY` — `*[_type == "cycle" && isActive == true][0]`, projected fields
- `SITE_CONFIG_QUERY` — `*[_id == "siteConfig"][0]`, projected fields, image resolved to url via `@sanity/image-url`
- `CONFIRMED_ENTRIES_QUERY` (param `$cycleId`) — `*[_type == "leaderboardEntry" && status == "confirmed" && cycle._ref == $cycleId] | order(amount desc)`, projected with `category->{_id, title, "slug": slug.current}` and `logo` resolved to a url
- `getActiveCycle()`, `getCategories()`, `getSiteConfig()`, `getConfirmedEntries(cycleId)`, and a composed `getLeaderboardData()` running the above in parallel (`Promise.all`), returning `{ cycle, categories, siteConfig, entries }` — `cycle`/`siteConfig` can be `null` pre-seeding, callers must handle that
- All filters use `_ref`/`_type`/`defined()` (optimizable per the GROQ skill), never `->` inside a filter

## Requirements
- `studio/` runs standalone via `npm install && npm run dev` inside that folder, serving Sanity Studio on its default port (3333), independent of the Next app's dev server.
- Next app (`npm run dev` at root) no longer serves anything at `/studio` — that route is gone.
- Schema deploys clean in the standalone Studio: all four types visible, `siteConfig` only reachable as the singleton, not duplicated in the generic list.
- Manually creating one `category`, one `cycle` (`isActive: true`), one `confirmed` `leaderboardEntry` referencing both, and the `siteConfig` singleton in the standalone Studio lets `getLeaderboardData()` (called from the Next app) return that data.
- No client component or client bundle in the Next app imports `sanity/lib/token.ts` or `sanity/lib/data.ts` with a browser target.
- `lib/mock-data.ts` and `app/page.tsx` untouched — swapping the home page to real data is a separate follow-up prompt.

## Security considerations
- `SANITY_API_READ_TOKEN` is server-only in the Next app: not `NEXT_PUBLIC_`-prefixed, never imported by a `"use client"` file, never returned in any API response body. Viewer-role token recommended (read-only), not write/admin scope.
- Studio's own env vars (`SANITY_STUDIO_*`) and its auth are Sanity's own project-member login — no custom auth layer added, per AGENTS.md section 11.
- `.env.example` files (root and `studio/`) document variable names only, no real values committed.
- No new write path introduced anywhere in this prompt.

## Acceptance criteria
- Root `npm run lint` passes clean.
- Root `npm run build` passes clean (config/route files changed, and deps were removed).
- `studio/` has its own working `npm run dev` and `npm run build` (Studio's Vite build), independent of the Next app.
- Visiting the Next app's `/studio` route returns a normal 404 (route no longer exists).
- Standalone Studio shows Category, Cycle, Leaderboard Entry as normal list items and Site Config as a singleton, not duplicated.
- Creating a `cycle` with `isActive: true` while another active cycle exists surfaces a validation warning/error in Studio.
- A throwaway test script/server component calling `getLeaderboardData()` against seeded test data returns the expected shape with no runtime errors.
- Both `.env.example` files exist with placeholder values and one-line comments.

## Checks to run
- Root: `npm install` (after dependency removal), `npm run lint`, `npm run build`
- `studio/`: `npm install`, `npm run dev` (verify Studio loads at localhost:3333), `npm run build`
- Root `npm run dev` — confirm `/studio` 404s and the rest of the site still runs
- Ad-hoc verification of the read layer (see manual test steps) since no page is wired to it yet

## Manual test steps
1. In `studio/`, copy `.env.example` to `.env` and fill in your real `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` (same project/dataset as the Next app's `1qmwb076` / `production`, per `.env.local`).
2. `cd studio && npm install && npm run dev` — confirm Sanity Studio loads at `http://localhost:3333`.
3. From `studio/`, run `npx sanity cors add http://localhost:3000 --credentials` so the Next app (once it fetches with a token) is an allowed origin.
4. In the Studio UI, confirm the sidebar shows Site Config (singleton) above a divider, then Category / Cycle / Leaderboard Entry as normal collections.
5. Create one `category` (e.g. "Individual" / slug `individual`).
6. Create one `cycle`, `startDate` today, `endDate` +3 months, `isActive: true`. Try creating a second `isActive: true` cycle — confirm a validation warning/error appears before you can publish it; discard that second one.
7. Create one `leaderboardEntry` referencing the category and cycle, `amount: 5000`, `status: confirmed`, required fields filled. Publish.
8. Fill in and publish the `siteConfig` singleton.
9. At the repo root, copy `.env.example` to `.env.local` additions — add a real `SANITY_API_READ_TOKEN` (Viewer-role token from sanity.io/manage → API → Tokens) alongside the existing two vars.
10. `npm run dev` at root — confirm `/studio` now 404s.
11. Temporarily add a throwaway server component (e.g. `app/(debug)/data-check/page.tsx` rendering `JSON.stringify(await getLeaderboardData())`) and confirm it returns the cycle, category, confirmed entry (with resolved category title/slug), and site config — then delete the throwaway file.
12. Confirm no `SANITY_API_READ_TOKEN` or other secret appears in browser dev tools / page source at any point.
