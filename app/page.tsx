import { Suspense } from "react";
import { ClaimBand } from "@/components/leaderboard/ClaimBand";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { CauseCard } from "@/components/ui/Card";
import { getLeaderboardData } from "@/sanity/lib/data";

const FALLBACK_CAUSE_TITLE = "This cause is being set up";
const FALLBACK_CAUSE_BLURB =
  "Site configuration hasn't been published in Sanity Studio yet.";
const FALLBACK_MIN_INCREMENT = 0;

export default async function Home() {
  const { siteConfig, categories, entries } = await getLeaderboardData();

  const topEntry = [...entries].sort((a, b) => b.amount - a.amount)[0];
  const minimumIncrement = siteConfig?.minimumIncrement ?? FALLBACK_MIN_INCREMENT;
  const nextMinBid = (topEntry?.amount ?? 0) + minimumIncrement;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 sm:px-8">
      <ClaimBand
        nextMinBid={nextMinBid}
        minimumIncrement={minimumIncrement}
        categories={categories}
      />

      <Suspense fallback={null}>
        <LeaderboardSection entries={entries} categories={categories} />
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
  );
}
