"use client";

import { useState } from "react";
import { Minus, Plus, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Category } from "@/lib/mock-data";
import { categoryIcons } from "@/lib/category-icons";

export function ClaimBand({
  nextMinBid,
  minimumIncrement,
  categories,
}: {
  nextMinBid: number;
  minimumIncrement: number;
  categories: Category[];
}) {
  const [amount, setAmount] = useState(nextMinBid);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [open, setOpen] = useState(false);

  const step = (dir: 1 | -1) => {
    setAmount((prev) => Math.max(nextMinBid, prev + dir * minimumIncrement));
  };

  const selected = categories.find((c) => c.slug === category);
  const SelectedIcon = categoryIcons[category];

  const claimHref = `/donate?amount=${amount}&category=${category}${
    name ? `&name=${encodeURIComponent(name)}` : ""
  }`;

  return (
    <section className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex items-center gap-3">
        <button
          onClick={() => step(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-500 transition-colors hover:bg-accent-200"
          aria-label="Decrease amount"
        >
          <Minus size={16} />
        </button>
        <h1 className="text-display text-neutral-900">
          Claim #1 for <span className="text-accent-500">₹{amount.toLocaleString("en-IN")}</span>
        </h1>
        <button
          onClick={() => step(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-500 transition-colors hover:bg-accent-200"
          aria-label="Increase amount"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="relative flex w-full max-w-2xl flex-col gap-2 rounded-full bg-surface p-1.5 shadow-md sm:flex-row sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name or brand"
          className="text-body h-11 flex-1 rounded-full px-4 outline-none"
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-body flex h-11 items-center gap-2 rounded-full bg-neutral-100 px-4 text-neutral-700 sm:bg-transparent"
          >
            {SelectedIcon && <SelectedIcon size={16} className="text-neutral-500" />}
            {selected?.title ?? "Category"}
            <ChevronDown size={14} className="text-neutral-400" />
          </button>

          {open && (
            <>
              <button
                type="button"
                aria-hidden
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <ul className="text-body absolute left-0 top-full z-20 mt-2 w-56 rounded-lg bg-surface p-2 text-left shadow-lg">
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
          className="flex h-11 items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-400"
        >
          Claim Rank
        </Link>
      </div>
    </section>
  );
}
