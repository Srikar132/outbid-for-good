import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { currentDayKey, dayKey } from "@/lib/format";

export type DayGroup = {
  /** "2026-09-10" — an IST calendar day. */
  dateKey: string;
  /** That day's confirmed entries, amount-descending. */
  entries: LeaderboardEntryResult[];
  /** The day still in progress: rank can still change. */
  isLive: boolean;
};

/**
 * Buckets confirmed entries into IST calendar days, newest day first.
 *
 * Entries arrive amount-descending from GROQ and bucketing preserves that
 * order, so entries[0] of any day is that day's winner without re-sorting.
 */
export function groupEntriesByDay(entries: LeaderboardEntryResult[]): DayGroup[] {
  const today = currentDayKey();
  const buckets = new Map<string, LeaderboardEntryResult[]>();

  for (const entry of entries) {
    const key = dayKey(entry.confirmedAt);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      buckets.set(key, [entry]);
    }
  }

  return Array.from(buckets, ([dateKey, dayEntries]) => ({
    dateKey,
    entries: dayEntries,
    isLive: dateKey === today,
  })).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

export function dailyDayHref(dateKey: string) {
  return `/daily/${dateKey}`;
}

export function dailyPageHref(page: number) {
  return page > 1 ? `/daily?page=${page}` : "/daily";
}

export function dayPageHref(dateKey: string, page: number) {
  return page > 1 ? `/daily/${dateKey}?page=${page}` : `/daily/${dateKey}`;
}
