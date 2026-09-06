import { notFound } from "next/navigation";
import { ClaimBand } from "@/components/leaderboard/ClaimBand";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { CauseCard } from "@/components/ui/Card";
import { getLeaderboardData } from "@/sanity/lib/data";
import { filterEntries, scopeTopAmount } from "@/lib/filters";
import { Scope } from "@/lib/scope";

const FALLBACK_CAUSE_TITLE = "This cause is being set up";
const FALLBACK_CAUSE_BLURB =
  "Site configuration hasn't been published in Sanity Studio yet.";
const FALLBACK_MIN_INCREMENT = 0;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; today?: string }>;
}) {
  const { slug } = await params;
  const { q, today } = await searchParams;
  const { siteConfig, categories, entries } = await getLeaderboardData();

  if (!categories.some((c) => c.slug === slug)) {
    notFound();
  }

  const scope: Scope = { categorySlug: slug, today: today === "true" };
  const minimumIncrement = siteConfig?.minimumIncrement ?? FALLBACK_MIN_INCREMENT;
  const topAmount = scopeTopAmount(filterEntries(entries, scope));
  const filtered = filterEntries(entries, { ...scope, q });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 sm:px-8">
      <ClaimBand
        key={`${slug}-${scope.today ? "today" : "all-time"}`}
        scope={scope}
        scopeTopAmount={topAmount}
        minimumIncrement={minimumIncrement}
        categories={categories}
      />

      <LeaderboardSection entries={filtered} categories={categories} scope={scope} q={q} />

      <section id="cause" className="scroll-mt-20 pt-6">
        <CauseCard
          title={siteConfig?.causeTitle ?? FALLBACK_CAUSE_TITLE}
          description={siteConfig?.causeBlurb ?? FALLBACK_CAUSE_BLURB}
        />
        {siteConfig?.fundMessage && (
          <p className="text-small mt-4 text-center text-neutral-500">
            {siteConfig.fundMessage}
          </p>
        )}
      </section>
    </main>
  );
}
