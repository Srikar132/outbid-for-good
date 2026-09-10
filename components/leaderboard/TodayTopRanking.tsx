import Link from "next/link";
import { ArrowRight, AtSign } from "lucide-react";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount } from "@/lib/format";
import { categoryIcons } from "@/lib/category-icons";
import { faviconUrlFor, isHandleStyleUrl } from "@/lib/identity";

const logoTint: Record<string, string> = {
  individual: "bg-primary-100 text-primary-500",
  company: "bg-info/10 text-info",
  brand: "bg-accent-100 text-accent-500",
};

export function TodayTopRanking({
  entries,
  href,
}: {
  entries: LeaderboardEntryResult[];
  href: string;
}) {
  if (entries.length === 0) return null;

  return (
    <li className="rounded-2xl bg-surface p-3 shadow-2xs sm:p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-small flex items-center gap-1.5 font-bold text-neutral-900">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          Today&apos;s top ranking
        </span>
        <Link
          href={href}
          className="text-small flex items-center gap-0.5 font-semibold text-accent-500 hover:text-accent-400"
        >
          See all <ArrowRight size={12} />
        </Link>
      </div>

      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {entries.map((entry, index) => {
          const CategoryIcon = categoryIcons[entry.category.slug];
          const name = entry.companyName ?? entry.displayName;

          return (
            <li key={entry._id}>
              <a
                href={`/api/click/${entry._id}`}
                className="bg-cream flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-neutral-100"
              >
                <span className="text-small w-4 shrink-0 text-center font-extrabold tabular-nums text-accent-500">
                  #{index + 1}
                </span>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                    logoTint[entry.category.slug] ?? "bg-neutral-900 text-white"
                  }`}
                >
                  {entry.url && isHandleStyleUrl(entry.url) ? (
                    <AtSign size={13} />
                  ) : entry.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={faviconUrlFor(entry.url)} alt="" className="h-3.5 w-3.5" />
                  ) : CategoryIcon ? (
                    <CategoryIcon size={13} />
                  ) : (
                    <span className="text-small font-bold">{name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-small min-w-0 flex-1 truncate font-semibold text-neutral-900">
                  {name}
                </span>
                <span className="text-small shrink-0 font-extrabold tabular-nums text-accent-500">
                  {formatAmount(entry.amount)}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </li>
  );
}
