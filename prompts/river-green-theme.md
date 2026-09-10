# Implementation prompt: "River green" theme (replaces terracotta/cream palette)

## Goal
Replace the current warm cream + terracotta palette with a cooler "river green" palette that visually ties to the river-cleanup cause, per the user's chosen direction (confirmed via `AskUserQuestion`: cool off-white background, deep teal-green accent, green-tinted near-black text). Applies site-wide, light and dark mode.

## Skills / docs read
- AGENTS.md (rules 3, 12 — no reference design, design fresh but trustworthy/not gimmicky; creator partnership unconfirmed so nothing here is creator-branding, purely a color-token change)
- `prompts/claude-light-theme-palette.md` — precedent for the current palette; following the same token-only approach (no component restructuring) so this stays a low-risk, purely visual change.

## Code inspected
- `app/globals.css` — single source of truth for every color token (`--color-primary-*`, `--color-accent-*`, `--color-cream`, `--color-surface`, `--color-neutral-*`, `--color-success/error/warning/info`), consumed via Tailwind's `@theme inline` block, plus a `.dark` block that overrides the same custom properties (so `bg-cream/90`-style opacity utilities keep working automatically). No component currently hardcodes a color outside this system **except** `components/leaderboard/LeaderboardList.tsx`'s `getRankBg()`, which has three literal light/dark hex pairs for the top-3 row tints.
- Confirmed via grep that no other `.tsx` file contains a raw hex color — every other component uses Tailwind classes (`bg-accent-500`, `text-primary-500`, `bg-info/10`, etc.), so retinting the CSS variables re-themes the entire site with no per-component edits needed beyond that one file.
- `--color-primary-*` in the *current* palette is already a green scale (used for the Cause card, `--color-success`, and category tint for "Individual") — separate from `--color-accent-*` (terracotta, used for every CTA/highlight/active-state). Keeping two distinct greens (a darker "forest" primary and a brighter "teal" accent) avoids the two scales collapsing into a confusing near-duplicate once accent also turns green.

## Decisions / assumptions
- **Accent** (`--color-accent-*`) becomes the deep teal-green from the approved preview (`#1F7A5C` at 500), replacing terracotta as the dominant CTA/highlight/active-tab/claim-amount color everywhere.
- **Primary** (`--color-primary-*`) shifts from its current mid-green to a **deeper forest green** (`#1B4332` at 500) — kept as a distinct, cooler-adjacent-but-darker tone from accent so the two greens read as an intentional duotone (cause/CauseCard + success color) rather than a duplicate of the accent.
- **Background/surface**: `--color-cream` (and mirrored `--color-neutral-50`) moves from warm cream (`#faf9f5`) to the approved cool off-white (`#F7FAF8`); `--color-surface` stays white (`#ffffff`, already matches the approved preview).
- **Text**: `--color-neutral-900` moves to the approved green-tinted near-black (`#142420`); the rest of the neutral scale (700/500/300/200/100) is retinted with the same cool green cast, keeping their existing relative roles (900 = primary text, 700 = body-on-surface, 500 = secondary/meta text ≈ approved `#5C6B65`, 300/200/100 = borders/dividers/subtle fills).
- **Semantic colors**: `--color-success` moves to match the new accent teal (both are "green" conceptually, no reason to keep them different). `--color-error` (`#c93b2b`) and `--color-warning` (`#d97706`) stay as-is — they're semantic, not brand, and still read clearly against the new cool background. `--color-info` (`#6a9bcc`, used for the "Company" category tint) stays as-is — a blue secondary tag color pairs fine with a green primary/accent.
- **Shadows**: the shadow rgba base color updates from the old near-black `rgb(20,20,19)` to the new near-black `rgb(20,36,32)` so shadows stay tonally consistent with the new text/background color instead of leaving an orphaned warm-black tint.
- **`components/leaderboard/LeaderboardList.tsx`**: the three hardcoded light/dark hex pairs in `getRankBg()` (the #1/#2/#3 row background tints) get retinted from warm peach to cool mint, same relative saturation order preserved (rank #1 most tinted, tapering off).
- **Dark mode**: retints every token in the existing `.dark { ... }` block the same way (cream/surface/pill-bg/card-warm go to green-tinted darks; neutral-900/700/500 go to green-tinted lights for dark-mode text). One value is left untouched: dark-mode `--color-primary-100` (`#16261c`) was already a dark forest-green tint from the *original* palette (primary was already green) — it already fits the new direction as-is, so it's not being re-touched.
- Purely a design-token change — no component logic, no payment/webhook/ranking code touched.

## Files touched
- `app/globals.css` only (both `:root` and `.dark` blocks).
- `components/leaderboard/LeaderboardList.tsx` (`getRankBg()` hex values only).

## Requirements
- Every existing usage of `primary-*`, `accent-*`, `cream`, `surface`, `neutral-*`, `success` picks up the new colors automatically (no `className` changes needed anywhere else).
- Both light and dark mode retinted consistently.
- Contrast stays readable: text-on-background and text-on-surface pairings checked for reasonable contrast (dark green text on cool off-white/white, light green-tinted text on dark green-tinted backgrounds).

## Security considerations
- None — pure CSS token change, no logic touched.

## Acceptance criteria
- `npm run lint` passes clean (existing unrelated warnings aside).
- `npm run build` succeeds.
- Visual check: page background, cards, primary CTA buttons/active tabs/claim amount, and the top-3 leaderboard row tints all reflect the new teal-green/forest-green/cool-off-white palette in both light and dark mode.

## Checks to run
- `npm run lint`
- `npm run build`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000`.
2. Confirm the page background is cool off-white (not warm cream), body text is a green-tinted near-black.
3. Confirm "Claim rank" button, active category tab, active All-time/Today toggle, and the ₹ claim amount are all the new teal-green (not terracotta).
4. Check the top-3 leaderboard rows — confirm the background tints are cool mint tones, not warm peach.
5. Toggle dark mode — confirm background/surface/text/accent all retint consistently and remain readable.
6. Spot-check `/categories`, `/daily`, `/rules`, `/about` for the same consistent retint (Cause card, category icon tints, etc.).
