"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Category, LeaderboardEntry } from "@/lib/mock-data";
import { CategoryTabs } from "./CategoryTabs";
import { ViewToggle, ViewMode } from "./ViewToggle";
import { LeaderboardList } from "./LeaderboardList";

const DAY_MS = 24 * 60 * 60 * 1000;

export function LeaderboardSection({
  entries,
  categories,
}: {
  entries: LeaderboardEntry[];
  categories: Category[];
}) {
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<ViewMode>("all-time");
  const [now] = useState(() => Date.now());
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const filtered = useMemo(() => {
    return entries
      .filter((e) => category === "all" || e.categorySlug === category)
      .filter((e) => {
        if (view === "all-time") return true;
        return now - new Date(e.confirmedAt).getTime() <= DAY_MS;
      })
      .filter((e) => {
        if (!query) return true;
        const haystack = `${e.displayName} ${e.companyName ?? ""}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => b.amount - a.amount);
  }, [entries, category, view, now, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CategoryTabs categories={categories} active={category} onChange={setCategory} />
        <ViewToggle value={view} onChange={setView} />
      </div>
      <LeaderboardList entries={filtered} />
    </div>
  );
}
