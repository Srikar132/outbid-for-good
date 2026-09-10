import Link from "next/link";
import { ArrowRight, AtSign } from "lucide-react";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount } from "@/lib/format";
import { categoryIcons, defaultCategoryIcon } from "@/lib/category-icons";
import { faviconUrlFor, isHandleStyleUrl } from "@/lib/identity";

const logoTint: Record<string, string> = {
  individual: "bg-primary-100 text-primary-500",
  company: "bg-info/10 text-info",
  brand: "bg-accent-100 text-accent-500",
};

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
      className="flex flex-col gap-3 rounded-lg bg-surface p-5 shadow-sm transition-colors hover:ring-1 hover:ring-accent-300 dark:ring-1 dark:ring-white/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-500">
            <Icon size={18} />
          </div>
          <h3 className="text-h3 text-neutral-900">{title}</h3>
        </div>
        <ArrowRight size={16} className="mt-2 shrink-0 text-neutral-300" />
      </div>

      {topEntries.length === 0 ? (
        <p className="text-small text-neutral-500">No claims yet — be the first.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {topEntries.map((entry, index) => {
            const name = entry.companyName ?? entry.displayName;
            return (
              <li
                key={entry._id}
                className="flex items-center gap-2 text-body text-neutral-700"
              >
                <span className="w-4 shrink-0 text-small tabular-nums text-neutral-400">
                  {index + 1}
                </span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                    logoTint[entry.category.slug] ?? "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {entry.url && isHandleStyleUrl(entry.url) ? (
                    <AtSign size={12} />
                  ) : entry.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={faviconUrlFor(entry.url)} alt="" className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-small font-bold">{name.charAt(0)}</span>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="shrink-0 tabular-nums font-semibold text-accent-500">
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
