"use server";

import { headers } from "next/headers";
import { z } from "zod";
import Razorpay from "razorpay";
import { claimFieldsSchema, logoFileSchema } from "@/lib/validation/claim";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { moderateNames } from "@/lib/moderation";
import { filterEntries, scopeTopAmount } from "@/lib/filters";
import {
  getActiveCycle,
  getCategories,
  getConfirmedEntries,
  getSiteConfig,
} from "@/sanity/lib/data";
import { writeClient } from "@/sanity/lib/writeClient";
import { getPostHogClient } from "@/lib/posthog-server";

const ORDER_RATE_LIMIT = { max: 5, windowMs: 60_000 };
const UPLOAD_RATE_LIMIT = { max: 5, windowMs: 60_000 };

export type ClaimField = "displayName" | "companyName" | "url" | "tagline" | "logo";

export type ClaimError =
  | { code: "VALIDATION"; fieldErrors: Partial<Record<ClaimField, string[]>> }
  | { code: "RATE_LIMITED" }
  | { code: "MODERATION_REJECTED"; reason: string }
  | { code: "NO_ACTIVE_CYCLE" }
  | { code: "CATEGORY_NOT_FOUND" }
  | { code: "OUTBID"; floor: number }
  | { code: "UPLOAD_FAILED" }
  | { code: "ENTRY_CREATE_FAILED" }
  | { code: "ORDER_CREATE_FAILED" }
  | { code: "SERVER_MISCONFIGURED" };

export type ClaimOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  entryId: string;
};

export type ClaimState =
  | { status: "idle" }
  | { status: "error"; error: ClaimError }
  | { status: "success"; order: ClaimOrder };

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${base || "entry"}-${suffix}`;
}

export async function createClaim(
  amount: number,
  entryCategorySlug: string,
  scopeCategorySlug: string | null,
  today: boolean,
  _prevState: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const ip = getClientIp(await headers());

  if (!checkRateLimit(`orders:${ip}`, ORDER_RATE_LIMIT)) {
    return { status: "error", error: { code: "RATE_LIMITED" } };
  }

  const parsed = claimFieldsSchema.safeParse({
    displayName: formData.get("displayName"),
    companyName: formData.get("companyName"),
    url: formData.get("url"),
    tagline: formData.get("tagline"),
  });

  const logoEntry = formData.get("logo");
  const logoFile = logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : null;
  const logoResult = logoFile ? logoFileSchema.safeParse(logoFile) : null;

  if (!parsed.success || (logoResult && !logoResult.success)) {
    const fieldErrors: Partial<Record<ClaimField, string[]>> = parsed.success
      ? {}
      : (z.flattenError(parsed.error).fieldErrors as Partial<Record<ClaimField, string[]>>);
    if (logoResult && !logoResult.success) {
      fieldErrors.logo = logoResult.error.issues.map((issue) => issue.message);
    }
    return { status: "error", error: { code: "VALIDATION", fieldErrors } };
  }

  const { displayName, companyName, url, tagline } = parsed.data;

  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 1) {
    return { status: "error", error: { code: "VALIDATION", fieldErrors: {} } };
  }

  // siteConfig, the active cycle, and the category list are independent
  // reads — fetch them concurrently instead of one after another.
  const [siteConfig, cycle, categories] = await Promise.all([
    getSiteConfig(),
    getActiveCycle(),
    getCategories(),
  ]);

  const moderation = moderateNames({
    displayName,
    companyName,
    creatorName: siteConfig?.creatorName,
  });
  if (!moderation.ok) {
    return { status: "error", error: { code: "MODERATION_REJECTED", reason: moderation.reason } };
  }

  if (!cycle) {
    return { status: "error", error: { code: "NO_ACTIVE_CYCLE" } };
  }

  // The entry's own category tag is always required (the schema mandates a
  // category reference on every entry) — this is separate from the scope,
  // which is the board (page) the claim must beat and may have no category
  // filter at all (e.g. claiming from the global "/" view tagged as Brand
  // still only has to beat the global top).
  const entryCategory = categories.find((c) => c.slug === entryCategorySlug);
  if (!entryCategory) {
    return { status: "error", error: { code: "CATEGORY_NOT_FOUND" } };
  }
  if (scopeCategorySlug && !categories.some((c) => c.slug === scopeCategorySlug)) {
    return { status: "error", error: { code: "CATEGORY_NOT_FOUND" } };
  }

  const entries = await getConfirmedEntries(cycle._id);
  const filtered = filterEntries(entries, {
    categorySlug: scopeCategorySlug ?? undefined,
    today,
  });
  const floor = scopeTopAmount(filtered) + (siteConfig?.minimumIncrement ?? 0);

  if (amount < floor) {
    return { status: "error", error: { code: "OUTBID", floor } };
  }

  if (
    !process.env.SANITY_API_WRITE_TOKEN ||
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    return { status: "error", error: { code: "SERVER_MISCONFIGURED" } };
  }

  let logoAssetId: string | undefined;
  if (logoFile) {
    if (!checkRateLimit(`upload:${ip}`, UPLOAD_RATE_LIMIT)) {
      return { status: "error", error: { code: "RATE_LIMITED" } };
    }
    try {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const asset = await writeClient.assets.upload("image", buffer, {
        filename: logoFile.name,
        contentType: logoFile.type,
      });
      logoAssetId = asset._id;
    } catch {
      return { status: "error", error: { code: "UPLOAD_FAILED" } };
    }
  }

  const slug = slugify(displayName);

  let entry: { _id: string };
  try {
    entry = await writeClient.create({
      _type: "leaderboardEntry",
      displayName,
      companyName: companyName || undefined,
      slug: { _type: "slug", current: slug },
      url,
      tagline: tagline || undefined,
      logo: logoAssetId
        ? { _type: "image", asset: { _type: "reference", _ref: logoAssetId } }
        : undefined,
      amount,
      status: "pending",
      clickCount: 0,
      raiseCount: 1,
      category: { _type: "reference", _ref: entryCategory._id },
      cycle: { _type: "reference", _ref: cycle._id },
    });
  } catch {
    return { status: "error", error: { code: "ENTRY_CREATE_FAILED" } };
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

    const posthog = getPostHogClient();
    if (posthog) {
      posthog.capture({
        distinctId: entry._id,
        event: "order_created",
        properties: {
          amount,
          entry_category: entryCategorySlug,
          scope_category: scopeCategorySlug,
          scope_today: today,
          has_logo: !!logoAssetId,
          has_tagline: !!tagline,
          has_company: !!companyName,
          razorpay_order_id: order.id,
          entry_id: entry._id,
        },
      });
      await posthog.flush();
    }

    return {
      status: "success",
      order: {
        orderId: order.id,
        amount,
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        entryId: entry._id,
      },
    };
  } catch {
    return { status: "error", error: { code: "ORDER_CREATE_FAILED" } };
  }
}
