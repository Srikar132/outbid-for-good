import Link from "next/link";
import { AtSign } from "lucide-react";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount, timeAgo } from "@/lib/format";
import { categoryIcons } from "@/lib/category-icons";
import { faviconUrlFor, isHandleStyleUrl } from "@/lib/identity";

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

        return (
          <li
            key={entry._id}
            className={`group relative flex items-start gap-2.5 rounded-2xl p-3 transition-all hover:shadow-xs sm:gap-3 sm:p-3.5 ${getRankBg(
              index
            )}`}
          >
            <span className="text-body-lg w-6 shrink-0 pt-0.5 text-center font-extrabold tabular-nums text-accent-500">
              #{index + 1}
            </span>

            <a
              href={`/api/click/${entry._id}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-2xs sm:h-11 sm:w-11"
            >
              <div
                className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl ${
                  logoTint[entry.category.slug] ?? "bg-neutral-900 text-white"
                }`}
              >
                {entry.url && isHandleStyleUrl(entry.url) ? (
                  <AtSign size={18} />
                ) : entry.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={faviconUrlFor(entry.url)} alt="" className="h-5 w-5" />
                ) : CategoryIcon ? (
                  <CategoryIcon size={18} />
                ) : (
                  <span className="text-small font-bold">{name.charAt(0)}</span>
                )}
              </div>
            </a>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <a
                  href={`/api/click/${entry._id}`}
                  className="text-body-lg truncate font-bold text-neutral-900 transition-colors hover:text-accent-500 group-hover:text-accent-500"
                >
                  {name}
                </a>
                <span className="text-body-lg shrink-0 font-extrabold tabular-nums text-accent-500">
                  {formatAmount(entry.amount)}
                </span>
              </div>
              {entry.tagline && (
                <p className="text-small mt-0.5 line-clamp-1 text-neutral-700">{entry.tagline}</p>
              )}
              <div className="text-small mt-1 flex items-center gap-1.5 overflow-hidden text-neutral-500">
                {CategoryIcon && <CategoryIcon size={11} className="shrink-0 text-neutral-500" />}
                <span className="shrink-0 whitespace-nowrap">{entry.category.title}</span>
                <span className="shrink-0">&bull;</span>
                <span className="shrink-0 whitespace-nowrap">{timeAgo(entry.confirmedAt)}</span>
                <span className="min-w-0 shrink truncate whitespace-nowrap">
                  &bull; {entry.clickCount?.toLocaleString() ?? 0} clicks &bull;{" "}
                  <Link
                    href={`/entry/${entry.slug}`}
                    className="font-medium text-neutral-500 underline hover:text-accent-500"
                  >
                    details
                  </Link>
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
