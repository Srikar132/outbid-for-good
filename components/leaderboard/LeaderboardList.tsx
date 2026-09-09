import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { EntryHeroCard } from "./EntryHeroCard";
import { EntryRow } from "./EntryRow";
import { SectionDivider } from "./SectionDivider";
import { TodayStrip } from "./TodayStrip";

const HERO_COUNT = 3;
const MID_END = 10;
const TOP_MARK = 20;

const listClass = "flex flex-col divide-y divide-neutral-200 dark:divide-white/5";

export function LeaderboardList({
  items,
  startIndex,
  showSections,
  rankById,
  todayEntries,
}: {
  items: LeaderboardEntryResult[];
  /** Index of items[0] within the full filtered list — the paging offset. */
  startIndex: number;
  /** Page 1 of an unsearched board: podium, today strip, TOP 20 marker. */
  showSections: boolean;
  /** True board ranks, supplied while searching (see app/page.tsx). */
  rankById?: Map<string, number>;
  /** Last-24h entries for the strip. Only the home page passes this. */
  todayEntries?: LeaderboardEntryResult[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
        <p className="text-body text-neutral-500">
          No confirmed donations in this view yet.
        </p>
      </div>
    );
  }

  // One rank formula for every section. `i` is always an index into `items`,
  // so no section does arithmetic of its own and none of them can disagree.
  // While searching, position in the filtered array is not the donor's rank,
  // so rankById supplies the real one.
  const rankAt = (i: number) => rankById?.get(items[i]._id) ?? startIndex + i + 1;

  const rows = (from: number, to: number) =>
    items.slice(from, to).map((entry, i) => (
      <EntryRow key={entry._id} entry={entry} rank={rankAt(from + i)} />
    ));

  if (!showSections) {
    return <ol className={listClass}>{rows(0, items.length)}</ol>;
  }

  const heroes = items.slice(0, HERO_COUNT);
  const mid = items.slice(HERO_COUNT, MID_END);
  const upper = items.slice(MID_END, TOP_MARK);
  const rest = items.slice(TOP_MARK);

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-3">
        {heroes.map((entry, i) => (
          <EntryHeroCard key={entry._id} entry={entry} rank={rankAt(i)} />
        ))}
      </ol>

      {todayEntries && <TodayStrip entries={todayEntries} />}

      {mid.length > 0 && <ol className={listClass}>{rows(HERO_COUNT, MID_END)}</ol>}

      {upper.length > 0 && <ol className={listClass}>{rows(MID_END, TOP_MARK)}</ol>}

      {rest.length > 0 && (
        <>
          <SectionDivider label="TOP 20" />
          <ol className={listClass}>{rows(TOP_MARK, items.length)}</ol>
        </>
      )}
    </div>
  );
}
