"use client";

import { Crown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBox } from "./SearchBox";

const LINKS = [
  { href: "/daily", label: "Daily" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
  { href: "#cause", label: "Our Cause" },
];

export function Nav({
  stats,
}: {
  stats?: { totalRaised: number; donorCount: number };
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLeaderboardRoute =
    pathname === "/" || pathname === "/today" || pathname.startsWith("/category/");
  const analyticsUrl = process.env.NEXT_PUBLIC_POSTHOG_DASHBOARD_URL;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const statsLabel = stats
    ? `₹${stats.totalRaised.toLocaleString("en-IN")} raised · ${stats.donorCount} donors`
    : null;

  const statsPill = statsLabel ? (
    <>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
      <span className="truncate">{statsLabel}</span>
    </>
  ) : null;

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Crown size={20} className="text-accent-500" fill="currentColor" />
          <span className="text-h3 text-neutral-900">OUTBID</span>
        </Link>

        {/* Stats and the full link row are desktop-only. At 360px the four
            labels plus the logo and controls overflow the viewport, which is
            what the hamburger below exists to solve. */}
        {statsLabel &&
          (analyticsUrl ? (
            <Link
              href={analyticsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-small hidden min-w-0 shrink items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-neutral-500 shadow-sm transition-colors lg:inline-flex hover:bg-neutral-100 dark:ring-1 dark:ring-white/5"
            >
              {statsPill}
            </Link>
          ) : (
            <span className="text-small hidden min-w-0 shrink items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-neutral-500 shadow-sm lg:inline-flex dark:ring-1 dark:ring-white/5">
              {statsPill}
            </span>
          ))}

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="hidden items-center gap-0.5 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-body flex h-9 items-center whitespace-nowrap rounded-full px-3 text-neutral-700 transition-colors hover:bg-neutral-100"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Suspense fallback={<div className="h-9 w-9" />}>
            {isLeaderboardRoute && <SearchBox />}
          </Suspense>
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-neutral-200 bg-cream md:hidden">
          <ul className="mx-auto flex w-full max-w-5xl flex-col px-4 py-2 sm:px-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-body flex h-11 items-center rounded-lg px-2 text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {statsLabel && (
              <li className="text-small flex items-center gap-1.5 border-t border-neutral-200 px-2 py-3 text-neutral-500">
                {statsPill}
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
