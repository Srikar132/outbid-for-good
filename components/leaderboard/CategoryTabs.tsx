import Link from "next/link";
import { CategoryResult } from "@/sanity/lib/data";
import { categoryIcons } from "@/lib/category-icons";
import { Scope, categoryTabHref } from "@/lib/scope";

export function CategoryTabs({
  categories,
  scope,
  q,
}: {
  categories: CategoryResult[];
  scope: Scope;
  q?: string;
}) {
  const active = scope.categorySlug ?? "all";
  const tabs = [{ slug: "all", title: "All" }, ...categories];

  return (
    <div className="flex max-w-full overflow-x-auto rounded-full bg-pill-bg p-1.5 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = tab.slug === active;
        const Icon = categoryIcons[tab.slug];
        return (
          <Link
            key={tab.slug}
            href={categoryTabHref(tab.slug, scope, q)}
            className={`text-body shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 font-semibold transition-colors ${
              isActive
                ? "bg-accent-500 text-white shadow-sm"
                : "text-neutral-700 hover:text-accent-500"
            }`}
          >
            {Icon && <Icon size={14} />}
            {tab.title}
          </Link>
        );
      })}
    </div>
  );
}
