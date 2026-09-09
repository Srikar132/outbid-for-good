import Image from "next/image";
import { SiteConfigResult } from "@/sanity/lib/data";

/**
 * Local fallback used only when siteConfig.heroImage is unset in Studio.
 * Drop a file in public/ and point this at it, e.g. "/hero-river.jpg".
 * Set to null to render nothing until Sanity has an image.
 */
const FALLBACK_HERO_SRC: string | null = "/bhopal-image.jpeg";
const FALLBACK_HERO_ALT = "Volunteers clearing waste from the river";

/**
 * Home page hero card: a wide photo of the cause with an optional badge and
 * an optional impact stat overlaid at the bottom.
 *
 * Every piece is independently optional and comes from Studio — nothing here
 * is hardcoded. That matters twice over: the creator partnership is still
 * unconfirmed (AGENTS.md §12), and the stat and chips are claims a donor
 * reads as promises about where their money goes. An empty field renders
 * nothing rather than a placeholder, so the card can never assert something
 * that hasn't been deliberately entered.
 */
export function CauseHero({ siteConfig }: { siteConfig: SiteConfigResult | null }) {
  const src = siteConfig?.heroImageUrl ?? FALLBACK_HERO_SRC;
  if (!src) return null;

  const alt = siteConfig?.heroImageAlt ?? FALLBACK_HERO_ALT;
  const badge = siteConfig?.heroBadge?.trim();
  const statValue = siteConfig?.heroStatValue?.trim();
  const statCaption = siteConfig?.heroStatCaption?.trim();
  const chips = (siteConfig?.heroChips ?? []).map((c) => c.trim()).filter(Boolean);
  const hasOverlay = !!statValue || !!statCaption || chips.length > 0;

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-md">
      {/* Fixed aspect ratio rather than a fixed height: the card keeps its
          shape from 360px to desktop without the image being letterboxed.
          Taller on mobile so the subject survives the narrower crop. */}
      <div className="relative aspect-[4/3] w-full sm:aspect-[21/9]">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />

        {/* Scrim only behind the overlay, so the photo stays clean up top. */}
        {hasOverlay && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent"
          />
        )}

        {badge && (
          <span className="text-small absolute left-3 top-3 rounded-full bg-accent-500 px-3 py-1 font-bold uppercase tracking-wide text-white shadow-sm sm:left-4 sm:top-4">
            {badge}
          </span>
        )}
      </div>

      {hasOverlay && (
        <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2 rounded-xl bg-surface/95 p-3 backdrop-blur-sm sm:inset-x-4 sm:bottom-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
          {(statValue || statCaption) && (
            <div className="min-w-0">
              {statValue && (
                <p className="text-body-lg truncate font-bold text-neutral-900">{statValue}</p>
              )}
              {statCaption && (
                <p className="text-small truncate text-neutral-500">{statCaption}</p>
              )}
            </div>
          )}

          {chips.length > 0 && (
            <ul className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="text-small rounded-full bg-pill-bg px-2.5 py-1 font-medium text-neutral-700"
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
