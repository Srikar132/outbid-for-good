import { AtSign } from "lucide-react";
import { LeaderboardEntryResult } from "@/sanity/lib/data";
import { categoryIcons } from "@/lib/category-icons";
import { faviconUrlFor, isHandleStyleUrl } from "@/lib/identity";

const logoTint: Record<string, string> = {
  individual: "bg-primary-100 text-primary-500",
  company: "bg-info/10 text-info",
  brand: "bg-accent-100 text-accent-500",
};

const sizes = {
  xs: { box: "h-6 w-6 rounded-md", img: "h-3.5 w-3.5", icon: 12 },
  sm: { box: "h-8 w-8 rounded-lg", img: "h-4 w-4", icon: 14 },
  md: { box: "h-10 w-10 rounded-xl sm:h-11 sm:w-11", img: "h-5 w-5", icon: 18 },
  lg: { box: "h-12 w-12 rounded-xl sm:h-14 sm:w-14", img: "h-6 w-6 sm:h-7 sm:w-7", icon: 22 },
} as const;

export type AvatarSize = keyof typeof sizes;

/**
 * The entry's identity mark. Single source of truth for the favicon → @ →
 * category-icon → initial fallback chain, so the three call sites (hero card,
 * compact row, today strip) can't drift apart.
 *
 * Renders a plain <div>; callers own the click-through anchor, because the
 * today strip wraps its whole card in one and nesting <a> inside <a> is
 * invalid (see prompts/fix-leaderboard-list-hydration-nesting.md).
 */
export function EntryAvatar({
  entry,
  size = "md",
}: {
  entry: LeaderboardEntryResult;
  size?: AvatarSize;
}) {
  const { box, img, icon } = sizes[size];
  const CategoryIcon = categoryIcons[entry.category.slug];
  const name = entry.companyName ?? entry.displayName;

  return (
    <div className={`${box} shrink-0 overflow-hidden shadow-2xs`}>
      <div
        className={`flex h-full w-full items-center justify-center ${
          logoTint[entry.category.slug] ?? "bg-neutral-900 text-white"
        }`}
      >
        {entry.url && isHandleStyleUrl(entry.url) ? (
          <AtSign size={icon} />
        ) : entry.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faviconUrlFor(entry.url)} alt="" className={img} />
        ) : CategoryIcon ? (
          <CategoryIcon size={icon} />
        ) : (
          <span className="text-small font-bold">{name.charAt(0)}</span>
        )}
      </div>
    </div>
  );
}
