import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatUtcDate } from "@/lib/format";
import { LeaderboardList } from "./LeaderboardList";

export function DailyBoard({
  dateKey,
  isLive,
  entries,
}: {
  dateKey: string;
  isLive: boolean;
  entries: LeaderboardEntryResult[];
}) {
  return (
    <section
      className={`rounded-2xl p-4 sm:p-5 ${
        isLive
          ? "bg-accent-50 ring-1 ring-accent-200"
          : "bg-surface shadow-sm dark:ring-1 dark:ring-white/5"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-h3 text-neutral-900">{formatUtcDate(dateKey)}</h2>
          {isLive && (
            <span className="text-small flex items-center gap-1 rounded-full bg-accent-500 px-2.5 py-0.5 font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Live
            </span>
          )}
        </div>
        <span className="text-small text-neutral-500">
          {entries.length} {entries.length === 1 ? "listing" : "listings"}
        </span>
      </div>

      {isLive && (
        <p className="text-small mb-3 text-accent-500">
          This day is still open for claims. It closes at midnight UTC.
        </p>
      )}

      <LeaderboardList entries={entries} />
    </section>
  );
}
