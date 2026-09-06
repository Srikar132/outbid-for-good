"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { DonationInput } from "../ui/DonationInput";

export function DonateForm({
  currentTop,
  minimumIncrement,
  initialName = "",
  initialAmount,
}: {
  currentTop: number;
  minimumIncrement: number;
  initialName?: string;
  initialAmount?: number;
}) {
  const [name, setName] = useState(initialName);
  const [company, setCompany] = useState("");
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : "");

  const minRequired = currentTop + minimumIncrement;
  const parsedAmount = Number(amount.replace(/[^0-9]/g, ""));
  const hasAmount = amount.trim().length > 0;
  const isValid = hasAmount && parsedAmount >= minRequired;

  return (
    <div className="rounded-lg bg-surface p-5 shadow-sm">
      <p className="text-h3 text-neutral-900">Outbid & Donate</p>
      <p className="text-body mt-1 text-neutral-500">
        Beat the current top of ₹{currentTop.toLocaleString("en-IN")} to take
        #1. Payment isn&apos;t wired up yet — this is a preview of the form.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <label className="text-small font-semibold text-neutral-700">
          Display Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-body mt-1 block h-11 w-full rounded-md border border-neutral-200 px-3 outline-none focus:border-primary-400"
            placeholder="How you'll appear on the leaderboard"
          />
        </label>

        <label className="text-small font-semibold text-neutral-700">
          Company (optional)
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="text-body mt-1 block h-11 w-full rounded-md border border-neutral-200 px-3 outline-none focus:border-primary-400"
            placeholder="Company or brand name"
          />
        </label>

        <DonationInput
          value={amount}
          onChange={setAmount}
          placeholder={`${minRequired.toLocaleString("en-IN")}`}
          state={!hasAmount ? "default" : isValid ? "success" : "error"}
          helperText={
            !hasAmount
              ? `Must be higher than current top (₹${currentTop.toLocaleString("en-IN")})`
              : isValid
              ? "Looks good! You can take #1."
              : `Enter an amount higher than ₹${minRequired.toLocaleString("en-IN")}`
          }
        />
      </div>

      <Button
        variant="primary"
        className="mt-4 w-full"
        disabled={!isValid || name.trim().length === 0}
      >
        Continue (coming soon)
      </Button>
    </div>
  );
}
