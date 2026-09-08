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

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200/50 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Crown size={22} className="text-accent-500" fill="currentColor" />
            <span className="text-h3 font-extrabold tracking-tight text-neutral-900">outbid.lol</span>
          </Link>
          {stats && (
            <span className="text-small hidden items-center gap-1.5 rounded-full border border-neutral-200/80 bg-surface px-3 py-1 text-neutral-700 shadow-2xs sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="font-semibold text-neutral-900">{stats.donorCount} online</span>
              <span className="text-neutral-400 font-normal">&middot;</span>
              <span>₹{stats.totalRaised.toLocaleString("en-IN")} raised</span>
              <span className="text-neutral-400 font-normal">&middot;</span>
              <span className="font-medium text-neutral-500">stats &rarr;</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="text-body font-medium text-neutral-700 hover:text-neutral-900">
            Daily
          </Link>
          <Link href="#cause" className="text-body font-medium text-neutral-700 hover:text-neutral-900">
            Categories
          </Link>
          <Link href="#cause" className="text-body font-medium text-neutral-700 hover:text-neutral-900">
            About
          </Link>
          <Link href="/rules" className="text-body font-medium text-neutral-700 hover:text-neutral-900">
            Rules
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
