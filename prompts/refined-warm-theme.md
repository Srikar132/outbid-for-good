# Implementation prompt: "Refined warm" theme (revert to cream/terracotta, polished)

## Goal
Return to the site's original cream + terracotta palette (before the River green and Trust blue detours), but with the "polish" promised in that option: tightened secondary-text contrast and slightly more defined card borders/shadows so it reads less flat, per the user's re-selected direction (confirmed via `AskUserQuestion`).

## Skills / docs read
- `prompts/claude-light-theme-palette.md`, `prompts/river-green-theme.md`, `prompts/trust-blue-theme.md` — same token-only approach again; this one also restores the values those two previously changed.

## Code inspected
- `app/globals.css` — current state is the Trust blue palette from the last swap; comparing against the original values captured earlier in this session (before any theme swap) to revert `--color-primary-*`, `--color-accent-*`, `--color-cream`, `--color-surface`, `--color-card-warm`, `--color-pill-bg`, and `--color-neutral-*` back to their original hex values, in both `:root` and `.dark`.
- `components/leaderboard/LeaderboardList.tsx` `getRankBg()` — currently light-blue (from Trust blue); reverting to the original warm peach/cream tints.

## Decisions / assumptions
- **Hue reverts exactly** to the original: terracotta accent (`#D97757` at 500), mid-forest-green primary (`#2E5B44` at 500, doubling as `--color-success` like before), warm cream background (`#FAF9F5`), `--color-info` back to the original soft blue (`#6A9BCC` — safe to revert since accent is terracotta again, no blue-on-blue clash).
- **Secondary text gets darkened for contrast**, per the option's own preview: `--color-neutral-500` moves from the original `#B0AEA5` (a low-contrast ~2.3:1 against white) to `#6B6862` (~4.6:1, comfortably readable at the small meta-text sizes it's used at). The rest of the neutral scale (700/300/200/100) is nudged to keep an even step between 900 and the new, darker 500, rather than reverting those verbatim — a straight revert would leave 500 an outlier next to unchanged neighbors.
- **Shadows get a touch more definition**: opacity and spread increase slightly across `--shadow-sm/md/lg`, and each gains a hairline `0 0 0 1px` ring (a very faint version of the same near-black tint) so cards read as "bordered" rather than purely shadow-floated — mirroring the pattern the `.dark` block already uses for its own shadow rings, just applied in light mode too. This addresses "tightened... borders" without touching any component's className (every card already consumes `shadow-sm/md/lg`).
- Accent/primary hue values themselves are **not** re-tuned — "the cream + terracotta feel" is what's being restored, not reinvented; only contrast/definition is being polished.

## Files touched
- `app/globals.css` only (`:root` and `.dark` blocks).
- `components/leaderboard/LeaderboardList.tsx` (`getRankBg()` hex values only, reverted).

## Requirements
- Every existing usage of `primary-*`, `accent-*`, `cream`, `surface`, `neutral-*`, `success`, `info` picks up the reverted/refined colors automatically.
- Both light and dark mode consistent.
- Secondary/meta text is more legible than the original without changing which elements use `neutral-500`.

## Security considerations
- None — pure CSS token change.

## Acceptance criteria
- `npm run lint` passes clean (existing unrelated warnings aside).
- `npm run build` succeeds.
- Visual check: warm cream background, terracotta CTAs/active states, secondary/meta text visibly more legible than before, cards showing a subtle hairline edge in addition to their shadow.

## Checks to run
- `npm run lint`
- `npm run build`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000`.
2. Confirm background is warm cream again, CTAs/active tabs/claim amount are terracotta.
3. Check meta text (timestamps, click counts, category labels) — should read more clearly than the original muted gray.
4. Check card edges (leaderboard rows, Cause card) — should show a faint hairline border, not just a soft shadow.
5. Toggle dark mode — confirm consistent, readable retint.
6. Spot-check `/categories`, `/daily`, `/rules`, `/about`.
