import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function ImprintPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="text-h1 text-neutral-900">Imprint</h1>
        <p className="text-body mt-2 text-neutral-500">Who&apos;s behind this site.</p>
      </div>

      <Card className="flex items-start gap-3 border border-warning/40 bg-warning/5">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
        <p className="text-small text-neutral-700">
          <strong>Legal review pending.</strong> The operator identity and registration details
          below are placeholders until the operating entity is finalized.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Site operator</p>
        <p className="text-body text-neutral-500">
          [Operating entity name — pending]
          <br />
          [Registered address — pending]
          <br />
          Contact: [Contact email — pending]
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Payments</p>
        <p className="text-body text-neutral-500">
          Payments are processed by Razorpay. This site does not hold or route donor funds
          itself — payments settle to the cause&apos;s own registered account.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Hosting</p>
        <p className="text-body text-neutral-500">
          This site is hosted on Vercel. Content and leaderboard data are managed in Sanity.
        </p>
      </Card>
    </main>
  );
}
