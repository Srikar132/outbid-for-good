import Link from "next/link";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount, timeAgo } from "@/lib/format";
import { categoryIcons } from "@/lib/category-icons";

const logoTint: Record<string, string> = {
  individual: "bg-primary-100 text-primary-500",
  company: "bg-info/10 text-info",
  brand: "bg-accent-100 text-accent-500",
};

const getRankBg = (index: number) => {
  if (index === 0) return "bg-[#F7EBE3] dark:bg-[#28211C]";
  if (index === 1) return "bg-[#F9F0EA] dark:bg-[#231E1B]";
  return "bg-[#FAF5F0] dark:bg-[#1E1B19]";
};

export function LeaderboardList({ entries }: { entries: LeaderboardEntryResult[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
        <p className="text-body text-neutral-500">
          No confirmed donations in this view yet.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry, index) => {
        const CategoryIcon = categoryIcons[entry.category.slug];
        const name = entry.companyName ?? entry.displayName;
        const displayUrl = entry.url
          ? entry.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
          : null;

        return (
          <li
            key={entry._id}
            className={`group relative flex items-center gap-3.5 rounded-3xl p-4 sm:p-5 transition-all hover:shadow-xs ${getRankBg(
              index
            )}`}
          >
            <span className="text-h3 w-8 shrink-0 text-center font-extrabold tabular-nums text-accent-500">
              #{index + 1}
            </span>

            <div className="flex min-w-0 flex-1 items-center gap-4">
              <a
                href={`/api/click/${entry._id}`}
                className="flex shrink-0 items-center justify-center"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xs ${
                    logoTint[entry.category.slug] ?? "bg-neutral-900 text-white"
                  }`}
                >
                  {CategoryIcon ? (
                    <CategoryIcon size={24} />
                  ) : (
                    <span className="text-h3 font-bold">{name.charAt(0)}</span>
                  )}
                </div>
              </a>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <a
                    href={`/api/click/${entry._id}`}
                    className="text-body-lg font-bold text-neutral-900 transition-colors hover:text-accent-500 group-hover:text-accent-500"
                  >
                    {name}
                  </a>
                </div>
                {entry.tagline && (
                  <p className="text-body mt-0.5 line-clamp-1 text-neutral-700">{entry.tagline}</p>
                )}
                <div className="text-small mt-1.5 flex flex-wrap items-center gap-2 text-neutral-500">
                  {CategoryIcon && <CategoryIcon size={12} className="text-neutral-500" />}
                  <span>{entry.category.title}</span>
                  <span>&bull;</span>
                  <span>{timeAgo(entry.confirmedAt)}</span>
                  {displayUrl && (
                    <>
                      <span>&bull;</span>
                      <a
                        href={`/api/click/${entry._id}`}
                        className="font-medium text-neutral-700 hover:text-accent-500"
                      >
                        {displayUrl}
                      </a>
                    </>
                  )}
                  <span>&bull;</span>
                  <span className="font-medium text-neutral-700">
                    {entry.clickCount?.toLocaleString() ?? 0} clicks
                  </span>
                  <span>&bull;</span>
                  <Link
                    href={`/entry/${entry.slug}`}
                    className="font-medium text-neutral-500 underline hover:text-accent-500"
                  >
                    see details
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 pl-2">
              <span className="text-h2 font-extrabold tabular-nums text-accent-500">
                {formatAmount(entry.amount)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
