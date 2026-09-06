"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { CategoryResult } from "@/sanity/lib/data";
import { categoryIcons } from "@/lib/category-icons";
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
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [open, setOpen] = useState(false);
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

  const selected = categories.find((c) => c.slug === category);
  const SelectedIcon = categoryIcons[category];
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

      <div className="relative flex w-full max-w-2xl items-center gap-1.5 rounded-full bg-surface p-1.5 shadow-md transition-shadow focus-within:ring-2 focus-within:ring-accent-300 dark:ring-1 dark:ring-white/5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={`Category: ${selected?.title ?? "choose one"}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
        >
          {SelectedIcon && <SelectedIcon size={16} />}
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name or brand"
          className="text-body h-11 flex-1 bg-transparent px-1 text-neutral-900 outline-none"
        />

        <Link
          href={claimHref}
          className="flex h-11 shrink-0 items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-400"
        >
          Claim rank
        </Link>

        {open && (
          <>
            <button
              type="button"
              aria-hidden
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <ul className="text-body absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border border-neutral-200 bg-surface p-2 text-left shadow-lg">
              {categories.map((c) => {
                const Icon = categoryIcons[c.slug];
                return (
                  <li key={c.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        setCategory(c.slug);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-neutral-700 hover:bg-accent-50"
                    >
                      {Icon && <Icon size={16} className="text-neutral-500" />}
                      {c.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
