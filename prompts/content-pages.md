# Implementation prompt: About page + real content for FAQ/Terms/Privacy/Imprint

## Goal
Add a new `/about` page (origin story + mission + live stats, styled after outbid.lol's About page but with this project's own real data and voice) and replace the four remaining `ComingSoonPage` stubs (`/faq`, `/terms`, `/privacy`, `/imprint`) with real content grounded in how this specific app actually works. `/rules` already has real content — untouched.

## Skills / docs read
- AGENTS.md §1 (single cause, no overbuilding), §2 (workflow — read-only content pages, still gets a prompt since it's several files and legal-adjacent), §7 (must-outbid, cycles, confirmed-only, guest checkout, fund routing — these facts feed FAQ/Terms directly), §12 ("legal/compliance... is a real precondition to launch — do not let 'the code works' be mistaken for 'this is ready to publicly launch'"), §14 (creator partnership unconfirmed, keep config-driven).

## Code inspected
- `app/rules/page.tsx` — the one stub already done properly: fetches `getSiteConfig()`/`getActiveCycle()`, renders static rule copy plus a live "Right now" card. Used as the template for tone and the static-copy-plus-live-data pattern.
- `app/faq/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/imprint/page.tsx` — all four are `<ComingSoonPage title="X" />`, nothing else.
- `components/ComingSoonPage.tsx` — trivial placeholder, being replaced on these four routes (component itself can stay, unused elsewhere is fine — it's generic, not deleting it in case future stub pages want it).
- `studio/schemaTypes/siteConfig.ts` — real fields available: `causeTitle`, `causeBlurb`, `fundMessage`, `minimumIncrement`, `creatorName`/`creatorPhoto`/`creatorBlurb` (all optional, since creator partnership is unconfirmed per §14).
- `app/layout.tsx` — already computes `totalRaised`/`donorCount` from `getLeaderboardData()` for the Nav stat pill; About page reuses the same call, adding `topAmount` (via `scopeTopAmount`, already in `lib/filters.ts`) and `categories.length`.
- `components/Footer.tsx` — footer link list (`Rules, FAQ, Terms, Privacy, Imprint`) has no `About` entry; adding one.
- `components/Nav.tsx` — no About link in the top nav either (mirrors how "Our Cause" and "Categories" are the only top-nav content links); leaving About footer-only, consistent with Rules/FAQ/Terms/etc. also being footer-only, not top-nav.

## Decisions (per your answers)
1. **Legal pages get clearly-flagged placeholders, not invented facts.** Terms, Privacy, and Imprint will have real structure and real behavioral copy (what data is collected, how payment works, no-refund/guest-checkout consequences, fund routing via external trust, cycle/archival behavior) but every field that requires an actual registered legal identity — entity/trust name, registered address, grievance officer name+contact, governing jurisdiction, effective date — is rendered as a visible bracketed placeholder (e.g. `[Registered entity name — pending]`) inside a highlighted "Legal review pending" notice at the top of each page. Nothing here should be mistaken for a reviewed legal document; that's still gated on the real-world NGO/trust decision from AGENTS.md §7/§12.
2. **About page stats are live**, computed the same way `app/layout.tsx` already does for the Nav pill: `totalRaised`, `donorCount` (confirmed entries in the active cycle), plus `topAmount` (current #1) and `categories.length`. Pre-launch this correctly shows small/zero numbers — no fabricated outbid.lol-style figures ("$256,341 revenue" etc. from your reference screenshot is explicitly not reused).
3. **No creator/launch-date claims.** outbid.lol's About leads with a specific launch date and "from the people who took #1" — this app has no confirmed launch date and the creator partnership is unconfirmed (§14), so the origin story is written about the *project* (why a must-outbid leaderboard for a cause, what changes when someone donates, how cycles/archival work) rather than a specific person or date. If `siteConfig.creatorName` is set, a short "the cause" blurb using it renders (matching the pattern already used in `/rules` for `fundMessage`); if unset, that section is omitted rather than left blank.

## Files touched
- `app/about/page.tsx` (new) — Server Component. Static mission/origin copy + a live stats grid (`totalRaised`, `donorCount`, `topAmount`, `categories.length`) from `getLeaderboardData()`/`scopeTopAmount`. Conditionally renders a creator/cause blurb block if `siteConfig.creatorName` is set.
- `app/faq/page.tsx` — real content: ~8–10 Q&As covering how outbidding works, minimum increment, what happens on payment failure, why there's no "my donations" page (guest checkout, §7), how cycles/archives work, where the money goes (fund routing, §7), how categories work, why an entry can be removed/corrected (Studio moderation, §11). Static array + simple `<details>`/accordion-style markup, same visual language as `/rules` (`Card` components), no client JS needed.
- `app/terms/page.tsx` — real terms structure (guest checkout, no accounts, payment via Razorpay, no refund path since there's no account to refund into beyond dispute/chargeback via Razorpay, must-outbid amount can change before payment completes, entries can be corrected/removed by Studio moderators, cycle resets are not entry deletion) with the legal-review-pending notice and bracketed identity placeholders per decision #1.
- `app/privacy/page.tsx` — real structure (what's collected: display name, optional company name, amount, payment metadata from Razorpay; no accounts/passwords/tracking libraries per §6; Sanity as the data store; no analytics) with the same pending-review notice for the data-controller identity/contact fields.
- `app/imprint/page.tsx` — minimal real structure (site operator/contact, hosting note) with the same placeholders for whichever entity legally operates the site.
- `components/Footer.tsx` — add `{ label: "About", href: "/about" }` to `footerLinks`.

## Requirements
- No fabricated legal identity facts (entity name, address, registration number, jurisdiction) anywhere — placeholders only, visually distinct (a banner/callout, not blending into body copy).
- No fabricated traffic/revenue numbers — About page stats come only from live `getLeaderboardData()`.
- No hardcoded creator name/photo as if a partnership is confirmed (§14) — creator content only renders when `siteConfig.creatorName` is actually set.
- Same visual language as `/rules` (`Card`, `text-h1`/`text-body`/`text-small` tokens, `mx-auto max-w-3xl` container), so the site doesn't feel like five different design systems.
- All five pages (`/about` + 4 rewritten stubs) are plain Server Components, no new client state.
- Mobile-first, dark-mode consistent (reuse existing `bg-surface`/`dark:ring-1 dark:ring-white/5` tokens).

## Security considerations
- Pure read-side content pages; About's stats reuse the existing server-side `getLeaderboardData()` call (server-only read token), no new data exposure — same numbers already shown via the Nav stat pill, just presented more fully.

## Acceptance criteria
- `npm run lint` and `npm run build` pass clean.
- `/about`, `/faq`, `/terms`, `/privacy`, `/imprint` all render real content, no `ComingSoonPage` left in the tree.
- About page's stat numbers match what's currently shown in the Nav's stat pill (same underlying data).
- Every legal-identity placeholder is visually flagged as pending, not presented as finished legal text.
- Footer's "About" link works from every page.

## Checks to run
- `npm run lint`
- `npx tsc --noEmit` (or `npm run build`)
- `npm run build`
- You already have `npm run dev` running — manual test against that.

## Manual test steps (for you to run)
1. Visit `/about` — confirm stats match the Nav pill's numbers, no fake outbid.lol-style figures, no creator section if `siteConfig.creatorName` is unset in Studio.
2. Visit `/faq`, `/terms`, `/privacy`, `/imprint` — confirm real content, and that Terms/Privacy/Imprint each show an obvious "legal review pending" notice with bracketed placeholders rather than invented specifics.
3. Click "About" in the footer from a few different pages — confirm it always reaches `/about`.
4. Resize to 375px and toggle dark mode on all five pages.
