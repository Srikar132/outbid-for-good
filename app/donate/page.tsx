import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConfirmClaim } from "@/components/leaderboard/ConfirmClaim";
import { getLeaderboardData } from "@/sanity/lib/data";
import { filterEntries, scopeTopAmount } from "@/lib/filters";
import { parseScope, scopeLabel } from "@/lib/scope";

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{
    amount?: string;
    category?: string;
    scopeCategory?: string;
    today?: string;
    url?: string;
  }>;
}) {
  const params = await searchParams;
  const { siteConfig, categories, entries } = await getLeaderboardData();

  // `scope` is which board's top this claim must beat (the page the donor
  // claimed from). `category` is the taxonomy tag their own entry gets.
  // These can differ (e.g. claiming from "/" with a Brand tag beats the
  // global top), so they're parsed from separate params — never conflate
  // them, see prompts/donate-checkout-flow.md and the code-review that
  // caught this.
  const scope = parseScope({ category: params.scopeCategory, today: params.today });
  const category = params.category
    ? categories.find((c) => c.slug === params.category)
    : undefined;
  const categoryInvalid = !params.category || !category;

  const minimumIncrement = siteConfig?.minimumIncrement ?? 0;
  const topAmount = scopeTopAmount(filterEntries(entries, scope));
  const floor = topAmount + minimumIncrement;
  const amount = Number(params.amount);
  const amountValid = Number.isFinite(amount) && amount >= floor;

  const backHref = scope.categorySlug ? `/category/${scope.categorySlug}` : "/";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10">
      <Link
        href={backHref}
        className="text-small inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft size={14} /> Back to leaderboard
      </Link>

      {categoryInvalid || !amountValid ? (
        <div className="rounded-lg bg-surface p-5 shadow-sm">
          <p className="text-h3 text-neutral-900">This rank has changed</p>
          <p className="text-body mt-2 text-neutral-500">
            {categoryInvalid
              ? "That category no longer exists."
              : `Someone may have claimed this rank in the meantime. The current floor${scopeLabel(
                  scope,
                  categories
                )} is ₹${floor.toLocaleString("en-IN")}.`}{" "}
            Go back and claim again.
          </p>
        </div>
      ) : (
        <ConfirmClaim
          scope={scope}
          amount={amount}
          categorySlug={category!.slug}
          categoryTitle={category!.title}
          initialUrl={params.url ?? ""}
          fundMessage={siteConfig?.fundMessage ?? undefined}
        />
      )}
    </main>
  );
}
