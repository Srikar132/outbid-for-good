import { notFound } from "next/navigation";
import { ClaimBand } from "@/components/leaderboard/ClaimBand";
import { CategoryTabs } from "@/components/leaderboard/CategoryTabs";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { CauseCard } from "@/components/ui/Card";
import { getLeaderboardData } from "@/sanity/lib/data";
import { filterEntries, scopeTopAmount } from "@/lib/filters";
import { mockEntries, isMockLeaderboardEnabled } from "@/lib/mock-entries";
import { parsePageParam } from "@/lib/pagination";
import { Scope, viewToggleHref } from "@/lib/scope";

const FALLBACK_CAUSE_TITLE = "This cause is being set up";
const FALLBACK_CAUSE_BLURB =
  "Site configuration hasn't been published in Sanity Studio yet.";
const FALLBACK_MIN_INCREMENT = 0;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; today?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { q, today, page } = await searchParams;
  const { siteConfig, categories, entries: liveEntries } = await getLeaderboardData();

  // Dev-only fixture swap — see lib/mock-entries.ts.
  const entries = isMockLeaderboardEnabled() ? mockEntries(categories) : liveEntries;

  if (!categories.some((c) => c.slug === slug)) {
    notFound();
  }

  const scope: Scope = { categorySlug: slug, today: today === "true" };
  const minimumIncrement = siteConfig?.minimumIncrement ?? FALLBACK_MIN_INCREMENT;

  // See app/page.tsx — ranks come from the scope-filtered board, not from the
  // search results, so a searched donor keeps the rank they actually hold.
  const scoped = filterEntries(entries, scope);
  const topAmount = scopeTopAmount(scoped);
  const filtered = q ? filterEntries(scoped, { q }) : scoped;
  const rankById = q
    ? new Map(scoped.map((entry, index) => [entry._id, index + 1]))
    : undefined;

  // Already viewing today for this category — the strip would repeat the list.
  const todayEntries = scope.today
    ? undefined
    : filterEntries(entries, { ...scope, today: true });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 pt-6 sm:px-8">
      <CategoryTabs categories={categories} scope={scope} q={q} />

      <ClaimBand
        key={`${slug}-${scope.today ? "today" : "all-time"}`}
        scope={scope}
        scopeTopAmount={topAmount}
        minimumIncrement={minimumIncrement}
        categories={categories}
        q={q}
      />

      <LeaderboardList
        entries={filtered}
        page={parsePageParam(page)}
        scope={scope}
        q={q}
        rankById={rankById}
        todayEntries={todayEntries}
        todayHref={viewToggleHref("today", scope, q)}
      />

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
