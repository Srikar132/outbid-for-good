import Link from "next/link";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount, timeAgo } from "@/lib/format";
import { categoryIcons } from "@/lib/category-icons";

const logoTint: Record<string, string> = {
  individual: "bg-primary-100 text-primary-500",
  company: "bg-info/10 text-info",
  brand: "bg-accent-100 text-accent-500",
};

export function LeaderboardList({ entries }: { entries: LeaderboardEntryResult[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg bg-surface p-8 text-center shadow-sm">
        <p className="text-body text-neutral-500">
          No confirmed donations in this view yet.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {entries.map((entry, index) => {
        const CategoryIcon = categoryIcons[entry.category.slug];
        const isTop = index === 0;
        const name = entry.companyName ?? entry.displayName;
        return (
          <li
            key={entry._id}
            className={`flex items-center gap-2 rounded-lg border bg-surface p-3 transition-colors dark:ring-1 dark:ring-white/5 ${
              isTop ? "border-accent-500" : "border-neutral-200 hover:border-accent-300"
            }`}
          >
            <a
              href={`/api/click/${entry._id}`}
              className="flex min-w-0 flex-1 items-start gap-4 p-1"
            >
              <span
                className={`text-h3 w-8 shrink-0 pt-1 tabular-nums ${
                  isTop ? "text-accent-500" : "text-neutral-300"
                }`}
              >
                #{index + 1}
              </span>
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${logoTint[entry.category.slug] ?? "bg-neutral-100 text-neutral-500"}`}
              >
                {CategoryIcon && <CategoryIcon size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-lg truncate text-neutral-900">{name}</p>
                {entry.tagline && (
                  <p className="text-body mt-0.5 truncate text-neutral-500">{entry.tagline}</p>
                )}
                <p className="text-small mt-1 flex items-center gap-1.5 text-neutral-500">
                  {CategoryIcon && <CategoryIcon size={12} />}
                  <span>{entry.category.title}</span>
                  <span className="text-neutral-300">&bull;</span>
                  <span>{timeAgo(entry.confirmedAt)}</span>
                </p>
              </div>
            </a>

            <div className="flex shrink-0 flex-col items-end gap-1 pl-1">
              <span className="text-h3 tabular-nums text-accent-500">
                {formatAmount(entry.amount)}
              </span>
              <Link
                href={`/entry/${entry.slug}`}
                className="text-small font-semibold text-primary-500 hover:text-primary-400"
              >
                see details
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
