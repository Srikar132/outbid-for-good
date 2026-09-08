# Fix HTML Nesting Hydration Error in LeaderboardList

## 1. Goal
Fix the React hydration error caused by invalid HTML tag nesting (`<a> cannot be a descendant of <a>`) in `LeaderboardList.tsx`.

## 2. Code Inspected & Cause
- **File Inspected**: `components/leaderboard/LeaderboardList.tsx`
- **Root Cause**: An outer `<a>` tag (`href="/api/click/${entry._id}"`) wrapped the entire entry row content, while a nested `<Link>` component (`href="/entry/${entry.slug}"`) was rendered inside it. In HTML specifications, `<a>` tags cannot contain another `<a>` tag. Browser DOM parsers auto-correct this invalid markup during hydration, causing React SSR hydration mismatch errors.

## 3. Proposed Solution
- Replace the outer wrapping `<a>` tag with a standard `<div>` container.
- Attach the `/api/click/${entry._id}` redirect link explicitly to the entry logo, entry name, and display URL elements.
- Keep the `see details` `<Link>` as a separate `<Link href={`/entry/${entry.slug}`}>` tag alongside the entry info.
- Replace any `<p>` tag wrapping nested `<p>` or `<div>` elements with `<div>` elements to guarantee valid HTML tag hierarchy.

## 4. Target Files
- `components/leaderboard/LeaderboardList.tsx`

## 5. Security & Boundary Considerations
- Preserves the click redirect functionality (`/api/click/[id]`) for logo, name, and URL clicks.
- Preserves the entry details link (`/entry/[slug]`).
- No API contract or payment logic modified.

## 6. Verification Plan
- `npx tsc --noEmit` to verify type safety.
- `npm run build` to verify production build.
- Browser test on `http://localhost:3000` to confirm hydration error is resolved.
