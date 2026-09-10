// Dev-only leaderboard fixtures for validating the UI at realistic volume —
// the sectioned page-1 layout, the TOP 20 marker and pagination only take
// shape past ~20 entries, and the live dataset has two.
//
// Double-gated: NEXT_PUBLIC_MOCK_LEADERBOARD=1 *and* a non-production build.
// It can therefore never reach a deployed site. It is also purely a view-layer
// substitution — no mock entry is ever written to Sanity, so real donor data
// and the webhook-confirmed-only rule are untouched.
//
// One caveat while it is on: the ClaimBand floor derives from whatever list
// the page renders, so it will quote a mock amount. Turn the flag off before
// testing anything payment-related.

import { CategoryResult, LeaderboardEntryResult } from "@/sanity/lib/data";

export function isMockLeaderboardEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_MOCK_LEADERBOARD === "1"
  );
}

// Invented names. Deliberately not real people or companies — AGENTS.md §10
// treats impersonation as something to reject, and fixtures should not model
// what the moderation filter exists to block.
const NAMES = [
  "Riverline Traders", "Priya Nandan", "Kalpataru Foods", "Anjali Verma",
  "Sundar Logistics", "Meghna Rao", "Bluecrest Analytics", "Rahul Iyer",
  "Tanvi Deshmukh", "Northbank Studio", "Kabir Menon", "Sahana Pillai",
  "Greenfield Mills", "Arjun Bhatt", "Ishita Chandra", "Lakeview Textiles",
  "Devansh Kapoor", "Ridgeway Partners", "Nikhil Saxena", "Aarav Joshi",
  "Palash Interiors", "Sneha Kulkarni", "Copperline Works", "Vikram Anand",
  "Maitri Foundation", "Rohan Gokhale", "Sable & Co", "Ananya Nair",
  "Westgate Motors", "Kunal Bose", "Trisha Malhotra", "Orchard Lane Cafe",
  "Aditya Ranganathan", "Nalanda Press", "Farhan Qureshi", "Sarika Dutta",
  "Ironwood Fabrication", "Manav Chopra", "Ritu Bhargava", "Silverleaf Dairy",
  "Yash Trivedi", "Naina Sundaram", "Highfield Ceramics", "Omkar Patil",
  "Divya Raghavan", "Stonebridge Legal", "Aryan Sethi", "Kavya Balan",
  "Marigold Prints", "Siddharth Rao", "Nandini Ghosh", "Brightwater Labs",
  "Imran Shaikh", "Pooja Mahadevan", "Ashcroft Supplies", "Varun Kamath",
  "Leela Krishnan", "Fernhill Roasters", "Zoya Ahmed", "Tarun Vaidya",
  "Sunder Ghat Trust", "Nisha Pandey", "Claybank Pottery", "Gaurav Mehra",
];

const TAGLINES = [
  "Backing the river cleanup, one weekend at a time.",
  "We fund what we can see working.",
  "Clean water is not a luxury.",
  "Proud to stand behind this cause.",
  "Small business, big river.",
  "Because someone had to start.",
  "Our team volunteers here every month.",
  "For the Narmada, and for the next generation.",
  "",
];

/**
 * Amount-descending fixtures, matching what CONFIRMED_ENTRIES_QUERY returns.
 * Categories are the caller's real ones, so tabs and category routes filter
 * exactly as they do against live data.
 */
export function mockEntries(categories: CategoryResult[]): LeaderboardEntryResult[] {
  if (categories.length === 0) return [];

  return NAMES.map((name, index) => {
    const category = categories[index % categories.length];
    const isPerson = !name.includes(" ") || /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(name);

    // Steep at the top, flattening out — closer to a real board than a
    // linear ramp, and it exercises wide and narrow amount columns.
    const amount = Math.round(45000 / (index * 0.45 + 1) / 50) * 50 + (63 - index);

    // A band of mid-table entries lands inside the 24h window, so the
    // "Today's top ranking" strip shows people the podium does not. Making
    // the newest entries also the largest would hide the fact that these are
    // two independent rankings.
    const isRecent = index >= 28 && index < 34;
    const hoursAgo = isRecent ? 2 + (index - 28) * 3 : 30 + index * 7;

    // Mix of @handle (renders the @ mark, no favicon request), a plain
    // domain, and none at all — one of each fallback in EntryAvatar.
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const url =
      index % 3 === 0
        ? `https://instagram.com/${slug.replace(/-/g, "")}`
        : index % 3 === 1
        ? `https://${slug}.example`
        : "";

    return {
      _id: `mock-${index}`,
      slug,
      displayName: isPerson ? name : `${name} team`,
      companyName: isPerson ? null : name,
      tagline: TAGLINES[index % TAGLINES.length] || null,
      url,
      amount,
      clickCount: Math.max(0, 4200 - index * 61),
      confirmedAt: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
      category,
    };
  }).sort((a, b) => b.amount - a.amount);
}
