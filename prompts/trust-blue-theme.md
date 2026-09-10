# Implementation prompt: "Trust blue" theme (replaces River green)

## Goal
Swap the current River green palette for "Trust blue" — the standard nonprofit/fintech cool-white + confident-blue palette, per the user's re-selected direction (confirmed via `AskUserQuestion`).

## Skills / docs read
- AGENTS.md (rule 3 — trustworthy/transparent look for a real-money charity site; this direction is literally chosen for that reason)
- `prompts/river-green-theme.md` and `prompts/claude-light-theme-palette.md` — same token-only approach, reused again: retint `app/globals.css` custom properties, no component restructuring.

## Code inspected
- `app/globals.css` — same single source of truth as the last two theme swaps.
- `components/leaderboard/LeaderboardList.tsx` `getRankBg()` — the one place with hardcoded hex (top-3 row tints), needs updating again to match the new hue.
- `components/leaderboard/LeaderboardList.tsx` / `TodayTopRanking.tsx` `logoTint` — `company: "bg-info/10 text-info"` uses the `--color-info` token for the "Company" category tag tint. Since `--color-accent-*` is about to become blue too, leaving `--color-info` blue would make the Company tag visually indistinguishable from every other accent-colored element (buttons, active tabs, claim amount). Retinting `--color-info` to a distinct hue (indigo) avoids that clash without touching any component's className.

## Decisions / assumptions
- **Accent** (`--color-accent-*`) becomes the confident blue from the approved preview (`#2563EB` at 500) — the CTA/highlight/active-tab/claim-amount color everywhere.
- **Primary** (`--color-primary-*`) becomes a deep navy (`#1E3A5F` at 500) — distinct from the brighter accent blue, used for the Cause card and other "primary but not a CTA" spots; same reasoning as the forest-green/teal-green split in the River green theme.
- **Background/neutrals**: adopts Tailwind's own slate scale, since the approved preview's exact values (`#F8FAFC` background, `#0F172A` text, `#64748B` secondary text) are literally Tailwind's `slate-50`/`slate-900`/`slate-500` — using the full slate scale for the rest of the neutral steps keeps everything internally consistent and already contrast-tested.
- **`--color-info` changes from blue to indigo** (`#7C6FD1`) — the only semantic token being retinted for a reason other than "matches the new brand color": it existed specifically to be a *different* hue from the main brand color for the Company tag, and blue-on-blue would defeat that purpose now that accent is blue.
- **`--color-success` becomes a standalone green** (`#16A34A`) instead of matching the brand color — unlike the two green-brand themes (where success naturally overlapped with primary/accent), a blue brand makes "success = green" the more standard, recognizable convention, so it's kept independent here.
- **`--color-error`** (`#c93b2b`) and **`--color-warning`** (`#d97706`) stay unchanged — semantic, not brand-dependent, already tested to read fine against a light neutral background.
- **Shadows**: rgba base updates to the new near-black slate (`rgb(15, 23, 42)`) to stay tonally consistent with the new text color.
- **`getRankBg()` row tints** move from mint green to cool light-blue tones, same relative saturation ordering (rank #1 most tinted, tapering off).
- **Dark mode**: full `.dark` block retinted to deep-navy darks with slate-toned light text, following the same pattern as the previous two theme swaps.
- Purely a design-token change — no component logic, no payment/webhook/ranking code touched.

## Files touched
- `app/globals.css` only (`:root` and `.dark` blocks).
- `components/leaderboard/LeaderboardList.tsx` (`getRankBg()` hex values only).

## Requirements
- Every existing usage of `primary-*`, `accent-*`, `cream`, `surface`, `neutral-*`, `success`, `info` picks up the new colors automatically — no `className` changes anywhere else.
- Both light and dark mode retinted consistently.
- Contrast stays readable in both modes.

## Security considerations
- None — pure CSS token change.

## Acceptance criteria
- `npm run lint` passes clean (existing unrelated warnings aside).
- `npm run build` succeeds.
- Visual check: background, cards, CTA buttons/active tabs/claim amount, and top-3 row tints all reflect the new blue/navy/slate palette in both light and dark mode; the "Company" category tag reads as a distinct indigo, not the same blue as the CTAs.

## Checks to run
- `npm run lint`
- `npm run build`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000`.
2. Confirm background is cool white/slate, text is slate-black, "Claim rank" / active tabs / claim amount are confident blue.
3. Check a "Company" category entry's tag — confirm it reads as indigo, visually distinct from the blue CTAs.
4. Check the top-3 leaderboard rows for the new light-blue tints.
5. Toggle dark mode — confirm consistent, readable retint.
6. Spot-check `/categories`, `/daily`, `/rules`, `/about`.
