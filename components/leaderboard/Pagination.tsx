import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageWindow } from "@/lib/pagination";

const slot =
  "text-small flex h-10 min-w-10 items-center justify-center rounded-full px-2 tabular-nums transition-colors";

function Arrow({
  direction,
  href,
}: {
  direction: "prev" | "next";
  href?: string;
}) {
  const label = direction === "prev" ? "Previous page" : "Next page";
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  // A disabled anchor doesn't exist in HTML, so the unavailable end renders as
  // a span — it stays out of the tab order instead of being a focusable no-op.
  if (!href) {
    return (
      <li>
        <span
          aria-disabled="true"
          aria-label={label}
          className={`${slot} pointer-events-none text-neutral-500 opacity-40`}
        >
          <Icon size={16} />
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        rel={direction}
        aria-label={label}
        className={`${slot} text-neutral-700 hover:bg-pill-bg hover:text-accent-500`}
      >
        <Icon size={16} />
      </Link>
    </li>
  );
}

/**
 * Server component — plain links, no client state, matching CategoryTabs and
 * ViewToggle. Next's default scroll-to-top is left on: unlike SearchBox's
 * in-place replace, landing at the top of a fresh page is what's expected.
 *
 * `hrefFor` keeps this route-agnostic — the leaderboard passes a scope-aware
 * builder, the daily pages pass their own.
 */
export function Pagination({
  page,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  hrefFor,
  unit = "",
}: {
  page: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  hrefFor: (page: number) => string;
  /** Appended to the caption, e.g. "days" → "1 – 15 of 92 days". */
  unit?: string;
}) {
  if (total === 0) return null;

  const suffix = unit ? ` ${unit}` : "";
  const caption = `${rangeStart.toLocaleString("en-IN")} – ${rangeEnd.toLocaleString(
    "en-IN"
  )} of ${total.toLocaleString("en-IN")}${suffix}`;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center gap-2 pt-4"
    >
      {totalPages > 1 && (
        <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          <Arrow direction="prev" href={page > 1 ? hrefFor(page - 1) : undefined} />

          {pageWindow(page, totalPages).map((entry) =>
            typeof entry === "number" ? (
              <li key={entry}>
                {entry === page ? (
                  <span
                    aria-current="page"
                    className={`${slot} bg-accent-500 font-bold text-white`}
                  >
                    {entry}
                  </span>
                ) : (
                  <Link
                    href={hrefFor(entry)}
                    aria-label={`Go to page ${entry}`}
                    className={`${slot} text-neutral-700 hover:bg-pill-bg hover:text-accent-500`}
                  >
                    {entry}
                  </Link>
                )}
              </li>
            ) : (
              <li key={entry}>
                <span aria-hidden="true" className={`${slot} text-neutral-500`}>
                  &hellip;
                </span>
              </li>
            )
          )}

          <Arrow
            direction="next"
            href={page < totalPages ? hrefFor(page + 1) : undefined}
          />
        </ul>
      )}

      <p className="text-small text-neutral-500 tabular-nums">{caption}</p>
    </nav>
  );
}
