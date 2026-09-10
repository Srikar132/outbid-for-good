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
  if (scope.today) return " in all categories today";
  return " in all categories";
}

function withQuery(href: string, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${href}?${qs}` : href;
}

// The route a scope lives at, plus the `today` param that only category
// routes carry (/today encodes it in the path instead). Shared so pageHref
// can't drift from the tab and toggle links.
function scopeBase(current: Scope) {
  if (current.categorySlug) {
    return {
      href: `/category/${current.categorySlug}`,
      today: current.today ? "true" : undefined,
    };
  }
  return { href: current.today ? "/today" : "/", today: undefined };
}

export function categoryTabHref(slug: string, current: Scope, q?: string) {
  if (slug === "all") {
    return withQuery(current.today ? "/today" : "/", { q });
  }
  return withQuery(`/category/${slug}`, { today: current.today ? "true" : undefined, q });
}

/**
 * Page 1 is the bare URL (no ?page=1) so the canonical address of the board
 * stays "/". Deliberately kept separate from categoryTabHref/viewToggleHref:
 * those build their URLs from scratch and so drop `page` by construction,
 * which is exactly how changing category or view resets to page 1.
 */
export function pageHref(page: number, current: Scope, q?: string) {
  const { href, today } = scopeBase(current);
  return withQuery(href, { today, q, page: page > 1 ? String(page) : undefined });
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
