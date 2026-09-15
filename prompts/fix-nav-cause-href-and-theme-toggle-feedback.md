# Fix "Our Cause" nav link and add theme button press feedback

## 1. Goal
Fix two small, contained header-nav defects found while chasing false-alarm scanner signals:
- The "Our Cause" link uses the bare fragment `#cause`, which has no target on `/daily`, `/categories`, `/about`, and `/rules`. On those routes the menu just closes and the page does not move.
- The theme toggle is a bare `setTheme` call with no press feedback, so a press that does not repaint at once looks ignored. It drew one dead click and one rage click in a session.

Neither defect touches the donation flow, payment, webhooks, or leaderboard ranking.

## 2. Code Inspected & Context
- **Files inspected**:
  - `components/Nav.tsx` (`LINKS` array, line 16)
  - `components/ThemeToggle.tsx`
  - `app/providers.tsx` (`next-themes` config; no `disableTransitionOnChange`)
  - `app/page.tsx:71`, `app/today/page.tsx:61`, `app/category/[slug]/page.tsx:75` — the only `id="cause"` targets
  - `package.json` (`framer-motion` ^13.2.0 already a dependency, used in `Nav.tsx`)
- **Root cause 1**: `id="cause"` exists only on the home, today, and category routes. A bare `#cause` href resolves to a same-page anchor, so on any other route there is no matching element and nothing scrolls.
- **Root cause 2**: The button gives no immediate visual feedback on press. Any lag before the theme class repaints reads as "the button did nothing".

## 3. Decisions & Implementation Details
- **Nav**: change the "Our Cause" href from `#cause` to `/#cause`. This navigates to the home page and then scrolls to the cause section from every route. The home `#cause` section already has `scroll-mt-20`.
- **ThemeToggle**: convert the `<button>` to a framer-motion `motion.button` with `whileTap={{ scale: 0.85 }}`, matching the framer-motion idiom already used in `Nav.tsx`. Respect `useReducedMotion` so a reduced-motion user gets no scale animation. Keep the existing CSS-driven Sun/Moon swap to avoid any hydration mismatch.
- Press feedback is immediate on pointer down, independent of theme repaint timing, which directly fixes the "looks ignored" symptom.

## 4. Target Files
- `components/Nav.tsx`
- `components/ThemeToggle.tsx`

## 5. Security & Boundary Considerations
- No impact on payment paths, Razorpay keys, Sanity write token, or any server route.
- Client-side UI only. The server/client boundary and the confirmed-payment-only rule are untouched.

## 6. Acceptance Criteria & Verification
- `npx tsc --noEmit` passes with zero errors.
- `npm run lint` passes.
- `npm run build` compiles successfully.
- "Our Cause" scrolls to the cause section from `/daily`, `/categories`, `/about`, and `/rules`.
- The theme button visibly reacts to every press.

## 7. Checks & Manual Test Steps
1. Run `npx tsc --noEmit`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Start `npm run dev`, open `/about`, open the mobile menu, click "Our Cause" — confirm it lands on the home cause section.
5. Press the theme button repeatedly — confirm each press shows a scale/press response and the theme flips.
