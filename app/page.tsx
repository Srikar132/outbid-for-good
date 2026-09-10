import { CategoryTabs } from "@/components/leaderboard/CategoryTabs";
import { CauseHero } from "@/components/leaderboard/CauseHero";
import { ClaimBand } from "@/components/leaderboard/ClaimBand";
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const { siteConfig, categories, entries: liveEntries } = await getLeaderboardData();

  // Dev-only fixture swap — see lib/mock-entries.ts. Never active in a
  // production build, and never written back to Sanity.
  const entries = isMockLeaderboardEnabled() ? mockEntries(categories) : liveEntries;

  const scope: Scope = {};
  const minimumIncrement = siteConfig?.minimumIncrement ?? FALLBACK_MIN_INCREMENT;

  // The scope-filtered list is the board itself — it fixes both the claim
  // floor and every donor's true rank. Searching narrows what is displayed,
  // never what a donor's rank is, so rankById is taken from `scoped` and the
  // search filter is applied on top.
  const scoped = filterEntries(entries, scope);
  const topAmount = scopeTopAmount(scoped);
  const filtered = q ? filterEntries(scoped, { q }) : scoped;
  const rankById = q
    ? new Map(scoped.map((entry, index) => [entry._id, index + 1]))
    : undefined;

  // Last 24h, ranked by amount — an independent list from the podium above it.
  const todayEntries = filterEntries(entries, { today: true });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 sm:px-8">
      <CategoryTabs categories={categories} scope={scope} q={q} />

      <ClaimBand
        key="all-all-time"
        scope={scope}
        scopeTopAmount={topAmount}
        minimumIncrement={minimumIncrement}
        categories={categories}
        q={q}
      />

      <CauseHero siteConfig={siteConfig} />

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
