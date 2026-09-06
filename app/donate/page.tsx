import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { DonateForm } from "@/components/leaderboard/DonateForm";
import { leaderboardEntries, siteConfig } from "@/lib/mock-data";

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string; name?: string }>;
}) {
  const params = await searchParams;
  const sorted = [...leaderboardEntries].sort((a, b) => b.amount - a.amount);
  const currentTop = sorted[0]?.amount ?? 0;
  const initialAmount = params.amount ? Number(params.amount) : undefined;

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <Nav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10">
        <Link
          href="/"
          className="text-small inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft size={14} /> Back to leaderboard
        </Link>
        <DonateForm
          currentTop={currentTop}
          minimumIncrement={siteConfig.minimumIncrement}
          initialName={params.name}
          initialAmount={initialAmount}
        />
      </main>
    </div>
  );
}
