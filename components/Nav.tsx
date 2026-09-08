"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBox } from "./SearchBox";

export function Nav({
  stats,
}: {
  stats?: { totalRaised: number; donorCount: number };
}) {
  const pathname = usePathname();
  const isLeaderboardRoute =
    pathname === "/" || pathname === "/today" || pathname.startsWith("/category/");
  const analyticsUrl = process.env.NEXT_PUBLIC_POSTHOG_DASHBOARD_URL;

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl flex-nowrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Crown size={20} className="text-accent-500" fill="currentColor" />
          <span className="text-h3 text-neutral-900">OUTBID</span>
        </Link>
        {stats &&
          (analyticsUrl ? (
            <Link
              href={analyticsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-small hidden shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-neutral-500 shadow-sm transition-colors sm:inline-flex hover:bg-neutral-100 dark:ring-1 dark:ring-white/5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />₹
              {stats.totalRaised.toLocaleString("en-IN")} raised &middot;{" "}
              {stats.donorCount} donors
            </Link>
          ) : (
            <span className="text-small hidden shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-neutral-500 shadow-sm sm:inline-flex dark:ring-1 dark:ring-white/5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />₹
              {stats.totalRaised.toLocaleString("en-IN")} raised &middot;{" "}
              {stats.donorCount} donors
            </span>
          ))}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <Link
            href="/about"
            className="text-body flex h-9 items-center whitespace-nowrap rounded-full px-2 text-neutral-700 transition-colors hover:bg-neutral-100 sm:px-3"
          >
            About
          </Link>
          <Link
            href="#cause"
            className="text-body hidden h-9 items-center whitespace-nowrap rounded-full px-3 text-neutral-700 transition-colors hover:bg-neutral-100 sm:flex"
          >
            Our Cause
          </Link>
          <Suspense fallback={<div className="h-9 w-9" />}>
            {isLeaderboardRoute && <SearchBox />}
          </Suspense>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
