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
