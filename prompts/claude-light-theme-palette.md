# Implementation prompt: Claude light theme color palette update

## Goal
Update the application UI color tokens in `app/globals.css` and associated component styling to adopt Claude's official light theme color palette using the exact hex codes specified by the user (`#D97757`, `#141413`, `#FAF9F5`, `#B0AEA5`, `#E8E6DC`, `#6A9BCC`). Ensure a premium, ultra-clean, and visually cohesive experience.

## Skills / docs read
- AGENTS.md (rules 2, 3, 7, 13)
- `app/globals.css` (Tailwind v4 `@theme` configuration)

## Code inspected
- `app/globals.css`: CSS variables (`--color-primary-*`, `--color-accent-*`, `--color-cream`, `--color-surface`, `--color-neutral-*`), `@theme inline` declarations, dark mode overrides.
- `components/ui/`: `Button.tsx`, `Badge.tsx`, `Card.tsx`, `DonationInput.tsx`, `ProgressBar.tsx`, `StatusDot.tsx`.
- `components/leaderboard/`: `ClaimBand.tsx`, `LeaderboardList.tsx`, `DonateForm.tsx`, `CategoryTabs.tsx`, `ViewToggle.tsx`, `EntryDetail.tsx`.
- `components/Nav.tsx`, `components/Footer.tsx`.

## Decisions / assumptions
- Map exact user-provided Claude Light Theme color palette:
  - **Light background (Canvas / Cream)**: `#FAF9F5` (`--background`, `--color-cream`, `--color-neutral-50`)
  - **Dark text / dark background**: `#141413` (`--foreground`, `--color-neutral-900`)
  - **Primary accent (Terracotta / Outbid Orange)**: `#D97757` (`--color-accent-500`)
  - **Light gray (Dividers, card borders, subtle background)**: `#E8E6DC` (`--color-neutral-200`, `--color-neutral-100`)
  - **Mid gray (Secondary text / subtle borders)**: `#B0AEA5` (`--color-neutral-500`, `--color-neutral-300`)
  - **Accent blue (Highlights / Links)**: `#6A9BCC` (`--color-info`)
  - **Surface background**: `#FFFFFF` (Card container fill in light mode)
  - **Color Scales**:
    - Accent (`--color-accent-*`): `500`: `#D97757`, `400`: `#E28A6D`, `300`: `#EB9E84`, `200`: `#F5BEAC`, `100`: `#FAF0EB`, `50`: `#FCF6F3`
    - Neutrals (`--color-neutral-*`): `900`: `#141413`, `700`: `#57554E`, `500`: `#B0AEA5`, `300`: `#CBD5E1`, `200`: `#E8E6DC`, `100`: `#F4F3EE`, `50`: `#FAF9F5`
    - Primary Green (Donations / Cause): `500`: `#2E5B44`, `100`: `#E8F2EA`
- Apply these tokens across all UI components so navigation, leaderboard items, claim band, badges, buttons, cards, and footer display a consistent, highly polished Claude aesthetic.

## Files touched
- `app/globals.css`
- `components/Nav.tsx`
- `components/Footer.tsx`
- `components/ui/Button.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Card.tsx`
- `components/ui/DonationInput.tsx`
- `components/ui/ProgressBar.tsx`
- `components/leaderboard/ClaimBand.tsx`
- `components/leaderboard/LeaderboardList.tsx`
- `components/leaderboard/CategoryTabs.tsx`
- `components/leaderboard/ViewToggle.tsx`

## Requirements
- Update CSS color variables to match the user's exact Claude palette.
- Ensure proper contrast ratios for text and interactive elements.
- Verify both light and dark modes are clean and readable.

## Security considerations
- Pure UI styling change. No business logic, data layer, or payment verification code affected.

## Acceptance criteria
- `npm run lint` passes clean.
- `npm run build` succeeds without errors.
- Visual check confirms the `#FAF9F5` canvas, `#D97757` terracotta accent, `#141413` text, `#B0AEA5` secondary text, `#E8E6DC` borders, and `#6A9BCC` link/info accents.

## Checks to run
- `npm run lint`
- `npm run build`

## Manual test steps
1. Run `npm run dev` and navigate to `http://localhost:3000`.
2. Verify overall page background `#FAF9F5` and dark text `#141413`.
3. Verify primary action buttons, outbid highlights, and badges use `#D97757`.
4. Verify secondary labels use `#B0AEA5` and card borders use `#E8E6DC`.
5. Verify link/info highlights use `#6A9BCC`.
6. Confirm dark mode toggle displays clean `#141413` surface with appropriate `#E8E6DC` borders.
