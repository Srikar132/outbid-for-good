import { CategoryResult, LeaderboardEntryResult } from "@/sanity/lib/data";
import { Scope } from "@/lib/scope";
import { paginate } from "@/lib/pagination";
import { CategoryTabs } from "./CategoryTabs";
import { ViewToggle } from "./ViewToggle";
import { LeaderboardList } from "./LeaderboardList";
import { Pagination } from "./Pagination";

export function LeaderboardSection({
  entries,
  categories,
  scope,
  q,
  page,
  rankById,
  todayEntries,
}: {
  entries: LeaderboardEntryResult[];
  categories: CategoryResult[];
  scope: Scope;
  q?: string;
  page: number;
  rankById?: Map<string, number>;
  todayEntries?: LeaderboardEntryResult[];
}) {
  const pageData = paginate(entries, page);

  // Search results are a filtered subset, so their first three are not the
  // board's top three — showing them as podium cards would misrepresent them.
  // Flat rows carrying true ranks is the honest rendering.
  const showSections = pageData.page === 1 && !q?.trim();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CategoryTabs categories={categories} scope={scope} q={q} />
        <ViewToggle scope={scope} q={q} />
      </div>

      <LeaderboardList
        items={pageData.items}
        startIndex={pageData.startIndex}
        showSections={showSections}
        rankById={rankById}
        todayEntries={showSections ? todayEntries : undefined}
      />

      <Pagination
        page={pageData.page}
        totalPages={pageData.totalPages}
        total={pageData.total}
        rangeStart={pageData.rangeStart}
        rangeEnd={pageData.rangeEnd}
        scope={scope}
        q={q}
      />
    </div>
  );
}
