import { CategoryResult } from "@/sanity/lib/data";

export type Scope = {
  categorySlug?: string;
  today?: boolean;
};

export function scopeLabel(scope: Scope, categories: CategoryResult[]) {
  const categoryTitle = scope.categorySlug
    ? categories.find((c) => c.slug === scope.categorySlug)?.title
    : undefined;

  if (categoryTitle && scope.today) return ` in ${categoryTitle} today`;
  if (categoryTitle) return ` in ${categoryTitle}`;
  if (scope.today) return " today";
  return "";
}

function withQuery(href: string, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${href}?${qs}` : href;
}

export function categoryTabHref(slug: string, current: Scope, q?: string) {
  if (slug === "all") {
    return withQuery(current.today ? "/today" : "/", { q });
  }
  return withQuery(`/category/${slug}`, { today: current.today ? "true" : undefined, q });
}

export function parseScope(params: {
  category?: string;
  today?: string;
}): Scope {
  return {
    categorySlug: params.category || undefined,
    today: params.today === "true",
  };
}

export function viewToggleHref(mode: "all-time" | "today", current: Scope, q?: string) {
  if (mode === "today") {
    return withQuery(current.categorySlug ? `/category/${current.categorySlug}` : "/today", {
      today: current.categorySlug ? "true" : undefined,
      q,
    });
  }
  return withQuery(current.categorySlug ? `/category/${current.categorySlug}` : "/", { q });
}
