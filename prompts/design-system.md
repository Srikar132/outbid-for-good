# Implementation prompt: Design system foundation

## Goal
Translate user-supplied design-system reference sheet (`desgin/design-system.png`) into working Tailwind v4 tokens + reusable UI primitives + a style-guide page to visually verify them. No leaderboard/payment logic yet — repo has no Sanity/Razorpay wiring, so this is foundation-only.

## Skills / docs read
- AGENTS.md, CLAUDE.md (process, stack, boundaries)
- frontend-design skill (loaded, but brief is fully spec'd by the reference image — no new aesthetic decisions needed, mechanical translation only)
- Tailwind v4 uses CSS-first config via `@theme` in globals.css; no `tailwind.config.ts` in this repo

## Code inspected
- `app/globals.css` — stock create-next-app v4 setup, only `--background`/`--foreground` tokens
- `app/layout.tsx` — Geist Sans/Mono via `next/font/google`
- `app/page.tsx` — stock create-next-app boilerplate page
- `package.json` — Next 16.3.4, React 19, Tailwind v4, no icon library, no `tailwind.config.ts`
- No `web`/`studio` workspace split yet, no Sanity project, no git repo — this is pre-scaffold. Design system work is workspace-agnostic; will live under current `app/` root for now.

## Decisions / assumptions
- Replace Geist fonts with **Sora** (display/headings) + **Inter** (body/UI) per spec, via `next/font/google`.
- Add **lucide-react** as icon dependency (outline + filled variants needed: crown, heart, users, bar-chart, lock, shield-check, info, arrow-right — lucide covers all via `fill="currentColor"` for filled style).
- Tailwind v4 default spacing scale (4px base, `1`=4px…`16`=64px) already matches spec's spacing system — no custom spacing tokens needed.
- Define custom `@theme` tokens for: color palette (primary green, accent orange, neutrals, semantic), radius scale (xs/sm/md/lg/xl/full), shadow scale (sm/md/lg) — these don't match Tailwind defaults and the spec names them explicitly.
- Type scale implemented as named utility classes (`.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-body-lg`, `.text-body`, `.text-small`) composing font/size/line-height/weight, so components reference one class instead of repeating four utilities.
- Build reusable primitives, not one-off markup: `Button`, `Badge`, `StatusDot`, `ProgressBar`, `Card` (generic) + composed example cards (CurrentRank, DonateCTA, PaymentStatus, Cause), `DonationInput`, `Nav`.
- Replace `app/page.tsx` with a style-guide/showcase page assembling every section from the reference sheet (colors, type, buttons, inputs, badges, status, progress, cards, nav, principles) — this is the only way to visually verify the system per AGENTS.md's "test in browser" rule, and there's no real leaderboard page to build yet (no Sanity data layer exists). This page gets replaced later when the real leaderboard page is built.
- No dark-mode spec given in the reference sheet (it's a light, trustworthy look per AGENTS.md section 3) — drop the existing `prefers-color-scheme: dark` block rather than half-support it.

## Files touched
- `app/globals.css` — theme tokens (colors, radius, shadow), type-scale utility classes
- `app/layout.tsx` — swap fonts to Sora + Inter
- `app/page.tsx` — replaced with style-guide showcase
- `app/components/ui/Button.tsx`
- `app/components/ui/Badge.tsx`
- `app/components/ui/StatusDot.tsx`
- `app/components/ui/ProgressBar.tsx`
- `app/components/ui/Card.tsx`
- `app/components/ui/DonationInput.tsx`
- `app/components/Nav.tsx`
- `package.json` — add `lucide-react`

## Requirements
- Colors: Primary green 500/400/300/200/100 (#15803D/#16A34A/#4ADE80/#86EFAC/#DCFCE7), Accent orange 500/400/300/200/100 (#FF5A1F/#FF7A45/#FFA37A/#FFC7B0/#FFE9DF), Neutrals 900/700/500/300/200/100/50/white, Semantic success/error/warning/info.
- Type scale exactly as spec'd (Sora Bold 48/56 display, Sora Bold 32/40 h1, Sora Semibold 24/32 h2, Sora Semibold 20/28 h3, Inter Semibold 16/24 body-lg, Inter Regular 14/20 body, Inter Regular 12/16 small).
- Radius xs4/sm8/md12/lg16/xl24/full; shadow sm/md/lg with spec's exact rgba values.
- Buttons: primary (solid accent-500), secondary (light green pill), tertiary (plain text link), text (small link w/ arrow) — each with default/hover/disabled.
- Donation amount input: default/success/error states with icon + helper text, plus a secure payment-details input example with lock icon.
- Badges: `#1 CURRENT`, `PAYMENT CONFIRMED`, `PENDING`, `PAYMENT FAILED`, `DONOR`, `COMPANY`.
- Status rows: confirmed (green dot)/pending (orange dot)/failed (red dot)/webhook-confirmed (blue dot)/#1-current (crown).
- Progress bar "Race to the Top" with current amount, filled bar, next-bid copy, and a note callout.
- 4 example cards (Current #1, Outbid & Donate, Payment Status, Our Cause) using the primitives above.
- Nav with wordmark, Leaderboard/Our Cause links, primary CTA.
- Principles row (4 short cards: Impact First, Must Outbid, Payment Trust, Clarity).
- Mobile-first responsive (AGENTS.md section 3 — most traffic is mobile from IG bio link).

## Security considerations
None — static UI/token work only, no data fetching, no secrets, no user input persisted.

## Acceptance criteria
- `npm run build` and `npm run lint` pass clean.
- Style-guide page renders every section from the reference sheet correctly in light mode, mobile (375px) through desktop.
- No hardcoded creator name/photo (n/a here — no creator content in this scope).
- Components are generic/reusable (no leaderboard-specific data shapes baked in yet).

## Checks to run
- `npm run lint`
- `npm run build`
- `npm run dev` and manually view the style-guide page at a few viewport widths

## Manual test steps
1. `npm run dev`, open `http://localhost:3000`.
2. Confirm fonts render as Sora (headings) / Inter (body) — check devtools computed font-family.
3. Resize to 375px width — confirm nav, cards, buttons stack/reflow without horizontal scroll.
4. Verify each button variant's default/hover/disabled states visually match spec colors.
5. Verify donation input shows green success state and red error state as specced (static demo states, not wired to real validation logic yet).
6. Verify badges, status rows, progress bar, and all 4 cards match the reference sheet's colors/copy/layout.
