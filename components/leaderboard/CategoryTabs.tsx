"use client";

import { Category } from "@/lib/mock-data";
import { categoryIcons } from "@/lib/category-icons";

export function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: Category[];
  active: string;
  onChange: (slug: string) => void;
}) {
  const tabs = [{ slug: "all", title: "All" }, ...categories];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.slug === active;
        const Icon = categoryIcons[tab.slug];
        return (
          <button
            key={tab.slug}
            onClick={() => onChange(tab.slug)}
            className={`text-body flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold transition-colors ${
              isActive
                ? "bg-accent-500 text-white"
                : "bg-surface text-neutral-700 hover:bg-accent-50 dark:ring-1 dark:ring-white/5"
            }`}
          >
            {Icon && <Icon size={14} />}
            {tab.title}
          </button>
        );
      })}
    </div>
  );
}
