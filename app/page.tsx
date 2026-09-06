import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { ClaimBand } from "@/components/leaderboard/ClaimBand";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { CauseCard } from "@/components/ui/Card";
import {
  leaderboardEntries,
  categories,
  siteConfig,
} from "@/lib/mock-data";

export default function Home() {
  const sorted = [...leaderboardEntries].sort((a, b) => b.amount - a.amount);
  const topEntry = sorted[0];
  const totalRaised = sorted.reduce((sum, e) => sum + e.amount, 0);
  const nextMinBid = (topEntry?.amount ?? 0) + siteConfig.minimumIncrement;

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <Nav stats={{ totalRaised, donorCount: sorted.length }} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 sm:px-8">
        <ClaimBand
          nextMinBid={nextMinBid}
          minimumIncrement={siteConfig.minimumIncrement}
          categories={categories}
        />

        <Suspense fallback={null}>
          <LeaderboardSection entries={leaderboardEntries} categories={categories} />
        </Suspense>

        <section id="cause" className="scroll-mt-20 pt-6">
          <CauseCard title={siteConfig.causeTitle} description={siteConfig.causeBlurb} />
          <p className="text-small mt-4 text-center text-neutral-500">
            {siteConfig.fundMessage}
          </p>
        </section>
      </main>
    </div>
  );
}
