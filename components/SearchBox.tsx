"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  const applyQuery = (next: string) => {
    setValue(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("q", next);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search leaderboard"
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
      >
        <Search size={18} />
      </button>
    );
  }

  return (
    <div className="flex h-9 items-center gap-1 rounded-full bg-surface pl-3 pr-1 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-accent-300">
      <Search size={14} className="text-neutral-500" />
      <input
        autoFocus
        value={value}
        onChange={(e) => applyQuery(e.target.value)}
        placeholder="Search donors..."
        className="text-small h-full w-32 bg-transparent text-neutral-900 outline-none placeholder:text-neutral-500 sm:w-44"
      />
      <button
        type="button"
        onClick={() => {
          applyQuery("");
          setOpen(false);
        }}
        aria-label="Close search"
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}
