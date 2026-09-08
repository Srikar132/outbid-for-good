import { Trophy, Users, Layers, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getLeaderboardData } from "@/sanity/lib/data";
import { scopeTopAmount } from "@/lib/filters";
import { formatAmount } from "@/lib/format";

export default async function AboutPage() {
  const { siteConfig, categories, entries } = await getLeaderboardData();

  const totalRaised = entries.reduce((sum, e) => sum + e.amount, 0);
  const donorCount = entries.length;
  const topAmount = scopeTopAmount(entries);

  const stats = [
    { icon: Wallet, label: "raised this cycle", value: formatAmount(totalRaised) },
    { icon: Users, label: "confirmed donors", value: donorCount.toLocaleString("en-IN") },
    { icon: Trophy, label: "current top donation", value: topAmount ? formatAmount(topAmount) : "—" },
    { icon: Layers, label: "categories", value: categories.length.toLocaleString("en-IN") },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="text-h1 text-neutral-900">About this leaderboard</h1>
        <p className="text-body mt-2 text-neutral-500">
          No ads, no sponsorships, no revenue for this site. Just one leaderboard, one rule:
          beat the current top to take #1.
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        <p className="text-body-lg text-neutral-900">Why this exists</p>
        <p className="text-body text-neutral-500">
          Most donation pages are a quiet form and a thank-you email. This one makes giving
          visible and a little competitive: every donor and company on this board took the
          top spot by outbidding whoever was there before them, and everyone can see it happen
          in real time. The leaderboard runs in three-month cycles — when one ends, its ranking
          becomes a permanent, read-only record, and a new cycle starts from zero.
        </p>
        {siteConfig?.fundMessage && (
          <p className="text-body text-neutral-500">{siteConfig.fundMessage}</p>
        )}
      </Card>

      {siteConfig?.creatorName && (
        <Card className="flex flex-col gap-2">
          <p className="text-body-lg text-neutral-900">The cause</p>
          <p className="text-body text-neutral-500">
            {siteConfig.creatorBlurb ?? siteConfig.causeBlurb}
          </p>
        </Card>
      )}

      <div>
        <p className="text-small mb-3 font-semibold uppercase tracking-wide text-neutral-500">
          Right now
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="flex flex-col items-start gap-2">
              <stat.icon size={18} className="text-accent-500" />
              <p className="text-h3 tabular-nums text-neutral-900">{stat.value}</p>
              <p className="text-small text-neutral-500">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-small text-center text-neutral-400">
        Numbers reflect the active cycle only and reset when a new cycle starts.
      </p>
    </main>
  );
}
