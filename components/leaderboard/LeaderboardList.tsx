import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { pageHref, Scope } from "@/lib/scope";
import { paginate } from "@/lib/pagination";
import { EntryHeroCard } from "./EntryHeroCard";
import { EntryRow } from "./EntryRow";
import { Pagination } from "./Pagination";
import { SectionDivider } from "./SectionDivider";
import { TodayStrip } from "./TodayStrip";

const HERO_COUNT = 3;
const MID_END = 10;
const TOP_MARK = 20;

const listClass = "flex flex-col divide-y divide-neutral-200 dark:divide-white/5";

/**
 * Owns paging and sectioning so the pages stay a flat compose of
 * CategoryTabs + ClaimBand + LeaderboardList — there is deliberately no
 * wrapper component between them.
 */
export function LeaderboardList({
  entries,
  page,
  scope,
  q,
  hrefFor,
  rankById,
  todayEntries,
  todayHref,
}: {
  /** The full scope-filtered list. Paging is applied here, not by the caller. */
  entries: LeaderboardEntryResult[];
  /**
   * Omit for a plain flat list — no paging, no sections, no pagination
   * control — used where the caller has already bounded the list itself.
   */
  page?: number;
  scope?: Scope;
  q?: string;
  /**
   * Overrides how page links are built. Defaults to the scope-aware
   * leaderboard URL; the daily day pages pass their own so paging stays on
   * /daily/[date] instead of jumping to the main board.
   */
  hrefFor?: (page: number) => string;
  /** True board ranks, supplied while searching (see app/page.tsx). */
  rankById?: Map<string, number>;
  /** Last-24h entries for the strip after rank #3. */
  todayEntries?: LeaderboardEntryResult[];
  /** Scoped "see all" target for that strip. */
  todayHref?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
        <p className="text-body text-neutral-500">
          No confirmed donations in this view yet.
        </p>
      </div>
    );
  }

  const paged = page !== undefined;
  const pageData = paginate(entries, page ?? 1);
  const items = paged ? pageData.items : entries;
  const startIndex = paged ? pageData.startIndex : 0;

  // Search results are a filtered subset, so their first three are not the
  // board's top three — promoting them to podium cards would misrepresent
  // them. Flat rows with true ranks is the honest rendering.
  const showSections = paged && pageData.page === 1 && !q?.trim();

  // One rank formula for every section. `i` is always an index into `items`,
  // so no section does arithmetic of its own and none of them can disagree.
  const rankAt = (i: number) => rankById?.get(items[i]._id) ?? startIndex + i + 1;

  const rows = (from: number, to: number) =>
    items.slice(from, to).map((entry, i) => (
      <EntryRow key={entry._id} entry={entry} rank={rankAt(from + i)} />
    ));

  const pagination = paged ? (
    <Pagination
      page={pageData.page}
      totalPages={pageData.totalPages}
      total={pageData.total}
      rangeStart={pageData.rangeStart}
      rangeEnd={pageData.rangeEnd}
      hrefFor={hrefFor ?? ((p) => pageHref(p, scope ?? {}, q))}
    />
  ) : null;

  if (!showSections) {
    return (
      <div className="flex flex-col gap-4">
        <ol className={listClass}>{rows(0, items.length)}</ol>
        {pagination}
      </div>
    );
  }

  const mid = items.slice(HERO_COUNT, MID_END);
  const upper = items.slice(MID_END, TOP_MARK);
  const rest = items.slice(TOP_MARK);

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-3">
        {items.slice(0, HERO_COUNT).map((entry, i) => (
          <EntryHeroCard key={entry._id} entry={entry} rank={rankAt(i)} />
        ))}
      </ol>

      {todayEntries && <TodayStrip entries={todayEntries} href={todayHref} />}

      {mid.length > 0 && <ol className={listClass}>{rows(HERO_COUNT, MID_END)}</ol>}

      {upper.length > 0 && <ol className={listClass}>{rows(MID_END, TOP_MARK)}</ol>}

      {rest.length > 0 && (
        <>
          <SectionDivider label="TOP 20" />
          <ol className={listClass}>{rows(TOP_MARK, items.length)}</ol>
        </>
      )}

      {pagination}
    </div>
  );
}
