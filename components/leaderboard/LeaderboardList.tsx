import Link from "next/link";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount, getHostname, timeAgo } from "@/lib/format";
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
        return (
          <li
            key={entry._id}
            className={`flex items-start gap-4 rounded-lg p-4 transition-colors dark:ring-1 dark:ring-white/5 ${
              isTop ? "bg-accent-100" : "bg-accent-50 hover:bg-accent-100/60"
            }`}
          >
            <span
              className={`text-h3 w-8 shrink-0 pt-1 ${
                isTop ? "text-accent-500" : "text-neutral-300"
              }`}
            >
              #{index + 1}
            </span>
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${logoTint[entry.category.slug] ?? "bg-surface text-neutral-500"}`}
            >
              {CategoryIcon && <CategoryIcon size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <a
                href={`/api/click/${entry._id}`}
                className="text-body-lg block truncate text-neutral-900 hover:text-primary-500"
              >
                {entry.companyName ?? entry.displayName}
              </a>
              <p className="text-body mt-0.5 truncate text-neutral-500">
                {entry.tagline}
              </p>
              <p className="text-small mt-1 flex flex-wrap items-center gap-x-1.5 text-neutral-500">
                {CategoryIcon && <CategoryIcon size={12} />}
                <span>{entry.category.title}</span>
                <span>&middot;</span>
                <span>{timeAgo(entry.confirmedAt)}</span>
                <span>&middot;</span>
                <span>{getHostname(entry.url)}</span>
                <span>&middot;</span>
                <span>{entry.clickCount ?? 0} clicks</span>
                <span>&middot;</span>
                <Link href={`/entry/${entry.slug}`} className="font-semibold text-primary-500">
                  see details
                </Link>
              </p>
            </div>
            <span className="text-h3 shrink-0 pt-1 text-accent-500">
              {formatAmount(entry.amount)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
