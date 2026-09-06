import { CategoryResult, LeaderboardEntryResult } from "@/sanity/lib/data";
import { Scope } from "@/lib/scope";
import { CategoryTabs } from "./CategoryTabs";
import { ViewToggle } from "./ViewToggle";
import { LeaderboardList } from "./LeaderboardList";

export function LeaderboardSection({
  entries,
  categories,
  scope,
  q,
}: {
  entries: LeaderboardEntryResult[];
  categories: CategoryResult[];
  scope: Scope;
  q?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CategoryTabs categories={categories} scope={scope} q={q} />
        <ViewToggle scope={scope} q={q} />
      </div>
      <LeaderboardList entries={entries} />
    </div>
  );
}
