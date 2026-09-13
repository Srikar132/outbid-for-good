# Mobile nav: overlay instead of push

## Goal
On mobile, opening the hamburger menu currently expands a block inside the sticky
header, which pushes the entire page content down. It should overlay the page
instead — content stays put, menu floats above it with a dimmed backdrop.

## Skills / docs read
- AGENTS.md (sections 3 UI work, 5 boundaries, 13 checks)
- Existing code only; no Sanity/Razorpay surface touched. No Next.js docs needed
  (no routing/server-boundary change — component already `"use client"`).

## Code inspected
- `components/Nav.tsx` — the only menu component. Panel at lines 107-128 renders
  in normal flow under `<nav>`, inside `<header class="sticky top-0 z-20">`,
  so it adds height to the header and displaces everything below.
- `app/layout.tsx:36` — `<Nav stats={...} />` mounted above `{children}`.
- `app/style-guide/page.tsx:54` — second `<Nav />` mount, no stats.

## Decisions
- Panel becomes `absolute top-full left-0 right-0` inside the header. `position:
  sticky` already establishes a containing block, so no extra `relative` needed,
  but add it explicitly for clarity/safety.
- Backdrop is `fixed inset-0 bg-neutral-900/40` at a z-index **below** the
  header's `z-20`, so the header (logo, theme toggle, close button) stays visible
  and clickable while the rest of the page dims. Clicking the backdrop closes.
- Panel gets `max-h-[calc(100dvh-theme header)]` + `overflow-y-auto` so a long
  link list never exceeds the viewport on short phones.
- Lock `document.body` scroll while the menu is open (restore prior value on
  close/unmount) so the page behind doesn't scroll under the overlay.
- Keep existing Escape-to-close handler; keep `aria-expanded` / `aria-controls`.
- No animation library — a short CSS transition/`animate-in` at most, matching
  the existing plain-Tailwind style in this file.

## Files expected to change
- `components/Nav.tsx` (only)

## Requirements
1. Opening the menu must not change the layout or scroll position of page content.
2. Menu renders above page content, below/beside the header bar.
3. Backdrop dims page, closes menu on click.
4. Escape closes (existing behaviour preserved).
5. Body scroll locked while open, restored on close.
6. Selecting a link closes the menu (existing behaviour preserved).
7. Desktop (`md:` and up) unchanged — panel and hamburger still `md:hidden`.
8. Works at 360px width.

## Security considerations
None — presentational client component. No payment, webhook, ranking, token, or
Sanity write path is touched. Server/client boundary unchanged.

## Acceptance criteria
- At 360px, toggling the menu leaves the hero/leaderboard pixel-position unchanged.
- Backdrop click, Escape, and link click all close the menu.
- Background does not scroll while menu is open; scrolling restored after close.
- Type check and lint clean.

## Checks to run
- `npx tsc --noEmit`
- `npm run lint`
- (No build — no routes, config, or server modules changed.)

## Manual test steps
1. `npm run dev`, open `http://localhost:3000` in a 360px-wide mobile viewport.
2. Note the vertical position of the first leaderboard row.
3. Tap the hamburger — menu overlays, page behind dims, row does not move.
4. Try scrolling the dimmed page — it must not scroll.
5. Tap the backdrop — menu closes, scrolling works again.
6. Reopen, press Escape — closes.
7. Reopen, tap "Daily" — navigates and menu is closed.
8. Resize to desktop — hamburger gone, inline links shown, no stray overlay.

## Addendum — smooth transition (requested mid-implementation)
- Panel and backdrop are now **always mounted** rather than conditionally
  rendered, so both open and close can animate.
- Backdrop: opacity 0→100 over 200ms ease-out. Panel: opacity + `-translate-y-2`
  → `translate-y-0` over 200ms ease-out.
- `visibility` is included in each `transition-[...]` property list. Without it
  the `invisible` class applies instantly on close and the fade-out is never
  seen; with it, visibility flips discretely at the end of the 200ms.
- Closed state also sets `tabIndex={-1}` on the links and `invisible` on the
  containers, so a hidden menu stays out of the tab order and a11y tree.
- `motion-reduce:transition-none` on both, honouring prefers-reduced-motion.
