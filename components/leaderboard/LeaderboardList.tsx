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
            className={`group relative flex items-start gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 transition-all hover:shadow-xs ${getRankBg(
              index
            )}`}
          >
            <a
              href={`/api/click/${entry._id}`}
              className="flex shrink-0 items-center justify-center pt-0.5"
            >
              <div
                className={`flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl shadow-2xs ${
                  logoTint[entry.category.slug] ?? "bg-neutral-900 text-white"
                }`}
              >
                {CategoryIcon ? (
                  <CategoryIcon size={22} className="sm:hidden" />
                ) : null}
                {CategoryIcon ? (
                  <CategoryIcon size={28} className="hidden sm:block" />
                ) : (
                  <span className="text-h3 font-bold">{name.charAt(0)}</span>
                )}
              </div>
            </a>

            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-body-lg sm:text-h3 font-extrabold text-accent-500 shrink-0">
                    #{index + 1}
                  </span>
                  <a
                    href={`/api/click/${entry._id}`}
                    className="text-body sm:text-body-lg font-bold text-neutral-900 transition-colors hover:text-accent-500 group-hover:text-accent-500 truncate"
                  >
                    {name}
                  </a>
                </div>
                <span className="text-body-lg sm:text-h2 font-extrabold tabular-nums text-accent-500 shrink-0">
                  {formatAmount(entry.amount)}
                </span>
              </div>

              {entry.tagline && (
                <p className="text-xs sm:text-body text-neutral-500 mt-0.5 line-clamp-1">
                  {entry.tagline}
                </p>
              )}

              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs sm:text-small text-neutral-500">
                <span className="font-semibold text-neutral-800 flex items-center gap-1">
                  {CategoryIcon && <CategoryIcon size={13} className="text-neutral-500" />}
                  {entry.category.title}
                </span>
                <span>&bull;</span>
                <span>{timeAgo(entry.confirmedAt)}</span>
                {displayUrl && (
                  <>
                    <span>&bull;</span>
                    <a
                      href={`/api/click/${entry._id}`}
                      className="font-medium text-neutral-700 hover:text-accent-500 max-w-[120px] sm:max-w-none truncate"
                    >
                      {displayUrl}
                    </a>
                  </>
                )}
              </div>

              <div className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-small text-neutral-500">
                <span>{entry.clickCount?.toLocaleString() ?? 0} clicks</span>
                <span>&bull;</span>
                <Link
                  href={`/entry/${entry.slug}`}
                  className="font-medium text-neutral-500 underline hover:text-accent-500"
                >
                  see details
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
