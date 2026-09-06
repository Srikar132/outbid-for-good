# Implementation prompt: Home / leaderboard page (mock data)

## Goal
Build the real home page — the public leaderboard — per AGENTS.md section 5/7, using mock/static data instead of Sanity for now. This nails layout, filtering, and the must-outbid display logic before any backend wiring. Payment flow (Razorpay) and real Sanity schema are explicitly out of scope for this prompt — those are separate, money-touching prompts that need their own approval per AGENTS.md section 2.

## Skills / docs read
- AGENTS.md sections 1, 3, 5, 7, 9, 12 (leaderboard behavior, must-outbid rule, cycle model, payment boundary, creator-partnership caveat)
- `node_modules/next/dist/docs/` for App Router route handler conventions (server redirect route)
- No Sanity skill needed this pass — data is mocked, not fetched from Sanity

## Code inspected
- `app/page.tsx` — currently the design-system style-guide showcase (built in the previous prompt)
- `app/components/ui/*` — Button, Badge, StatusDot, ProgressBar, Card (+ CurrentRankCard, DonateCard, PaymentStatusCard, CauseCard), DonationInput
- `app/components/Nav.tsx`
- `app/globals.css` — color/type/radius/shadow tokens already defined

## Decisions / assumptions (per your answers)
- **Data source**: mock/static data module, not Sanity. Shapes mirror AGENTS.md section 8 (cycle, entry, category, site config) so swapping in real GROQ queries later is a data-layer swap, not a UI rewrite.
- **Repo structure**: stays flat at root (no web/+studio/ split yet).
- **Cause content**: generic, obviously-placeholder copy. No creator name/photo implying a confirmed partnership — site config shows a generic cause description only.
- Move the existing style-guide showcase from `app/page.tsx` to `app/style-guide/page.tsx` so it's still reachable, and `app/page.tsx` becomes the real home page.
- Click-through still goes through a server route (`app/api/click/[id]/route.ts`) even with mock data — this preserves the "browser never writes click count" boundary from day one instead of introducing a client-side write now that has to be ripped out later. The mock store increments in-memory (resets on server restart) and 302-redirects to the entry's URL.
- "Outbid & Donate" CTA is a **static entry point only** — clicking it can open a form (name/company/amount) that client-side validates against the must-outbid rule (amount > current top + min increment) for UX feedback, but it does not submit anywhere or create a real order. No Razorpay checkout, no order creation — that is out of scope and belongs in a separate, approved prompt per AGENTS.md section 9.
- Archive/past-cycles view is out of scope for this prompt — only the active cycle renders.
- Today filter: since there's no real webhook timestamp yet, "Today" filters mock entries by a `confirmedAt` field also present in the mock data (same shape it'll have from Sanity).

## Files touched
- `app/lib/mock-data.ts` — mock `Cycle`, `Category`, `LeaderboardEntry`, `SiteConfig` + an in-memory click-count store
- `app/page.tsx` — replaced with the real leaderboard home page
- `app/style-guide/page.tsx` — the moved showcase (unchanged content, new location)
- `app/components/leaderboard/Hero.tsx` — current #1 + progress bar + CTA entry point (composes existing `CurrentRankCard`/`ProgressBar`)
- `app/components/leaderboard/CategoryTabs.tsx`
- `app/components/leaderboard/ViewToggle.tsx` (All-time / Today)
- `app/components/leaderboard/LeaderboardList.tsx` — ranked rows (rank, logo/avatar, name, optional company badge, category badge, amount, click-through link)
- `app/components/leaderboard/DonateForm.tsx` — name/company/amount fields, client-side must-outbid validation, no submit action yet (disabled submit or "coming soon" state)
- `app/api/click/[id]/route.ts` — server-only redirect + mock click increment

## Requirements
- Leaderboard shows only "confirmed" mock entries, sorted by amount descending, ranked from 1 within the active cycle.
- Category tabs filter the list; "All" plus each mock category. Today/All-time toggle filters by `confirmedAt` (both scoped to the active cycle only, per section 7).
- Current top amount and minimum increment (from mock site config) drive: the Hero's "next minimum bid" display, and the DonateForm's client-side validation (reject amounts below top + increment, matching section 7 — this must not be silently relaxed).
- A running total (sum of confirmed entries in the active cycle) is visibly displayed, and the confirmed-donor count.
- Click on an entry's name/logo hits `/api/click/[id]`, which redirects (302) to the entry's URL and increments the mock counter server-side only — nothing in a client component writes the count.
- Mobile-first responsive: nav → hero → toggle/tabs → list stacks cleanly at 375px, no horizontal scroll.
- Reuses the existing design-system primitives (Button, Badge, StatusRow, ProgressBar, Card) rather than one-off markup.

## Security considerations
- Click-count mutation happens only in the server route handler, never in a client component — preserves the real boundary this will need once Sanity is wired in.
- DonateForm collects input but does not transmit it anywhere (no fetch/POST) — nothing to secure yet, but also nothing that could leak or be abused, since this prompt intentionally stops short of order creation.
- No secrets/env vars introduced this pass.

## Acceptance criteria
- `npm run lint` and `npm run build` pass clean.
- Home page at `/` renders the mock leaderboard; `/style-guide` still renders the design-system showcase unchanged.
- Category filter and All-time/Today toggle both work client-side against the mock data.
- Attempting a DonateForm amount below current-top + increment shows a rejection state (mirrors the Inputs error state from the design system); an amount above it shows the success state. Neither submits anywhere.
- Clicking an entry navigates through `/api/click/[id]` (visible as a redirect in Network tab) rather than linking straight to the external URL.
- No hardcoded real creator name/photo; site-config-driven placeholder copy only.

## Checks to run
- `npm run lint`
- `npm run build`
- `npm run dev` — manually exercise filters, toggle, DonateForm validation, and the click-through redirect

## Manual test steps
1. `npm run dev`, open home page.
2. Confirm entries render sorted descending by amount, ranked 1..N.
3. Switch category tabs — list filters correctly; switch back to "All".
4. Toggle All-time/Today — confirm the entry set changes based on mock `confirmedAt` values.
5. Open the donate form, enter an amount below current top + increment — confirm rejection UI, no navigation/submission occurs.
6. Enter a valid higher amount — confirm success UI, still no submission occurs (this is expected; real payment flow is a separate prompt).
7. Click an entry's logo/name — confirm the request goes through `/api/click/[id]` (check Network tab for the redirect) before landing on the external URL.
8. Resize to 375px — confirm no horizontal scroll and sensible stacking.
9. Visit `/style-guide` — confirm it still renders the full design-system reference page.
