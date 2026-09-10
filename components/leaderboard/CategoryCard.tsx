import Link from "next/link";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount } from "@/lib/format";
import { categoryIcons, defaultCategoryIcon } from "@/lib/category-icons";
import { EntryAvatar } from "./EntryAvatar";

/**
 * A category's podium. Each of the top three sits on its own tinted row so the
 * card reads as a miniature leaderboard rather than a bulleted list — the same
 * shape a visitor already knows from the main board.
 */
export function CategoryCard({
  slug,
  title,
  topEntries,
  total,
}: {
  slug: string;
  title: string;
  topEntries: LeaderboardEntryResult[];
  total: number;
}) {
  const Icon = categoryIcons[slug] ?? defaultCategoryIcon;

  return (
    <Link
      href={`/category/${slug}`}
      className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 dark:ring-1 dark:ring-white/5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-500">
          <Icon size={18} />
        </span>
        <h3 className="text-body-lg truncate font-bold text-neutral-900">{title}</h3>
      </div>

      {topEntries.length === 0 ? (
        <p className="text-small py-2 text-neutral-500">No claims yet — be the first.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {topEntries.map((entry, index) => {
            const name = entry.companyName ?? entry.displayName;
            return (
              <li
                key={entry._id}
                className="flex min-w-0 items-center gap-2 rounded-lg bg-accent-50 px-2.5 py-2"
              >
                <span className="text-small w-6 shrink-0 font-bold tabular-nums text-neutral-500">
                  #{index + 1}
                </span>
                <EntryAvatar entry={entry} size="xs" />
                <span className="text-small min-w-0 flex-1 truncate font-medium text-neutral-900">
                  {name}
                </span>
                <span className="text-small shrink-0 font-bold tabular-nums text-accent-500 dark:text-neutral-900">
                  {formatAmount(entry.amount)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-small mt-auto border-t border-neutral-100 pt-3 text-neutral-500 dark:border-white/5">
        {total} {total === 1 ? "confirmed donor" : "confirmed donors"} &middot; See full ranking
      </p>
    </Link>
  );
}
