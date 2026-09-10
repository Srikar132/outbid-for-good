import { CategoryGrid } from "@/components/leaderboard/CategoryGrid";
import { MostActiveCategories, ActiveCategory } from "@/components/leaderboard/MostActiveCategories";
import { getLeaderboardData } from "@/sanity/lib/data";
import { filterEntries, scopeTopAmount } from "@/lib/filters";

const MOST_ACTIVE_COUNT = 3;

export default async function CategoriesPage() {
  const { categories, entries } = await getLeaderboardData();

  const withEntries = categories.map((category) => {
    const categoryEntries = filterEntries(entries, { categorySlug: category.slug });
    return { category, categoryEntries };
  });

  const summaries = withEntries
    .map(({ category, categoryEntries }) => ({
      slug: category.slug,
      title: category.title,
      topEntries: categoryEntries.slice(0, 3),
      total: categoryEntries.length,
      topAmount: scopeTopAmount(categoryEntries),
    }))
    .sort((a, b) => b.topAmount - a.topAmount || a.title.localeCompare(b.title));

  const activeCategories: ActiveCategory[] = withEntries
    .filter(({ categoryEntries }) => categoryEntries.length > 0)
    .map(({ category, categoryEntries }) => {
      const lastConfirmedAt = categoryEntries.reduce(
        (latest, e) => (e.confirmedAt > latest ? e.confirmedAt : latest),
        categoryEntries[0].confirmedAt
      );
      return {
        slug: category.slug,
        title: category.title,
        claimCount: categoryEntries.length,
        lastConfirmedAt,
        leader: categoryEntries[0],
      };
    })
    .sort((a, b) => (a.lastConfirmedAt > b.lastConfirmedAt ? -1 : 1))
    .slice(0, MOST_ACTIVE_COUNT);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 sm:px-8">
      <div className="pt-6">
        <h1 className="text-h2 text-neutral-900">Categories</h1>
        <p className="text-body mt-1 text-neutral-500">
          Every category has its own ranking. Pick one to see who leads it.
        </p>
      </div>

      <MostActiveCategories categories={activeCategories} />

      <CategoryGrid categories={summaries} />
    </main>
  );
}
