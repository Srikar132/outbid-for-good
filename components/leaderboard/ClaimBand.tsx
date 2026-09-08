"use client";

import { useEffect, useState } from "react";
import { Globe, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { CategoryResult } from "@/sanity/lib/data";
import { Scope, scopeLabel } from "@/lib/scope";

type RankPreview = { rank: number; total: number };

export function ClaimBand({
  scope,
  scopeTopAmount,
  minimumIncrement,
  categories,
}: {
  scope: Scope;
  scopeTopAmount: number;
  minimumIncrement: number;
  categories: CategoryResult[];
}) {
  const claimAmount = scopeTopAmount + minimumIncrement;
  const label = scopeLabel(scope, categories);

  const [amount, setAmount] = useState(claimAmount);
  const [name, setName] = useState("");
  const category = scope.categorySlug ?? categories[0]?.slug ?? "";
  const [preview, setPreview] = useState<RankPreview | null>(null);
  const [loading, setLoading] = useState(false);

  const step = (dir: 1 | -1) => {
    setAmount((prev) => Math.max(minimumIncrement, prev + dir * minimumIncrement));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ amount: String(amount) });
      if (scope.categorySlug) params.set("category", scope.categorySlug);
      if (scope.today) params.set("today", "true");

      fetch(`/api/rank-preview?${params.toString()}`)
        .then((res) => res.json())
        .then((data: RankPreview) => setPreview(data))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [amount, scope.categorySlug, scope.today]);

  const isTop = !loading && preview?.rank === 1;

  const claimHref = `/donate?amount=${amount}&category=${category}${
    name ? `&name=${encodeURIComponent(name)}` : ""
  }`;

  return (
    <section className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex items-center gap-3">
        <button
          onClick={() => step(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-accent-300 hover:text-accent-500"
          aria-label="Decrease amount"
        >
          <Minus size={16} />
        </button>
        <h1 className="text-display text-neutral-900">
          Claim rank{label} for{" "}
          <span className={`tabular-nums text-accent-500`}>₹{amount.toLocaleString("en-IN")}</span>
        </h1>
        <button
          onClick={() => step(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-accent-300 hover:text-accent-500"
          aria-label="Increase amount"
        >
          <Plus size={16} />
        </button>
      </div>

      <p className="text-body text-neutral-500">
        {loading || !preview ? (
          <span className="inline-block h-[1em] w-40 animate-pulse rounded bg-neutral-200 align-middle" />
        ) : isTop ? (
          <>That takes the top spot{label}.</>
        ) : (
          <>
            That&apos;s rank #{preview.rank} of {preview.total}
            {label}.
          </>
        )}
      </p>

      <div className="flex w-full max-w-xl flex-col items-center gap-2.5 sm:flex-row">
        <div className="relative flex h-12 flex-1 items-center gap-2.5 rounded-full border border-neutral-200 bg-surface px-4 shadow-xs transition-shadow focus-within:ring-2 focus-within:ring-accent-300">
          <Globe size={18} className="shrink-0 text-neutral-400" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your product URL or @handle"
            className="text-body h-full w-full bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400"
          />
        </div>

        <Link
          href={claimHref}
          className="flex h-12 shrink-0 items-center justify-center rounded-full bg-accent-500 px-7 text-body font-bold text-white shadow-xs transition-colors hover:bg-accent-400"
        >
          Claim rank
        </Link>
      </div>
    </section>
  );
}
