import { Leaf, Zap, ShieldCheck, Eye } from "lucide-react";
import { Nav } from "./components/Nav";
import { Button } from "./components/ui/Button";
import { Badge } from "./components/ui/Badge";
import { StatusRow } from "./components/ui/StatusDot";
import { ProgressBar } from "./components/ui/ProgressBar";
import { DonationInput, SecurePaymentInput } from "./components/ui/DonationInput";
import {
  CurrentRankCard,
  DonateCard,
  PaymentStatusCard,
  CauseCard,
} from "./components/ui/Card";

const colorSwatches = [
  { label: "Primary 500", className: "bg-primary-500" },
  { label: "Primary 400", className: "bg-primary-400" },
  { label: "Primary 300", className: "bg-primary-300" },
  { label: "Primary 200", className: "bg-primary-200" },
  { label: "Primary 100", className: "bg-primary-100" },
  { label: "Accent 500", className: "bg-accent-500" },
  { label: "Accent 400", className: "bg-accent-400" },
  { label: "Accent 300", className: "bg-accent-300" },
  { label: "Accent 200", className: "bg-accent-200" },
  { label: "Accent 100", className: "bg-accent-100" },
];

const principles = [
  {
    icon: Leaf,
    title: "Impact First",
    body: "Every donation creates real impact. Keep the cause front and center.",
  },
  {
    icon: Zap,
    title: "Must Outbid",
    body: "#1 can only be taken by beating the current confirmed amount.",
  },
  {
    icon: ShieldCheck,
    title: "Payment Trust",
    body: "Leaderboard updates only after confirmed webhook payment.",
  },
  {
    icon: Eye,
    title: "Clarity",
    body: "Show the exact amounts and payment states clearly.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <Nav />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-10 sm:px-8">
        <section>
          <p className="text-small mb-3 font-semibold uppercase tracking-wide text-neutral-500">
            Colors
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {colorSwatches.map((swatch) => (
              <div key={swatch.label}>
                <div className={`h-16 rounded-md ${swatch.className}`} />
                <p className="text-small mt-1 text-neutral-500">{swatch.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-small mb-3 font-semibold uppercase tracking-wide text-neutral-500">
            Type Scale
          </p>
          <div className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm">
            <p className="text-display text-neutral-900">Display &bull; ₹25,000</p>
            <p className="text-h1 text-neutral-900">Heading 1 &bull; Section titles</p>
            <p className="text-h2 text-neutral-900">Heading 2 &bull; Card titles</p>
            <p className="text-h3 text-neutral-900">Heading 3 &bull; Sub section titles</p>
            <p className="text-body-lg text-neutral-900">Body Large &bull; descriptions</p>
            <p className="text-body text-neutral-700">Body &bull; supporting text</p>
            <p className="text-small text-neutral-500">Small &bull; captions and meta info</p>
          </div>
        </section>

        <section>
          <p className="text-small mb-3 font-semibold uppercase tracking-wide text-neutral-500">
            Buttons
          </p>
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-5 shadow-sm">
            <Button variant="primary">Outbid & Donate</Button>
            <Button variant="secondary">View Leaderboard</Button>
            <Button variant="tertiary">Learn More</Button>
            <Button variant="text">See details &gt;</Button>
            <Button variant="primary" disabled>
              Outbid & Donate
            </Button>
          </div>
        </section>

        <section>
          <p className="text-small mb-3 font-semibold uppercase tracking-wide text-neutral-500">
            Inputs
          </p>
          <div className="grid gap-4 rounded-lg bg-white p-5 shadow-sm sm:grid-cols-3">
            <DonationInput value="₹25,001" />
            <DonationInput
              value="₹28,000"
              state="success"
              helperText="Looks good! You can take #1."
            />
            <DonationInput
              value="₹20,000"
              state="error"
              helperText="Enter an amount higher than ₹25,001."
            />
            <div className="sm:col-span-3">
              <SecurePaymentInput />
            </div>
          </div>
        </section>

        <section>
          <p className="text-small mb-3 font-semibold uppercase tracking-wide text-neutral-500">
            Badges & Status
          </p>
          <div className="flex flex-col gap-6 rounded-lg bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="current">#1 Current</Badge>
              <Badge variant="confirmed">Payment Confirmed</Badge>
              <Badge variant="pending">Pending</Badge>
              <Badge variant="failed">Payment Failed</Badge>
              <Badge variant="donor">Donor</Badge>
              <Badge variant="company">Company</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatusRow kind="confirmed" />
              <StatusRow kind="pending" />
              <StatusRow kind="failed" />
              <StatusRow kind="webhook" />
              <StatusRow kind="current" />
            </div>
          </div>
        </section>

        <section>
          <p className="text-small mb-3 font-semibold uppercase tracking-wide text-neutral-500">
            Progress Bar
          </p>
          <ProgressBar current="₹25,000" nextBid="₹25,001" percent={72} />
        </section>

        <section>
          <p className="text-small mb-3 font-semibold uppercase tracking-wide text-neutral-500">
            Cards
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CurrentRankCard
              amount="₹25,000"
              donor="Anonymous Donor"
              nextMinimumBid="₹25,001"
            />
            <DonateCard />
            <PaymentStatusCard
              amount="₹28,000"
              transactionId="pi_3H8K2K9L"
              confirmedAgo="2 mins ago"
            />
            <CauseCard
              title="Clean Water for Brighter Futures"
              description="Support clean and safe drinking water for communities in need."
            />
          </div>
        </section>

        <section>
          <p className="text-small mb-3 font-semibold uppercase tracking-wide text-neutral-500">
            Principles
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-lg bg-white p-5 shadow-sm">
                <Icon size={20} className="text-primary-400" />
                <p className="text-h3 mt-2 text-neutral-900">{title}</p>
                <p className="text-body mt-1 text-neutral-500">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
