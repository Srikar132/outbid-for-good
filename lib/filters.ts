import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { isWithinLastDay } from "@/lib/format";

export function filterEntries(
  entries: LeaderboardEntryResult[],
  { categorySlug, today, q }: { categorySlug?: string; today?: boolean; q?: string }
) {
  const query = q?.trim().toLowerCase() ?? "";

  return entries
    .filter((e) => !categorySlug || e.category?.slug === categorySlug)
    .filter((e) => !today || isWithinLastDay(e.confirmedAt))
    .filter((e) => {
      if (!query) return true;
      const haystack = `${e.displayName} ${e.companyName ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
}

export function scopeTopAmount(filtered: LeaderboardEntryResult[]) {
  return filtered[0]?.amount ?? 0;
}
