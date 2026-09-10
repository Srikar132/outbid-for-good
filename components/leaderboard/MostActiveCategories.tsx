import Link from "next/link";
import { AtSign } from "lucide-react";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { formatAmount, timeAgoLong } from "@/lib/format";
import { categoryIcons, defaultCategoryIcon } from "@/lib/category-icons";
import { faviconUrlFor, isHandleStyleUrl } from "@/lib/identity";

const logoTint: Record<string, string> = {
  individual: "bg-primary-100 text-primary-500",
  company: "bg-info/10 text-info",
  brand: "bg-accent-100 text-accent-500",
};

export type ActiveCategory = {
  slug: string;
  title: string;
  claimCount: number;
  lastConfirmedAt: string;
  leader: LeaderboardEntryResult;
};

const rankLabel = (index: number) => (index === 0 ? "#1 HOTTEST" : `#${index + 1}`);

export function MostActiveCategories({ categories }: { categories: ActiveCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="rounded-2xl bg-surface p-5 shadow-sm dark:ring-1 dark:ring-white/5">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
        <h2 className="text-h3 text-neutral-900">Most active categories</h2>
      </div>
      <p className="text-small -mt-3 mb-4 text-neutral-500">
        Where ranks are getting claimed right now — and who is holding the top spot.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {categories.map((category, index) => {
          const Icon = categoryIcons[category.slug] ?? defaultCategoryIcon;
          const leaderName = category.leader.companyName ?? category.leader.displayName;

          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="flex flex-col gap-1.5 rounded-xl border border-accent-100 bg-cream p-4 transition-colors hover:ring-1 hover:ring-accent-300"
            >
              <span className="text-small flex items-center gap-1.5 font-bold text-accent-500">
                <Icon size={14} />
                {rankLabel(index)}
              </span>
              <h3 className="text-body-lg font-bold text-neutral-900">{category.title}</h3>
              <div className="text-small flex items-center justify-between text-neutral-500">
                <span>
                  {category.claimCount} {category.claimCount === 1 ? "claim" : "claims"}
                </span>
                <span>{timeAgoLong(category.lastConfirmedAt)}</span>
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-1.5">
                <span className="text-small shrink-0 text-neutral-500">Leading</span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                    logoTint[category.slug] ?? "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {category.leader.url && isHandleStyleUrl(category.leader.url) ? (
                    <AtSign size={11} />
                  ) : category.leader.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={faviconUrlFor(category.leader.url)}
                      alt=""
                      className="h-3 w-3"
                    />
                  ) : (
                    <span className="text-small font-bold">{leaderName.charAt(0)}</span>
                  )}
                </span>
                <span className="text-small min-w-0 flex-1 truncate font-semibold text-neutral-900">
                  {leaderName}
                </span>
                <span className="text-small shrink-0 font-semibold text-accent-500">
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
