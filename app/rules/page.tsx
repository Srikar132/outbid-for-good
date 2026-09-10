import { Trophy, ShieldCheck, RefreshCw, Wallet, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getSiteConfig, getActiveCycle } from "@/sanity/lib/data";

const rules = [
  {
    icon: Trophy,
    title: "You must outbid the current top",
    body: "To take rank #1, your donation has to be higher than the current top confirmed amount. This is the whole point of the leaderboard — every rank is earned by beating the person before you.",
  },
  {
    icon: TrendingUp,
    title: "Minimum increment applies",
    body: "A new donation must clear the current top by at least the minimum increment, enforced on the server when your order is created — not just shown in the UI.",
  },
  {
    icon: ShieldCheck,
    title: "Only confirmed payments count",
    body: "An entry appears on the leaderboard only after Razorpay confirms the payment through a verified webhook. Pending or failed attempts are never shown, and there's no optimistic preview of a donation that hasn't gone through.",
  },
  {
    icon: RefreshCw,
    title: "The board resets every cycle",
    body: "The leaderboard runs in cycles of roughly three months. When a cycle ends, its ranking becomes a read-only \"past champions\" archive, and a new cycle starts from zero.",
  },
  {
    icon: Wallet,
    title: "Fair play, baseline",
    body: "Bid attempts are rate-limited per visitor, and display names are screened for obvious impersonation or profanity before an entry is accepted. Borderline cases are flagged for manual review rather than silently allowed through.",
  },
];

export default async function RulesPage() {
  const [siteConfig, cycle] = await Promise.all([getSiteConfig(), getActiveCycle()]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="text-h1 text-neutral-900">How this leaderboard works</h1>
        <p className="text-body mt-2 text-neutral-500">
          The rules behind the ranking — how a donation takes #1, and why some things you might
          expect (like an instant preview of your donation) are deliberately not there.
        </p>
      </div>

      <Card>
        <p className="text-body-lg font-bold text-neutral-900">The boards</p>
        <p className="text-body mt-1 text-neutral-500">
          One confirmed donation ranks you on every board that includes it — the boards just
          look at different windows of time.
        </p>
        <ul className="text-body mt-3 flex flex-col gap-2 text-neutral-700">
          <li>
            <span className="font-semibold text-accent-500">All-time</span> is the main
            leaderboard. Rank is everything confirmed so far this cycle. It doesn&apos;t reset
            until the next cycle starts.
          </li>
          <li>
            <span className="font-semibold text-accent-500">Today</span> is a rolling 24 hours.
            A confirmed donation counts from the moment it&apos;s confirmed, then drops off a day
            later. Whoever gave the most in that window leads Today.
          </li>
          <li>
            <span className="font-semibold text-accent-500">Daily</span> is a UTC calendar day
            &mdash; midnight to midnight. The current day stays live until it closes at midnight
            UTC; past days freeze as a read-only archive. Rank on a given day is what was
            confirmed that day, not a rolling 24 hours.
          </li>
        </ul>
      </Card>

      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <Card key={rule.title} className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-500">
              <rule.icon size={18} />
            </div>
            <div>
              <p className="text-body-lg text-neutral-900">{rule.title}</p>
              <p className="text-body mt-1 text-neutral-500">{rule.body}</p>
            </div>
          </Card>
        ))}
      </div>

      {(siteConfig?.minimumIncrement || cycle) && (
        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
            Right now
          </p>
          <ul className="text-body mt-2 flex flex-col gap-1 text-neutral-700">
            {siteConfig?.minimumIncrement != null && (
              <li>
                Minimum increment: <strong>₹{siteConfig.minimumIncrement.toLocaleString("en-IN")}</strong>
              </li>
            )}
            {cycle && (
              <li>
                Active cycle:{" "}
                <strong>
                  {new Date(cycle.startDate).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  &ndash;{" "}
                  {new Date(cycle.endDate).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </li>
            )}
          </ul>
        </Card>
      )}

      {siteConfig?.fundMessage && (
        <p className="text-small text-center text-neutral-500">{siteConfig.fundMessage}</p>
      )}
    </main>
  );
}
