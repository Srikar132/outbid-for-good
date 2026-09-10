import Link from "next/link";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount, timeAgoLong } from "@/lib/format";
import { categoryIcons, defaultCategoryIcon } from "@/lib/category-icons";
import { EntryAvatar } from "./EntryAvatar";

export type ActiveCategory = {
  slug: string;
  title: string;
  claimCount: number;
  lastConfirmedAt: string;
  leader: LeaderboardEntryResult;
};

const rankLabel = (index: number) => (index === 0 ? "#1 HOTTEST" : `#${index + 1}`);

/**
 * Categories ranked by how recently someone claimed in them — momentum, not
 * size. Sits on a recessed panel so the cards inside read as raised, which is
 * what separates this from the plain category grid below it.
 */
export function MostActiveCategories({ categories }: { categories: ActiveCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="rounded-2xl bg-neutral-100 p-4 sm:p-5">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
        <h2 className="text-body-lg font-bold text-neutral-900">Most active categories</h2>
      </div>
      <p className="text-small mt-1 mb-4 text-neutral-500">
        Where ranks are getting claimed right now — and who is holding the top spot.
      </p>

      {/* Three across only from lg: at 640px each card is ~200px, which is not
          enough for the title plus the leader row's avatar, name and amount. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => {
          const Icon = categoryIcons[category.slug] ?? defaultCategoryIcon;
          const leaderName = category.leader.companyName ?? category.leader.displayName;
          const isHottest = index === 0;

          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className={`flex flex-col gap-3 rounded-xl bg-surface p-4 transition-shadow hover:shadow-md ${
                isHottest
                  ? "ring-1 ring-accent-300"
                  : "ring-1 ring-neutral-200 dark:ring-white/5"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-500">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <span className="text-small block font-bold tracking-wide text-accent-500 dark:text-neutral-700">
                    {rankLabel(index)}
                  </span>
                  <h3 className="text-body-lg truncate font-bold text-neutral-900">
                    {category.title}
                  </h3>
                </div>
              </div>

              <div className="text-small flex flex-wrap items-center justify-between gap-x-2 text-neutral-500">
                <span className="shrink-0">
                  {category.claimCount} {category.claimCount === 1 ? "claim" : "claims"}
                </span>
                <span className="shrink-0">{timeAgoLong(category.lastConfirmedAt)}</span>
              </div>

              <div className="flex min-w-0 items-center gap-2 rounded-lg bg-accent-50 px-2.5 py-2">
                <EntryAvatar entry={category.leader} size="xs" />
                <span className="text-small min-w-0 flex-1 truncate text-neutral-500">
                  Leading{" "}
                  <span className="font-semibold text-neutral-900">{leaderName}</span>
                </span>
                <span className="text-small shrink-0 font-bold tabular-nums text-accent-500 dark:text-neutral-900">
                  {formatAmount(category.leader.amount)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
