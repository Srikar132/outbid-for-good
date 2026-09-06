import { CategoryGrid } from "@/components/leaderboard/CategoryGrid";
import { getLeaderboardData } from "@/sanity/lib/data";
import { filterEntries, scopeTopAmount } from "@/lib/filters";

export default async function CategoriesPage() {
  const { categories, entries } = await getLeaderboardData();

  const summaries = categories
    .map((category) => {
      const categoryEntries = filterEntries(entries, { categorySlug: category.slug });
      return {
        slug: category.slug,
        title: category.title,
        topEntries: categoryEntries.slice(0, 3),
        total: categoryEntries.length,
        topAmount: scopeTopAmount(categoryEntries),
      };
    })
    .sort((a, b) => b.topAmount - a.topAmount || a.title.localeCompare(b.title));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 sm:px-8">
      <div className="pt-6">
        <h1 className="text-h2 text-neutral-900">Categories</h1>
        <p className="text-body mt-1 text-neutral-500">
          Every category has its own ranking. Pick one to see who leads it.
        </p>
      </div>

      <CategoryGrid categories={summaries} />
    </main>
  );
}
