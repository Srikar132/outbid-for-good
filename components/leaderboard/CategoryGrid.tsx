import { CategoryCard } from "./CategoryCard";
import { LeaderboardEntryResult } from "@/sanity/lib/data";

export function CategoryGrid({
  categories,
}: {
  categories: {
    slug: string;
    title: string;
    topEntries: LeaderboardEntryResult[];
    total: number;
  }[];
}) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg bg-surface p-8 text-center shadow-sm">
        <p className="text-body text-neutral-500">
          No categories configured in Sanity Studio yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.slug}
          slug={category.slug}
          title={category.title}
          topEntries={category.topEntries}
          total={category.total}
        />
      ))}
    </div>
  );
}
