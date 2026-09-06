import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import {
  getActiveCycle,
  getCategories,
  getConfirmedEntries,
  getSiteConfig,
} from "@/sanity/lib/data";
import { filterEntries, scopeTopAmount } from "@/lib/filters";
import { isValidHttpUrl } from "@/lib/identity";
import { moderateNames } from "@/lib/moderation";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { writeClient } from "@/sanity/lib/writeClient";

const MAX_NAME_LENGTH = 60;
const MAX_TAGLINE_LENGTH = 140;
const RATE_LIMIT = { max: 5, windowMs: 60_000 };

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${base || "entry"}-${suffix}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`orders:${ip}`, RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    amount,
    entryCategorySlug,
    scopeCategorySlug,
    today,
    displayName,
    companyName,
    url,
    tagline,
    logoAssetId,
  } = body as {
    amount?: unknown;
    entryCategorySlug?: unknown;
    scopeCategorySlug?: unknown;
    today?: unknown;
    displayName?: unknown;
    companyName?: unknown;
    url?: unknown;
    tagline?: unknown;
    logoAssetId?: unknown;
  };

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount < 1
  ) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }
  if (typeof entryCategorySlug !== "string" || entryCategorySlug.length === 0) {
    return NextResponse.json({ error: "Choose a category." }, { status: 400 });
  }
  if (
    scopeCategorySlug !== null &&
    scopeCategorySlug !== undefined &&
    typeof scopeCategorySlug !== "string"
  ) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (
    typeof displayName !== "string" ||
    displayName.trim().length === 0 ||
    displayName.length > MAX_NAME_LENGTH
  ) {
    return NextResponse.json({ error: "Enter a valid display name." }, { status: 400 });
  }
  if (companyName !== undefined && companyName !== null) {
    if (typeof companyName !== "string" || companyName.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: "Invalid company name." }, { status: 400 });
    }
  }
  if (typeof url !== "string" || url.trim().length === 0 || !isValidHttpUrl(url.trim())) {
    return NextResponse.json(
      { error: "Enter a valid http(s) URL." },
      { status: 400 }
    );
  }
  if (tagline !== undefined && tagline !== null) {
    if (typeof tagline !== "string" || tagline.length > MAX_TAGLINE_LENGTH) {
      return NextResponse.json({ error: "Tagline is too long." }, { status: 400 });
    }
  }
  if (logoAssetId !== undefined && logoAssetId !== null && typeof logoAssetId !== "string") {
    return NextResponse.json({ error: "Invalid logo." }, { status: 400 });
  }

  const trimmedName = displayName.trim();
  const trimmedCompany = typeof companyName === "string" ? companyName.trim() : undefined;
  const trimmedUrl = url.trim();
  const trimmedTagline = typeof tagline === "string" ? tagline.trim() : undefined;
  const resolvedLogoAssetId = typeof logoAssetId === "string" ? logoAssetId : undefined;
  const resolvedScopeCategorySlug =
    typeof scopeCategorySlug === "string" && scopeCategorySlug.length > 0
      ? scopeCategorySlug
      : undefined;
  const isToday = today === true;

  // siteConfig, the active cycle, and the category list are independent
  // reads — fetch them concurrently instead of one after another.
  const [siteConfig, cycle, categories] = await Promise.all([
    getSiteConfig(),
    getActiveCycle(),
    getCategories(),
  ]);

  const moderation = moderateNames({
    displayName: trimmedName,
    companyName: trimmedCompany,
    creatorName: siteConfig?.creatorName,
  });
  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.reason }, { status: 400 });
  }

  if (!cycle) {
    return NextResponse.json(
      { error: "No active donation cycle right now." },
      { status: 400 }
    );
  }

  // The entry's own category tag is always required (the schema mandates
  // a category reference on every entry) — this is separate from the
  // scope below, which is the board (page) the claim must beat and may
  // have no category filter at all (e.g. claiming from the global "/"
  // view tagged as Brand still only has to beat the global top).
  const entryCategory = categories.find((c) => c.slug === entryCategorySlug);
  if (!entryCategory) {
    return NextResponse.json({ error: "That category no longer exists." }, { status: 400 });
  }
  if (resolvedScopeCategorySlug && !categories.some((c) => c.slug === resolvedScopeCategorySlug)) {
    return NextResponse.json({ error: "That category no longer exists." }, { status: 400 });
  }

  const entries = await getConfirmedEntries(cycle._id);
  const filtered = filterEntries(entries, {
    categorySlug: resolvedScopeCategorySlug,
    today: isToday,
  });
  const floor = scopeTopAmount(filtered) + (siteConfig?.minimumIncrement ?? 0);

  if (amount < floor) {
    return NextResponse.json(
      { error: `Someone else has claimed this. The current floor is ₹${floor}.` },
      { status: 400 }
    );
  }

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const slug = slugify(trimmedName);

  let entry: { _id: string };
  try {
    entry = await writeClient.create({
      _type: "leaderboardEntry",
      displayName: trimmedName,
      companyName: trimmedCompany || undefined,
      slug: { _type: "slug", current: slug },
      url: trimmedUrl,
      tagline: trimmedTagline || undefined,
      logo: resolvedLogoAssetId
        ? { _type: "image", asset: { _type: "reference", _ref: resolvedLogoAssetId } }
        : undefined,
      amount,
      status: "pending",
      clickCount: 0,
      raiseCount: 1,
      category: { _type: "reference", _ref: entryCategory._id },
      cycle: { _type: "reference", _ref: cycle._id },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't save your claim. Try again." },
      { status: 502 }
    );
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: entry._id,
      notes: { entryId: entry._id },
    });

    await writeClient.patch(entry._id).set({ razorpayOrderId: order.id }).commit();

    return NextResponse.json({
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      entryId: entry._id,
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't start checkout. Try again." },
      { status: 502 }
    );
  }
}
