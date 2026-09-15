"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  { href: "/#cause", label: "Our Cause" },
];

/* Motion is deliberately short and small — this is a donation site, so the
   menu should feel responsive rather than showy. `reduceMotion` collapses every
   positional move and the stagger down to a plain opacity fade. */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = (reduceMotion: boolean) => ({
  hidden: { opacity: 0, y: reduceMotion ? 0 : -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1] as const,
      // Closing should feel instant, so only the open direction staggers.
      staggerChildren: reduceMotion ? 0 : 0.035,
      delayChildren: reduceMotion ? 0 : 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: reduceMotion ? 0 : -8,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const },
  },
});

const linkVariants = (reduceMotion: boolean) => ({
  hidden: { opacity: 0, y: reduceMotion ? 0 : -4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
});

const iconVariants = (reduceMotion: boolean) => ({
  hidden: { opacity: 0, rotate: reduceMotion ? 0 : -90, scale: reduceMotion ? 1 : 0.8 },
  visible: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: reduceMotion ? 0 : 90, scale: reduceMotion ? 1 : 0.8 },
});

export function Nav({
  stats,
}: {
  stats?: { totalRaised: number; donorCount: number };
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const isLeaderboardRoute =
    pathname === "/" || pathname === "/today" || pathname.startsWith("/category/");
  const analyticsUrl = process.env.NEXT_PUBLIC_POSTHOG_DASHBOARD_URL;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);

    // The menu overlays the page, so the page behind it must not scroll.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
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
      <nav className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-8">
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
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 md:hidden"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={menuOpen ? "close" : "open"}
                variants={iconVariants(!!reduceMotion)}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* AnimatePresence plays the exit animation before unmounting, so a closed
          menu is simply absent from the DOM — no `invisible` / tabIndex={-1}
          workaround needed to keep it out of the tab order. */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* z-10 sits below the nav bar's z-20, so the bar stays visible and
                the close button stays tappable while the page behind dims. */}
            <motion.div
              key="backdrop"
              aria-hidden
              onClick={() => setMenuOpen(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-10 bg-neutral-900/40 md:hidden"
            />
            <motion.div
              key="panel"
              id="mobile-menu"
              variants={panelVariants(!!reduceMotion)}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-x-0 top-full z-20 max-h-[calc(100dvh-4rem)] origin-top overflow-y-auto border-b border-neutral-200 bg-cream shadow-lg md:hidden"
            >
              <ul className="mx-auto flex w-full max-w-5xl flex-col px-4 py-2 sm:px-8">
                {LINKS.map((link) => (
                  <motion.li key={link.href} variants={linkVariants(!!reduceMotion)}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-body flex h-11 items-center rounded-lg px-2 text-neutral-700 transition-colors hover:bg-neutral-100"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
                {statsLabel && (
                  <motion.li
                    variants={linkVariants(!!reduceMotion)}
                    className="text-small flex items-center gap-1.5 border-t border-neutral-200 px-2 py-3 text-neutral-500"
                  >
                    {statsPill}
                  </motion.li>
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </header>
  );
}
