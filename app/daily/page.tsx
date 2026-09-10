import { DayCard } from "@/components/leaderboard/DayCard";
import { Pagination } from "@/components/leaderboard/Pagination";
import { getLeaderboardData } from "@/sanity/lib/data";
import { dailyPageHref, groupEntriesByDay } from "@/lib/daily";
import { formatDayKey } from "@/lib/format";
import { mockEntries, isMockLeaderboardEnabled } from "@/lib/mock-entries";
import { DAYS_PAGE_SIZE, paginate, parsePageParam } from "@/lib/pagination";

export const metadata = {
  title: "Daily boards · OutBid for Good",
  description: "Every day gets its own ranking. Today is still open to claim.",
};

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const { categories, entries: liveEntries } = await getLeaderboardData();
  const entries = isMockLeaderboardEnabled() ? mockEntries(categories) : liveEntries;

  const days = groupEntriesByDay(entries);

  // "Since" is the oldest day actually rendered, not the cycle's start date.
  // Only days with confirmed donations get a board, so a cycle that opened on
  // 1 July with its first donation on 4 September has no July or August cards
  // — claiming "each day since 1 July" would contradict the list below it.
  // Days are newest-first, so the last one is the oldest.
  const sinceKey = days.length > 0 ? days[days.length - 1].dateKey : null;

  // The live day always sits at the top and is never paged away — it is the
  // only board still winnable. Paging applies to the settled days below it.
  const pageData = paginate(days, parsePageParam(page), DAYS_PAGE_SIZE);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 pt-6 sm:px-8">
      <div>
        <h1 className="text-display text-neutral-900">Daily</h1>
        <p className="text-body mt-2 max-w-2xl text-neutral-500">
          {sinceKey
            ? `Each day since ${formatDayKey(sinceKey)} gets its own board. Rank is what you spent that day. Today stays live until midnight IST, then the day closes.`
            : "Each day gets its own board. Rank is what you spent that day. Today stays live until midnight IST, then the day closes."}
        </p>
      </div>

      {days.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
          <p className="text-body text-neutral-500">No confirmed donations yet.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {pageData.items.map((day) => (
              <DayCard
                key={day.dateKey}
                dateKey={day.dateKey}
                entries={day.entries}
                isLive={day.isLive}
              />
            ))}
          </div>

          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            total={pageData.total}
            rangeStart={pageData.rangeStart}
            rangeEnd={pageData.rangeEnd}
            hrefFor={dailyPageHref}
            unit="days"
          />
        </>
      )}
    </main>
  );
}
