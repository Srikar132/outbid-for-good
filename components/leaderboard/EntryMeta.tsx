import Link from "next/link";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { timeAgo } from "@/lib/format";
import { categoryIcons } from "@/lib/category-icons";

/**
 * The category • age • clicks • details footer line. Every child is either
 * shrink-0 or truncate so the row degrades by clipping the click count rather
 * than overflowing the page at 360px.
 */
export function EntryMeta({ entry }: { entry: LeaderboardEntryResult }) {
  const CategoryIcon = categoryIcons[entry.category.slug];

  return (
    <div className="text-small mt-1 flex items-center gap-1.5 overflow-hidden text-neutral-500">
      {CategoryIcon && <CategoryIcon size={11} className="shrink-0 text-neutral-500" />}
      <span className="shrink-0 whitespace-nowrap">{entry.category.title}</span>
      <span className="shrink-0">&bull;</span>
      <span className="shrink-0 whitespace-nowrap">{timeAgo(entry.confirmedAt)}</span>
      <span className="min-w-0 shrink truncate whitespace-nowrap">
        &bull; {entry.clickCount?.toLocaleString("en-IN") ?? 0} clicks &bull;{" "}
        <Link
          href={`/entry/${entry.slug}`}
          className="font-medium text-neutral-500 underline hover:text-accent-500"
        >
          details
        </Link>
      </span>
    </div>
  );
}
