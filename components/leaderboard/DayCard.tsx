import Link from "next/link";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatDayKey } from "@/lib/format";
import { dailyDayHref } from "@/lib/daily";
import { EntryHeroCard } from "./EntryHeroCard";

/** Each day shows its podium; the rest of the day lives on the day's page. */
export const DAY_PREVIEW_COUNT = 3;

const buttonBase =
  "text-body flex h-11 w-full items-center justify-center rounded-full px-5 font-semibold transition-colors";

/**
 * One day, as a card: the date, how many claimed it, and that day's top three.
 *
 * The live day is tinted and offers a claim, because it is the only board
 * anyone can still win. Closed days are plain surfaces — settled history.
 *
 * Only three entries render here no matter how big the day was. Combined with
 * the day-level paging on /daily, that keeps the page a bounded size as days
 * accumulate; the full ranking is one tap away.
 */
export function DayCard({
  dateKey,
  entries,
  isLive,
}: {
  dateKey: string;
  entries: LeaderboardEntryResult[];
  isLive: boolean;
}) {
  const preview = entries.slice(0, DAY_PREVIEW_COUNT);
  const count = entries.length;
  const countLabel = `${count} ${count === 1 ? "listing" : "listings"}`;

  return (
    <section
      className={`rounded-2xl p-3 sm:p-5 ${
        isLive
          ? "bg-accent-50 ring-1 ring-accent-200"
          : "bg-surface shadow-sm dark:ring-1 dark:ring-white/5"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-h3 truncate text-neutral-900">{formatDayKey(dateKey)}</h2>
          {isLive && (
            <span className="text-small flex shrink-0 items-center gap-1 rounded-full bg-accent-500 px-2.5 py-0.5 font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Live
            </span>
          )}
        </div>
        <span className="text-small shrink-0 text-neutral-500">
          {isLive ? `Open · ${countLabel}` : countLabel}
        </span>
      </div>

      {isLive && (
        <p className="text-small mb-3 text-accent-500 dark:text-neutral-700">
          This day is still open for claims. It closes at midnight IST.
        </p>
      )}

      {count === 0 ? (
        <p className="text-body py-4 text-center text-neutral-500">
          No claims yet today — the top spot is open.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {preview.map((entry, index) => (
            <EntryHeroCard key={entry._id} entry={entry} rank={index + 1} />
          ))}
        </ol>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {isLive && (
          <Link href="/" className={`${buttonBase} bg-accent-500 text-white hover:bg-accent-400`}>
            Claim a rank
          </Link>
        )}
        {count > preview.length && (
          <Link
            href={dailyDayHref(dateKey)}
            className={`${buttonBase} bg-primary-500 text-white hover:bg-primary-400`}
          >
            Show all ranks
          </Link>
        )}
      </div>
    </section>
  );
}
