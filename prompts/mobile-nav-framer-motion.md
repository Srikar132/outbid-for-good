# Mobile nav animation with Framer Motion

## Goal
Replace the hand-rolled CSS transitions on the mobile nav overlay (added in
`prompts/mobile-nav-overlay.md`) with Framer Motion, and extend the motion to the
rest of the menu interaction: backdrop fade, panel slide-in, staggered link
reveal, and the hamburger ↔ close icon swap.

## Skills / docs read
- AGENTS.md (section 3 UI work, section 6 stack, section 13 checks, section 14
  keep it small)
- `node_modules/next/dist/docs/` — client-component boundary for a
  motion-driven component (Nav is already `"use client"`, so no boundary change).
- No Sanity or Razorpay surface involved.

## Code inspected
- `components/Nav.tsx` — current state: panel + backdrop always mounted,
  `transition-[opacity,transform,visibility]`, `invisible`/`tabIndex={-1}` when
  closed, `motion-reduce:transition-none`.
- `package.json` — `framer-motion` is **not** a declared dependency.
- `npm ls framer-motion motion` — v13.2.0 is hoisted into `node_modules` only as
  a transitive dep of `next-sanity → @sanity/ui`. Relying on that is fragile: a
  Sanity bump could drop or move it and the web build breaks.

## Decisions
- **Add `framer-motion@^13.2.0` as a direct dependency.** Pinning the same major
  already hoisted keeps npm deduping to one copy — no second bundled runtime.
- Go back to **conditional rendering** wrapped in `<AnimatePresence>`. Framer
  Motion handles the exit animation before unmount, so the always-mounted
  `invisible` + `tabIndex={-1}` workaround is deleted — a closed menu is simply
  not in the DOM, which is the cleaner a11y outcome.
- Motion spec (short and restrained — this is a donation site, per section 3;
  the animation should feel responsive, not showy):
  - Backdrop: opacity 0 → 1, 180ms tween.
  - Panel: opacity 0 → 1 and y -8 → 0, 200ms `easeOut`; exit reverses at 150ms.
  - Links: container `staggerChildren: 0.035`, each item opacity 0 → 1,
    y -4 → 0. Exit is not staggered (closing should feel instant).
  - Icon swap: `<AnimatePresence mode="wait">` on the Menu/X icons, rotate 90°
    + scale 0.8 → 1 over 150ms.
- **Reduced motion**: use `useReducedMotion()` and drop all positional/stagger
  movement to a plain opacity fade when it returns true. Replaces the
  `motion-reduce:transition-none` utility.
- Keep everything else from the overlay work unchanged: absolute panel, z-order
  (nav `z-20` > backdrop `z-10`), body scroll lock, Escape to close, backdrop
  click to close, close on link click, `md:hidden`.
- Not doing: page transitions, leaderboard row animations, or a shared
  `MotionConfig` provider. Out of scope for this request (section 14).

## Files expected to change
- `components/Nav.tsx`
- `package.json` / `package-lock.json` (add the direct dependency)

## Requirements
1. Menu still overlays — no layout shift of page content when opening.
2. Open and close both animate; exit completes before unmount.
3. Links stagger in on open.
4. Hamburger/close icon swap animates.
5. `prefers-reduced-motion` collapses movement to a fade.
6. Body scroll stays locked while open.
7. Escape, backdrop click, and link click all still close.
8. Desktop unchanged; hidden menu is absent from the DOM, so it cannot be tabbed.
9. `framer-motion` is a declared dependency, deduped to a single version.

## Security considerations
None. Presentational client component. No payment, webhook, ranking, Sanity
write, or env/token path is touched. Adding a dependency is the only supply-chain
consideration — it is an already-present, already-installed version, promoted to
a direct dep rather than newly pulled from the registry.

## Acceptance criteria
- At 360px, opening/closing the menu never moves page content.
- Closing visibly animates out rather than snapping.
- `npm ls framer-motion` shows a single deduped 13.2.0.
- Type check and lint clean; production build succeeds (adding a dependency and
  a client-runtime library warrants the build, per section 13).

## Checks to run
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (dependency added → build included this time)
- `npm ls framer-motion`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000` at 360px width.
2. Note the vertical position of the first leaderboard row.
3. Tap the hamburger — backdrop fades, panel slides down, links stagger in, icon
   rotates to X. Row does not move.
4. Try scrolling the dimmed page — must not scroll.
5. Tap the backdrop — panel animates out, then unmounts. Scrolling restored.
6. Reopen, press Escape — same exit animation.
7. Reopen, tap "Daily" — navigates with the menu closed.
8. Enable OS "reduce motion", reopen — fade only, no slide or stagger.
9. Resize to desktop — hamburger gone, inline links shown, no stray overlay.

## Implementation notes
- `framer-motion@^13.2.0` added to `package.json`; `npm ls framer-motion` shows
  the direct dep deduped with `@sanity/ui@4`'s copy. A separate `12.43.0` copy
  still hangs off `sanity@5.31.2` — pre-existing, Studio-side only, not in the
  web bundle path.
- Verified against `npm run build` + `next start`, not `next dev`: installing a
  dependency under an already-running dev server poisons its module graph and
  made `/` and `/today` return 500 in that stale process. A clean production
  build serves `/`, `/daily`, `/today`, `/categories` all 200. **The running dev
  server on :3000 needs a restart to pick up the new dependency.**
- Rendered HTML confirms the closed menu is absent from the DOM (0 occurrences
  of `id="mobile-menu"`) while the hamburger button is present.
