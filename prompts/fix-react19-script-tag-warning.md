# Fix React 19 Script Tag Warning in ThemeProvider

## 1. Goal
Resolve the React 19 runtime warning emitted by `next-themes` in `app/providers.tsx`:
`Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client.`

## 2. Code Inspected & Context
- **Files Inspected**:
  - `app/providers.tsx`
  - `app/layout.tsx`
  - `package.json` (React 19.2.8, Next.js 16.3.4, `next-themes` 0.4.6)
- **Root Cause**: React 19 enforces strict rules for inline `<script>` tags inside JSX components during client rendering. When `next-themes` injects its inline theme script to prevent theme flash, React 19 emits a warning unless the script tag specifies an explicit `async` attribute or hydration suppression.

## 3. Decisions & Implementation Details
- Pass `scriptProps={{ async: true }}` to `<ThemeProvider>` in `app/providers.tsx`.
- This informs React 19 that the script tag rendered by `next-themes` is an async script tag, satisfying React 19's JSX script tag rules without breaking theme detection or causing dark/light mode hydration flash.

## 4. Target Files
- `app/providers.tsx`

## 5. Security & Boundary Considerations
- No impact on payment paths, API keys, Sanity tokens, or server routes.
- Fully client-side UI provider fix.

## 6. Acceptance Criteria & Verification
- `npx tsc --noEmit` passes with zero errors.
- `npm run build` compiles successfully.
- React 19 console warning about script tags in `Providers` is resolved.

## 7. Checks & Manual Test Steps
1. Run `npx tsc --noEmit` to verify type safety.
2. Run `npm run build` to verify production build.
3. Open `http://localhost:3000` in browser and confirm zero script tag warnings in console.
