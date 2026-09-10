"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Globe, Minus, Plus, AtSign } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { CategoryResult } from "@/sanity/lib/data";
import { categoryIcons } from "@/lib/category-icons";
import { Scope, scopeLabel } from "@/lib/scope";
import { faviconUrlFor, parseIdentity } from "@/lib/identity";
import { ViewToggle } from "./ViewToggle";

type RankPreview = { rank: number; total: number };
type ExistingEntry = { exists: false } | { exists: true; displayName: string; amount: number };

export function ClaimBand({
  scope,
  scopeTopAmount,
  minimumIncrement,
  categories,
  q,
}: {
  scope: Scope;
  scopeTopAmount: number;
  minimumIncrement: number;
  categories: CategoryResult[];
  q?: string;
}) {
  const claimAmount = scopeTopAmount + minimumIncrement;
  const label = scopeLabel(scope, categories);

  const categoryLocked = !!scope.categorySlug;

  const [amountText, setAmountText] = useState(String(claimAmount));
  const amount = parseInt(amountText, 10) || 0;
  const [identityInput, setIdentityInput] = useState("");
  const [category, setCategory] = useState(scope.categorySlug ?? "");
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<RankPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<ExistingEntry>({ exists: false });
  const lookupRequestId = useRef(0);
  const amountMirrorRef = useRef<HTMLSpanElement>(null);
  const [amountInputWidth, setAmountInputWidth] = useState(0);

  useLayoutEffect(() => {
    if (amountMirrorRef.current) {
      setAmountInputWidth(amountMirrorRef.current.offsetWidth);
    }
  }, [amountText]);

  const step = (dir: 1 | -1) => {
    const next = Math.max(minimumIncrement, amount + dir * minimumIncrement);
    setAmountText(String(next));
    posthog.capture("claim_amount_adjusted", {
      direction: dir === 1 ? "increase" : "decrease",
      new_amount: next,
      scope_category: scope.categorySlug ?? null,
      scope_today: !!scope.today,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountText(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleAmountBlur = () => {
    const clamped = Math.max(1, amount);
    if (clamped !== amount) {
      posthog.capture("claim_amount_adjusted", {
        direction: "manual",
        new_amount: clamped,
        scope_category: scope.categorySlug ?? null,
        scope_today: !!scope.today,
      });
    }
    setAmountText(String(clamped));
  };

  const identity = parseIdentity(identityInput);

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

  const identityUrl = identity?.url;

  useEffect(() => {
    if (!identityUrl) return;

    const requestId = ++lookupRequestId.current;
    const timeout = setTimeout(() => {
      fetch(`/api/entry-lookup?url=${encodeURIComponent(identityUrl)}`)
        .then((res) => res.json())
        .then((data: ExistingEntry) => {
          if (lookupRequestId.current === requestId) setExisting(data);
        });
    }, 300);

    return () => clearTimeout(timeout);
  }, [identityUrl]);

  const reclaiming = !!identity && existing.exists;

  const selected = categories.find((c) => c.slug === category);
  const SelectedIcon = categoryIcons[category];
  const isTop = !loading && preview?.rank === 1;

  const claimHref = `/donate?amount=${amount}&category=${category}${
    scope.categorySlug ? `&scopeCategory=${scope.categorySlug}` : ""
  }${scope.today ? "&today=true" : ""}${
    identity ? `&url=${encodeURIComponent(identity.url)}` : ""
  }`;

  return (
    <section className="flex flex-col items-center gap-4 py-8 text-center">
      <ViewToggle scope={scope} q={q} />

      <div className="flex flex-col items-center gap-1">
        <h1 className="text-display text-neutral-900">Claim #1{label} for</h1>
        {/* The amount input is sized in inline px from a mirror span, so it
            cannot shrink on its own. Wrap + min-w-0 keep a long amount from
            pushing the +/- buttons off a 360px screen. */}
        <div className="flex w-full flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => step(-1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-accent-300 hover:text-accent-500"
            aria-label="Decrease amount"
          >
            <Minus size={16} />
          </button>
          <span className="text-display relative inline-flex min-w-0 items-baseline text-accent-500 dark:text-neutral-900">
            ₹
            <span
              ref={amountMirrorRef}
              aria-hidden
              className="tabular-nums text-display pointer-events-none absolute -z-10 whitespace-pre opacity-0"
            >
              {amountText || "0"}
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amountText}
              onChange={handleAmountChange}
              onFocus={(e) => e.target.select()}
              onBlur={handleAmountBlur}
              aria-label="Bid amount in rupees"
              className="tabular-nums text-display max-w-full min-w-0 border-b-2 border-dashed border-accent-200 bg-transparent text-accent-500 outline-none focus:border-accent-500 dark:border-neutral-300 dark:text-neutral-900 dark:focus:border-neutral-500"
              style={{ width: amountInputWidth ? `${amountInputWidth + 3}px` : "1ch" }}
            />
          </span>
          <button
            onClick={() => step(1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-accent-300 hover:text-accent-500"
            aria-label="Increase amount"
          >
            <Plus size={16} />
          </button>
        </div>
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
        {reclaiming && existing.exists && (
          <>
            {" "}Already on the board as {existing.displayName} at ₹
            {existing.amount.toLocaleString("en-IN")}.
          </>
        )}
      </p>

      <div className="flex w-full max-w-2xl flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <div className="flex w-full min-w-0 items-center gap-1.5 rounded-full bg-surface p-1.5 shadow-md transition-shadow focus-within:ring-2 focus-within:ring-accent-300 sm:flex-1 dark:ring-1 dark:ring-white/5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-neutral-500">
            {identity ? (
              identity.kind === "handle" ? (
                <AtSign size={14} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={faviconUrlFor(identity.url)} alt="" className="h-4 w-4" />
              )
            ) : (
              <Globe size={14} />
            )}
          </span>

          <input
            value={identityInput}
            onChange={(e) => setIdentityInput(e.target.value)}
            placeholder="URL or @handle"
            className="text-body h-9 min-w-0 flex-1 bg-transparent px-1 text-neutral-900 outline-none"
          />
        </div>

        <div className="relative w-full shrink-0 sm:w-auto">
          <button
            type="button"
            onClick={() => !categoryLocked && setOpen((v) => !v)}
            aria-label={
              categoryLocked
                ? `Category: ${selected?.title ?? category}`
                : `Category: ${selected?.title ?? "choose one"}`
            }
            disabled={categoryLocked}
            className="text-body flex h-12 w-full items-center gap-2 rounded-full bg-surface px-4 font-medium text-neutral-700 shadow-md transition-colors enabled:hover:bg-neutral-50 disabled:cursor-default sm:w-auto dark:ring-1 dark:ring-white/5"
          >
            {SelectedIcon && <SelectedIcon size={16} className="shrink-0 text-neutral-500" />}
            <span className="min-w-0 flex-1 truncate text-left sm:flex-none">
              {selected?.title ?? "Choose a category"}
            </span>
            {!categoryLocked && (
              <ChevronDown size={16} className="shrink-0 text-neutral-400" />
            )}
          </button>

          {open && !categoryLocked && (
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

        <Link
          href={claimHref}
          aria-disabled={!category}
          onClick={(e) => {
            if (!category) {
              e.preventDefault();
              setOpen(true);
              return;
            }
            posthog.capture("claim_rank_clicked", {
              amount,
              category,
              scope_category: scope.categorySlug ?? null,
              scope_today: !!scope.today,
              is_reclaim: reclaiming,
              projected_rank: preview?.rank ?? null,
            });
          }}
          className={`flex h-12 w-full shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold text-white shadow-md transition-colors sm:w-auto ${
            category ? "bg-accent-500 hover:bg-accent-400" : "bg-accent-300"
          }`}
        >
          {reclaiming ? "Reclaim rank" : "Claim rank"}
        </Link>
      </div>
    </section>
  );
}
