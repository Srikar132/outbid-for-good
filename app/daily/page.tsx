import { DailyBoard } from "@/components/leaderboard/DailyBoard";
import { getLeaderboardData, LeaderboardEntryResult } from "@/sanity/lib/data";
import { utcDateKey } from "@/lib/format";

export default async function DailyPage() {
  const { entries } = await getLeaderboardData();

  const groups = new Map<string, LeaderboardEntryResult[]>();
  for (const entry of entries) {
    const key = utcDateKey(entry.confirmedAt);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }

  const todayKey = utcDateKey(new Date().toISOString());
  const days = Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 sm:px-8">
      <div className="pt-6">
        <h1 className="text-h2 text-neutral-900">Daily</h1>
        <p className="text-body mt-1 text-neutral-500">
          Each UTC day gets its own board. Rank is what was confirmed that day. Today
          stays live until midnight UTC, then the day closes.
        </p>
      </div>

      {days.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
          <p className="text-body text-neutral-500">No confirmed donations yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {days.map(([dateKey, dayEntries]) => (
            <DailyBoard
              key={dateKey}
              dateKey={dateKey}
              isLive={dateKey === todayKey}
              entries={dayEntries}
            />
          ))}
        </div>
      )}
    </main>
  );
}
