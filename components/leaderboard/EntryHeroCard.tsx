import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount } from "@/lib/format";
import { EntryAvatar } from "./EntryAvatar";
import { EntryMeta } from "./EntryMeta";

// Three tints for the podium, warmest at #1. Ranks 4+ get no tint at all —
// the drop to a plain divided row is what makes the top three read as a
// podium rather than just the first three items.
const heroTint = [
  "bg-[#F7EBE3] dark:bg-[#28211C]",
  "bg-[#F9F0EA] dark:bg-[#231E1B]",
  "bg-[#FAF5F0] dark:bg-[#1E1B19]",
];

/**
 * Full-width tinted card for ranks 1-3. Stacked at every breakpoint rather
 * than a three-column podium: #1 has to dominate, not share a row.
 */
export function EntryHeroCard({
  entry,
  rank,
}: {
  entry: LeaderboardEntryResult;
  rank: number;
}) {
  const name = entry.companyName ?? entry.displayName;
  const tint = heroTint[rank - 1] ?? heroTint[heroTint.length - 1];

  return (
    <li
      className={`group relative flex items-start gap-3 rounded-2xl p-4 transition-all hover:shadow-xs sm:gap-4 sm:p-5 ${tint}`}
    >
      <span className="text-body-lg w-7 shrink-0 pt-1 text-center font-extrabold tabular-nums text-accent-500 sm:w-8">
        #{rank}
      </span>

      <a href={`/api/click/${entry._id}`} className="shrink-0" aria-label={`Visit ${name}`}>
        <EntryAvatar entry={entry} size="lg" />
      </a>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <a
            href={`/api/click/${entry._id}`}
            className="text-body-lg truncate font-bold text-neutral-900 transition-colors hover:text-accent-500 group-hover:text-accent-500"
          >
            {name}
          </a>
          <span className="text-h3 shrink-0 font-extrabold tabular-nums text-accent-500">
            {formatAmount(entry.amount)}
          </span>
        </div>
        {entry.tagline && (
          <p className="text-body mt-0.5 line-clamp-1 text-neutral-700">{entry.tagline}</p>
        )}
        <EntryMeta entry={entry} />
      </div>
    </li>
  );
}
