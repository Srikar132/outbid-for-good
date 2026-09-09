import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount } from "@/lib/format";
import { EntryAvatar } from "./EntryAvatar";

const STRIP_SIZE = 3;

/**
 * One card in the strip. Deliberately thinner than EntryRow — no category, no
 * timestamp, no click count, no details link — so the whole card can be a
 * single anchor. Nesting a <Link> inside it would produce <a> inside <a>,
 * the hydration bug already fixed once in this repo
 * (prompts/fix-leaderboard-list-hydration-nesting.md).
 */
function TodayStripCard({
  entry,
  rank,
}: {
  entry: LeaderboardEntryResult;
  rank: number;
}) {
  const name = entry.companyName ?? entry.displayName;

  return (
    <li className="w-[72%] shrink-0 snap-start sm:w-auto">
      <a
        href={`/api/click/${entry._id}`}
        className="group flex h-full items-center gap-2.5 rounded-2xl bg-[#FAF5F0] p-3 transition-all hover:shadow-xs dark:bg-[#1E1B19]"
      >
        <span className="text-small w-6 shrink-0 text-center font-extrabold tabular-nums text-accent-500">
          #{rank}
        </span>

        <EntryAvatar entry={entry} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-body truncate font-bold text-neutral-900 transition-colors group-hover:text-accent-500">
              {name}
            </span>
            <span className="text-body shrink-0 font-extrabold tabular-nums text-accent-500">
              {formatAmount(entry.amount)}
            </span>
          </div>
          {entry.tagline && (
            <p className="text-small mt-0.5 line-clamp-1 text-neutral-500">{entry.tagline}</p>
          )}
        </div>
      </a>
    </li>
  );
}

/**
 * "Today's top ranking" — the last 24 hours ranked by amount, a separate list
 * from the all-time podium above it. A donor can appear in both, in one, or in
 * neither; ranks here are positions within today only.
 *
 * Takes the full today-filtered list and slices it itself, so the heading and
 * the count it describes stay in one place.
 */
export function TodayStrip({ entries }: { entries: LeaderboardEntryResult[] }) {
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="today-strip-heading" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="today-strip-heading"
          className="text-body-lg flex items-center gap-2 font-bold text-neutral-900"
        >
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-accent-500" />
          Today&apos;s top ranking
        </h2>
        <Link
          href="/today"
          className="text-small flex shrink-0 items-center gap-0.5 font-medium text-accent-500 hover:underline"
        >
          See all
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Mobile: edge-to-edge snap scroll, cards at 72% so a sliver of the
          next one signals there is more. Desktop: a plain 3-up grid. */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
        {entries.slice(0, STRIP_SIZE).map((entry, index) => (
          <TodayStripCard key={entry._id} entry={entry} rank={index + 1} />
        ))}
      </ul>
    </section>
  );
}
