# Mobile Responsive Leaderboard Entries Layout

## 1. Goal
Make the leaderboard entry rows in `LeaderboardList.tsx` fully mobile-responsive across all screen sizes (down to 320px mobile viewports), preventing layout clipping, awkward text wrapping, and amount truncation on mobile devices.

## 2. Code Inspected & Mobile Bottlenecks
- **File Inspected**: `components/leaderboard/LeaderboardList.tsx`
- **Current Issues on Mobile (< 640px)**:
  - Fixed horizontal flex layout (`w-8` rank + `w-14` logo + `pl-2` amount + gaps) leaves only ~120px-140px for donor name, tagline, and metadata.
  - Long company names, URLs, or taglines wrap onto multiple lines or crowd out the amount display.
  - Metadata pills (`category`, `timeAgo`, `clicks`, `displayUrl`, `see details`) are cramped in multi-line inline wraps with large bullet separators.

## 3. Proposed Responsive Redesign
- **Mobile-First Layout (< sm / < 640px)**:
  - Use a responsive flex structure:
    - Left section: Rank badge (`#1`) + compact avatar/logo (`h-11 w-11 sm:h-14 sm:w-14`).
    - Center section: Name (truncated if long), tagline (1-line clamp), and structured metadata.
    - Right section: Amount display (`text-lg font-extrabold sm:text-h2`), top-aligned or right-aligned.
- **Metadata Refinement on Mobile**:
  - Compact text size (`text-xs sm:text-small`) for metadata.
  - Display category title, time, click count, and `see details` cleanly formatted.
  - Truncate long URLs gracefully (`max-w-[120px] sm:max-w-none truncate inline-block`).
  - Ensure zero horizontal scrollbars or element overflow on mobile devices (Instagram in-app browser friendly).

## 4. Target Files
- `components/leaderboard/LeaderboardList.tsx`

## 5. Security & Boundary Considerations
- Preserves `/api/click/[id]` server redirect link on logo, name, and URL.
- Preserves `/entry/[slug]` detail page link.
- Read-only display change; no API or Sanity query modifications.

## 6. Verification & Test Plan
- Run `npx tsc --noEmit` to verify type safety.
- Run `npm run build` to verify production build compile.
- Test responsive viewports (320px, 375px, 414px, 768px, 1024px) in dev server.
