import { Card } from "@/components/ui/Card";

const faqs = [
  {
    q: "How do I take #1?",
    a: "Donate more than the current top confirmed amount, plus the minimum increment. If your amount doesn't clear that bar, you'll be told before you're sent to payment — not after.",
  },
  {
    q: "What happens if my payment fails or I close the tab mid-checkout?",
    a: "Nothing changes on the leaderboard. An entry only appears after Razorpay confirms the payment through a verified webhook — there's no pending or optimistic preview shown anywhere.",
  },
  {
    q: "Can someone else outbid me right after I pay?",
    a: "Yes. The board is live — anyone can beat your amount at any time during the active cycle. That's the entire mechanic.",
  },
  {
    q: "Why can't I edit or cancel my entry after donating?",
    a: "This is guest checkout — no account, no login, no session. There's nothing to sign back into, so the confirmation screen you see right after paying is the only record you get from us. Get a screenshot if you want one.",
  },
  {
    q: "Where does the money actually go?",
    a: "This site never holds or touches donor money. Payments settle directly to the cause's own registered account via Razorpay — this codebase only records who paid what, it doesn't move funds.",
  },
  {
    q: "What are categories for?",
    a: "Categories (Individual, Company, Brand, etc.) let you filter the board and see who's leading within a specific type of donor. They don't create separate must-outbid targets — the #1 spot you're chasing is always the single highest confirmed amount across the whole board.",
  },
  {
    q: "What happens when a cycle ends?",
    a: "The leaderboard runs in roughly three-month cycles. When one ends, its final ranking is archived as permanent, read-only history, and a new cycle starts from zero — no carried-over totals.",
  },
  {
    q: "Can an entry be removed or corrected?",
    a: "Yes, in cases like a payment dispute, refund, or an offline/bank-transfer donation that needs manual entry. That happens through moderator review, not automatically.",
  },
  {
    q: "Is there a minimum donation?",
    a: "There's a minimum increment over the current top amount, shown live on the donation form. There's no separate minimum for entering below #1 beyond what's enforced there.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="text-h1 text-neutral-900">Frequently asked questions</h1>
        <p className="text-body mt-2 text-neutral-500">
          If something&apos;s still unclear after this, check{" "}
          <a href="/rules" className="font-semibold text-primary-500 hover:text-primary-400">
            how the leaderboard works
          </a>
          .
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((item) => (
          <Card key={item.q}>
            <p className="text-body-lg text-neutral-900">{item.q}</p>
            <p className="text-body mt-1 text-neutral-500">{item.a}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
