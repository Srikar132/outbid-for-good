import Link from "next/link";
import { Compass } from "lucide-react";
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
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.slug === active;
        const Icon = categoryIcons[tab.slug];
        return (
          <Link
            key={tab.slug}
            href={categoryTabHref(tab.slug, scope, q)}
            className={`text-body flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold transition-colors ${
              isActive
                ? "bg-accent-500 text-white"
                : "bg-surface text-neutral-700 hover:bg-accent-50 dark:ring-1 dark:ring-white/5"
            }`}
          >
            {Icon && <Icon size={14} />}
            {tab.title}
          </Link>
        );
      })}
      <Link
        href="/categories"
        className="text-body flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 font-semibold text-neutral-700 transition-colors hover:bg-accent-50 dark:ring-1 dark:ring-white/5"
      >
        <Compass size={14} />
        Explore
      </Link>
    </div>
  );
}
