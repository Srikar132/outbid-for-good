# Outbid.lol Leaderboard Card Layout Redesign

## 1. Goal
Replicate the exact card layout from outbid.lol (as shown in the reference screenshot) for `LeaderboardList.tsx`.

## 2. Visual Analysis of Reference Design
- **Card Container**: Rounded pill-card (`rounded-3xl` / `rounded-[28px]`) with soft warm background (`#FDF5EF` tint per rank), padding `p-4 sm:p-5`.
- **Left Column**: Square rounded avatar/logo (`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex-shrink-0`).
- **Right Column (Flex-1)**:
  - **Header Row**: `#1` (accent orange bold text) + Name (`font-bold text-neutral-900`, truncated) on left; Amount (`font-bold text-accent-500`, right-aligned) on right.
  - **Tagline Row**: Muted description text (`text-neutral-500 text-sm line-clamp-1 mt-0.5`).
  - **Meta Row 1**: Category Icon + Category title (semi-bold dark text) + `&bull;` + time ago (`timeAgo`) + `&bull;` + display URL.
  - **Meta Row 2**: Click count (`X clicks`) + `&bull;` + `see details` link.

## 3. Proposed Structural Changes in `LeaderboardList.tsx`
```tsx
<li className="group relative flex items-start gap-4 rounded-3xl p-4 sm:p-5 transition-all hover:shadow-xs ...">
  {/* Logo on the left */}
  <a href={`/api/click/${entry._id}`} className="shrink-0">
    <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl shadow-2xs ...">
      {CategoryIcon ? <CategoryIcon size={28} /> : <span>{name.charAt(0)}</span>}
    </div>
  </a>

  {/* Content on the right */}
  <div className="min-w-0 flex-1 flex flex-col justify-center">
    {/* Header line: #1 Name ... Amount */}
    <div className="flex items-baseline justify-between gap-2">
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-body-lg sm:text-h3 font-extrabold text-accent-500 shrink-0">
          #{index + 1}
        </span>
        <a href={`/api/click/${entry._id}`} className="text-body-lg font-bold text-neutral-900 truncate">
          {name}
        </a>
      </div>
      <span className="text-body-lg sm:text-h3 font-extrabold text-accent-500 shrink-0 tabular-nums">
        {formatAmount(entry.amount)}
      </span>
    </div>

    {/* Tagline */}
    {entry.tagline && (
      <p className="text-body-sm text-neutral-500 mt-0.5 line-clamp-1">{entry.tagline}</p>
    )}

    {/* Meta info */}
    <div className="mt-1.5 text-xs sm:text-small text-neutral-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className="font-semibold text-neutral-800 flex items-center gap-1">
        {CategoryIcon && <CategoryIcon size={13} />}
        {entry.category.title}
      </span>
      <span>&bull;</span>
      <span>{timeAgo(entry.confirmedAt)}</span>
      {displayUrl && (
        <>
          <span>&bull;</span>
          <a href={`/api/click/${entry._id}`} className="hover:underline">{displayUrl}</a>
        </>
      )}
    </div>

    <div className="mt-0.5 text-xs sm:text-small text-neutral-500 flex items-center gap-1.5">
      <span>{entry.clickCount?.toLocaleString() ?? 0} clicks</span>
      <span>&bull;</span>
      <Link href={`/entry/${entry.slug}`} className="underline hover:text-accent-500">
        see details
      </Link>
    </div>
  </div>
</li>
```

## 4. Target Files
- `components/leaderboard/LeaderboardList.tsx`

## 5. Security & Boundary Considerations
- Maintains `/api/click/[id]` click tracking.
- Maintains `/entry/[slug]` detail page navigation.
- Preserves server/client data boundaries.

## 6. Verification Plan
- Run `npx tsc --noEmit` to verify type safety.
- Run `npm run build` to verify production build.
- Compare rendered card layout with reference screenshot.
