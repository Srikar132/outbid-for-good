// Leaderboard paging math. Slicing happens here, in memory, downstream of
// filterEntries — the GROQ query still returns the full amount-desc list so
// the server-side outbid floor in app/donate/actions.ts keeps seeing every
// entry. Nothing in this module may be used to derive a bid amount.

export const PAGE_SIZE = 50;

/**
 * Reads ?page. Anything that isn't a positive integer falls back to 1, so a
 * hand-typed or stale URL degrades instead of erroring. Repeated params
 * (?page=1&page=2) take the last value, matching URLSearchParams.get order.
 */
export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[raw.length - 1] : raw;
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export type PageResult<T> = {
  items: T[];
  /** Clamped to [1, totalPages] — may differ from what the URL asked for. */
  page: number;
  totalPages: number;
  total: number;
  startIndex: number;
  /** 1-based, for the "1 – 50 of 2,841" caption. Both 0 when total is 0. */
  rangeStart: number;
  rangeEnd: number;
};

/**
 * Clamps rather than 404s on an out-of-range page. SanityLive re-renders these
 * server components on every mutation, so the board can shrink between render
 * and click — a 404 on a link the page itself just drew would be a real
 * failure mode, not a typo.
 */
export function paginate<T>(entries: T[], requestedPage: number): PageResult<T> {
  const total = entries.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const items = entries.slice(startIndex, startIndex + PAGE_SIZE);

  return {
    items,
    page,
    totalPages,
    total,
    startIndex,
    rangeStart: total === 0 ? 0 : startIndex + 1,
    rangeEnd: startIndex + items.length,
  };
}

export type PageSlot = number | "gap-left" | "gap-right";

/**
 * Page numbers to render, at most 7 slots so the control still fits one line
 * at 360px. The two gaps are distinct values because both can appear at once
 * and a shared marker would collide as a React key.
 */
export function pageWindow(page: number, totalPages: number): PageSlot[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (page <= 3) {
    return [1, 2, 3, 4, "gap-right", totalPages];
  }
  if (page >= totalPages - 2) {
    return [1, "gap-left", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "gap-left", page - 1, page, page + 1, "gap-right", totalPages];
}
