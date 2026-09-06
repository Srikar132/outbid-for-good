export type Category = {
  slug: string;
  title: string;
};

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  companyName?: string;
  tagline: string;
  url: string;
  categorySlug: string;
  amount: number;
  clickCount: number;
  status: "confirmed";
  confirmedAt: string; // ISO timestamp
};

export function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export type Cycle = {
  id: string;
  startDate: string;
  endDate: string;
  active: true;
};

export type SiteConfig = {
  causeTitle: string;
  causeBlurb: string;
  fundMessage: string;
  minimumIncrement: number;
};

export const siteConfig: SiteConfig = {
  causeTitle: "Clean Water for Brighter Futures",
  causeBlurb:
    "Support clean and safe drinking water for communities in need. This is placeholder cause content — no partnership is confirmed yet.",
  fundMessage: "Funds go directly to a registered trust, not to this site.",
  minimumIncrement: 1000,
};

export const activeCycle: Cycle = {
  id: "cycle-2026-q3",
  startDate: "2026-07-01",
  endDate: "2026-09-30",
  active: true,
};

export const categories: Category[] = [
  { slug: "individual", title: "Individual" },
  { slug: "company", title: "Company" },
  { slug: "brand", title: "Brand" },
];

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();

export const leaderboardEntries: LeaderboardEntry[] = [
  {
    id: "entry-1",
    displayName: "Anonymous Donor",
    tagline: "Just believes in the cause — no strings attached.",
    url: "https://example.com/donor-1",
    categorySlug: "individual",
    amount: 25000,
    clickCount: 142,
    status: "confirmed",
    confirmedAt: hoursAgo(2),
  },
  {
    id: "entry-2",
    displayName: "Riverline Traders",
    companyName: "Riverline Traders Pvt Ltd",
    tagline: "Local trading company backing the river cleanup effort.",
    url: "https://example.com/donor-2",
    categorySlug: "company",
    amount: 18000,
    clickCount: 98,
    status: "confirmed",
    confirmedAt: hoursAgo(20),
  },
  {
    id: "entry-3",
    displayName: "GreenLeaf Foods",
    companyName: "GreenLeaf Foods",
    tagline: "Sustainable snacks, sustainable rivers.",
    url: "https://example.com/donor-3",
    categorySlug: "brand",
    amount: 12500,
    clickCount: 61,
    status: "confirmed",
    confirmedAt: hoursAgo(30),
  },
  {
    id: "entry-4",
    displayName: "Priya S.",
    tagline: "Bhopal local, grew up near the river.",
    url: "https://example.com/donor-4",
    categorySlug: "individual",
    amount: 8000,
    clickCount: 34,
    status: "confirmed",
    confirmedAt: hoursAgo(5),
  },
  {
    id: "entry-5",
    displayName: "Northside Motors",
    companyName: "Northside Motors",
    tagline: "Proud to sponsor community clean-up work.",
    url: "https://example.com/donor-5",
    categorySlug: "company",
    amount: 5000,
    clickCount: 22,
    status: "confirmed",
    confirmedAt: hoursAgo(50),
  },
];

// Server-only in-memory click store (resets on restart) — mirrors the eventual
// Sanity-backed click increment without letting the client write anything.
const clickCounts = new Map(leaderboardEntries.map((e) => [e.id, e.clickCount]));

export function getEntryById(id: string) {
  return leaderboardEntries.find((e) => e.id === id);
}

export function incrementClick(id: string) {
  const current = clickCounts.get(id) ?? 0;
  clickCounts.set(id, current + 1);
  return clickCounts.get(id);
}
