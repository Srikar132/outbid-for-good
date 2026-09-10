import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount } from "@/lib/format";
import { EntryAvatar } from "./EntryAvatar";
import { EntryMeta } from "./EntryMeta";

/**
 * Compact row for rank 4 and below. Carries no background of its own — the
 * hairline separator comes from `divide-y` on the parent <ol>, which is both
 * lighter DOM than 50 rounded cards and what gives the list its table-like
 * read below the podium.
 *
 * The rank column is w-9: it has to hold "#100" on a 360px screen.
 */
export function EntryRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntryResult;
  rank: number;
}) {
  const name = entry.companyName ?? entry.displayName;

  return (
    <li className="group relative flex items-start gap-2.5 py-3 transition-colors sm:gap-3 sm:py-3.5">
      <span className="text-body-lg w-10 shrink-0 pt-0.5 text-center font-extrabold tabular-nums text-accent-500 dark:text-neutral-900">
        #{rank}
      </span>

      <a href={`/api/click/${entry._id}`} className="shrink-0" aria-label={`Visit ${name}`}>
        <EntryAvatar entry={entry} size="md" />
      </a>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <a
            href={`/api/click/${entry._id}`}
            className="text-body-lg truncate font-bold text-neutral-900 transition-colors hover:text-accent-500 group-hover:text-accent-500"
          >
            {name}
          </a>
          <span className="text-body-lg shrink-0 font-extrabold tabular-nums text-accent-500 dark:text-neutral-900">
            {formatAmount(entry.amount)}
          </span>
        </div>
        {entry.tagline && (
          <p className="text-small mt-0.5 line-clamp-1 text-neutral-700">{entry.tagline}</p>
        )}
        <EntryMeta entry={entry} />
      </div>
    </li>
  );
}
