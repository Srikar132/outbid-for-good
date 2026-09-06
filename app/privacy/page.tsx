import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="text-h1 text-neutral-900">Privacy</h1>
        <p className="text-body mt-2 text-neutral-500">
          What we collect when you donate, and what we don&apos;t.
        </p>
      </div>

      <Card className="flex items-start gap-3 border border-warning/40 bg-warning/5">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
        <p className="text-small text-neutral-700">
          <strong>Legal review pending.</strong> This describes the data this product actually
          collects and stores. The data-controller identity and contact details below are
          placeholders until finalized — this is not yet a reviewed legal document.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Data controller</p>
        <p className="text-body text-neutral-500">
          [Operating entity name — pending] is the data controller for information collected
          on this site. Contact: [Privacy contact email — pending].
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">What we collect</p>
        <p className="text-body text-neutral-500">
          When you donate: the display name and optional company name you enter, your donation
          amount, and payment metadata (order ID, payment ID, confirmation status) returned by
          Razorpay. We never see or store your card, UPI, or bank details — those go directly to
          Razorpay.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">What we don&apos;t collect</p>
        <p className="text-body text-neutral-500">
          There are no accounts, no passwords, and no login — so there&apos;s no profile data tied to
          you beyond a single entry. This site doesn&apos;t run analytics or advertising trackers of
          any kind.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Where it&apos;s stored</p>
        <p className="text-body text-neutral-500">
          Confirmed entries are stored in Sanity, our content platform, and are publicly visible
          on the leaderboard by design — that&apos;s the point of a leaderboard. If you&apos;d rather your
          real name not appear publicly, use a different display name when donating; there&apos;s no
          way to change it afterward.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Retention</p>
        <p className="text-body text-neutral-500">
          Entries are not deleted when a cycle ends — they become part of the permanent, public
          past-cycle archive. Contact us if you need an entry corrected or removed for a
          legitimate reason (e.g. a payment dispute).
        </p>
      </Card>

      <p className="text-small text-center text-neutral-400">
        Effective date: [pending] &middot; Last updated: [pending]
      </p>
    </main>
  );
}
