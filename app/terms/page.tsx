import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="text-h1 text-neutral-900">Terms of use</h1>
        <p className="text-body mt-2 text-neutral-500">
          What you&apos;re agreeing to by donating through this leaderboard.
        </p>
      </div>

      <Card className="flex items-start gap-3 border border-warning/40 bg-warning/5">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
        <p className="text-small text-neutral-700">
          <strong>Legal review pending.</strong> This page describes how the product actually
          behaves, but the operating entity&apos;s registered name, address, and jurisdiction below
          are placeholders until that&apos;s finalized — this is not yet a reviewed legal document.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Who operates this site</p>
        <p className="text-body text-neutral-500">
          This site is operated by [Operating entity name — pending], registered at
          [Registered address — pending]. These terms are governed by the laws of
          [Jurisdiction — pending].
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Guest checkout, no accounts</p>
        <p className="text-body text-neutral-500">
          Donating doesn&apos;t create an account. You provide a display name, an optional company
          name, and a payment. There&apos;s no login, no session, and no way to retrieve or edit
          your entry afterward — the confirmation you see right after paying is final.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">The must-outbid rule</p>
        <p className="text-body text-neutral-500">
          To take rank #1, your donation amount must exceed the current top confirmed amount
          by at least the posted minimum increment at the time you start checkout. Because the
          board is live, someone else can beat that amount before your payment completes — your
          payment is still accepted and recorded at whatever rank it earns once confirmed.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Payments and confirmation</p>
        <p className="text-body text-neutral-500">
          Payments are processed by Razorpay. An entry is only created on the leaderboard after
          Razorpay confirms the payment succeeded. If a payment fails or is abandoned, no entry
          is created and nothing is charged.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Refunds and disputes</p>
        <p className="text-body text-neutral-500">
          Because donations are processed as guest checkout with no account, refund requests
          and payment disputes are handled through Razorpay&apos;s standard dispute process, not a
          self-service flow on this site. A moderator can correct or remove an entry if a
          dispute is resolved in the donor&apos;s favor.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Content and moderation</p>
        <p className="text-body text-neutral-500">
          Display names and company names are screened before an entry is accepted. Entries
          that impersonate a real person, celebrity, or company without proof, or that contain
          obvious profanity, may be rejected or removed even after payment.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-body-lg text-neutral-900">Cycles</p>
        <p className="text-body text-neutral-500">
          The leaderboard resets on a roughly three-month cycle. A completed cycle&apos;s ranking
          becomes permanent, read-only history and is not deleted; a new cycle starts its
          ranking from zero.
        </p>
      </Card>

      <p className="text-small text-center text-neutral-400">
        Effective date: [pending] &middot; Last updated: [pending]
      </p>
    </main>
  );
}
