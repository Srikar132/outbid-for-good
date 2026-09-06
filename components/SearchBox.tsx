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
    <div className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-1 bg-cream px-4 shadow-sm sm:static sm:z-auto sm:h-9 sm:flex-none sm:rounded-full sm:bg-surface sm:px-0 sm:pl-3 sm:pr-1 sm:shadow-sm sm:transition-shadow sm:focus-within:ring-2 sm:focus-within:ring-accent-300">
      <Search size={14} className="shrink-0 text-neutral-500" />
      <input
        autoFocus
        value={value}
        onChange={(e) => applyQuery(e.target.value)}
        placeholder="Search donors..."
        className="text-small h-full min-w-0 flex-1 bg-transparent text-neutral-900 outline-none placeholder:text-neutral-500 sm:w-44 sm:flex-none"
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
