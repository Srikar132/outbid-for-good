import Link from "next/link";
import { notFound } from "next/navigation";

import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { getLeaderboardData } from "@/sanity/lib/data";
import { dayPageHref, groupEntriesByDay } from "@/lib/daily";
import { currentDayKey, formatDayKey, isValidDayKey } from "@/lib/format";
import { mockEntries, isMockLeaderboardEnabled } from "@/lib/mock-entries";
import { parsePageParam } from "@/lib/pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidDayKey(date)) return { title: "Daily board · OutBid for Good" };
  return {
    title: `${formatDayKey(date)} · OutBid for Good`,
    description: `The full ranking for ${formatDayKey(date)}.`,
  };
}

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { date } = await params;
  const { page } = await searchParams;

  // Reject a malformed key before touching Sanity — the segment is arbitrary
  // user input and would otherwise just render an empty board.
  if (!isValidDayKey(date)) notFound();

  const { categories, entries: liveEntries } = await getLeaderboardData();
  const entries = isMockLeaderboardEnabled() ? mockEntries(categories) : liveEntries;

  const day = groupEntriesByDay(entries).find((d) => d.dateKey === date);
  if (!day) notFound();

  const isLive = date === currentDayKey();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 pt-6 sm:px-8">
      <div className="flex flex-col gap-1">
        <p className="text-small flex flex-wrap items-center gap-1 text-neutral-500">
          <Link href="/daily" className="font-medium hover:text-accent-500">
            Daily
          </Link>
          <span aria-hidden="true">&middot;</span>
          <span>{formatDayKey(date)}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-display text-neutral-900">{formatDayKey(date)}</h1>
          {isLive && (
            <span className="text-small flex shrink-0 items-center gap-1 rounded-full bg-accent-500 px-2.5 py-0.5 font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Live
            </span>
          )}
        </div>

        <p className="text-body mt-1 max-w-2xl text-neutral-500">
          {isLive
            ? "Live ranking for this day. It stays open until midnight IST."
            : "Final ranking for this day. Rank is what people spent between midnight and midnight."}
        </p>
      </div>

      {/* Ranks here are positions within this day, so the paging offset is the
          right source — no rankById, unlike the searchable main board. */}
      <LeaderboardList
        entries={day.entries}
        page={parsePageParam(page)}
        hrefFor={(p) => dayPageHref(date, p)}
      />
    </main>
  );
}
