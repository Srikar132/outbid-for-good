import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { ClaimBand } from "@/components/leaderboard/ClaimBand";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { CauseCard } from "@/components/ui/Card";
import { getLeaderboardData } from "@/sanity/lib/data";
import { toCategory, toLeaderboardEntry } from "@/sanity/lib/adapters";

const FALLBACK_CAUSE_TITLE = "This cause is being set up";
const FALLBACK_CAUSE_BLURB =
  "Site configuration hasn't been published in Sanity Studio yet.";
const FALLBACK_MIN_INCREMENT = 0;

export default async function Home() {
  const { siteConfig, categories, entries } = await getLeaderboardData();

  const leaderboardEntries = entries.map(toLeaderboardEntry);
  const leaderboardCategories = categories.map(toCategory);

  const sorted = [...leaderboardEntries].sort((a, b) => b.amount - a.amount);
  const topEntry = sorted[0];
  const totalRaised = sorted.reduce((sum, e) => sum + e.amount, 0);
  const minimumIncrement = siteConfig?.minimumIncrement ?? FALLBACK_MIN_INCREMENT;
  const nextMinBid = (topEntry?.amount ?? 0) + minimumIncrement;

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <Nav stats={{ totalRaised, donorCount: sorted.length }} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 sm:px-8">
        <ClaimBand
          nextMinBid={nextMinBid}
          minimumIncrement={minimumIncrement}
          categories={leaderboardCategories}
        />

        <Suspense fallback={null}>
          <LeaderboardSection entries={leaderboardEntries} categories={leaderboardCategories} />
        </Suspense>

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
    </div>
  );
}
