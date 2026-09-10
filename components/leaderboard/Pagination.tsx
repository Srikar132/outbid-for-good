import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageWindow } from "@/lib/pagination";
import { pageHref, Scope } from "@/lib/scope";

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
 */
export function Pagination({
  page,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  scope,
  q,
}: {
  page: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  scope: Scope;
  q?: string;
}) {
  if (total === 0) return null;

  const caption = `${rangeStart.toLocaleString("en-IN")} – ${rangeEnd.toLocaleString(
    "en-IN"
  )} of ${total.toLocaleString("en-IN")}`;

  return (
    <nav
      aria-label="Leaderboard pagination"
      className="flex flex-col items-center gap-2 pt-4"
    >
      {totalPages > 1 && (
        <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          <Arrow
            direction="prev"
            href={page > 1 ? pageHref(page - 1, scope, q) : undefined}
          />

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
                    href={pageHref(entry, scope, q)}
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
            href={page < totalPages ? pageHref(page + 1, scope, q) : undefined}
          />
        </ul>
      )}

      <p className="text-small text-neutral-500 tabular-nums">{caption}</p>
    </nav>
  );
}
