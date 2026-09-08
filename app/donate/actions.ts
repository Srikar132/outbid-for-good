"use server";

import { headers } from "next/headers";
import { z } from "zod";
import Razorpay from "razorpay";
import { claimFieldsSchema } from "@/lib/validation/claim";
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

export type ClaimField = "displayName" | "companyName" | "url" | "tagline";

export type ClaimError =
  | { code: "VALIDATION"; fieldErrors: Partial<Record<ClaimField, string[]>> }
  | { code: "RATE_LIMITED" }
  | { code: "MODERATION_REJECTED"; reason: string }
  | { code: "NO_ACTIVE_CYCLE" }
  | { code: "CATEGORY_NOT_FOUND" }
  | { code: "OUTBID"; floor: number }
  | { code: "DATA_UNAVAILABLE" }
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

  const posthog = getPostHogClient();
  // A failed attempt has no entry to key on, so group each attempt under a
  // fresh id. Every early return runs through fail() so no branch is silent.
  const attemptId = crypto.randomUUID();
  async function fail(error: ClaimError): Promise<ClaimState> {
    if (posthog) {
      posthog.capture({
        distinctId: attemptId,
        event: "claim_failed",
        properties: {
          code: error.code,
          amount,
          entry_category: entryCategorySlug,
          scope_category: scopeCategorySlug,
          scope_today: today,
          ...(error.code === "OUTBID" ? { floor: error.floor } : {}),
        },
      });
      await posthog.flush();
    }
    return { status: "error", error };
  }

  if (!checkRateLimit(`orders:${ip}`, ORDER_RATE_LIMIT)) {
    return fail({ code: "RATE_LIMITED" });
  }

  const parsed = claimFieldsSchema.safeParse({
    displayName: formData.get("displayName"),
    companyName: formData.get("companyName"),
    url: formData.get("url"),
    tagline: formData.get("tagline"),
  });

  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error)
      .fieldErrors as Partial<Record<ClaimField, string[]>>;
    return fail({ code: "VALIDATION", fieldErrors });
  }

  const { displayName, companyName, url, tagline } = parsed.data;

  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 1) {
    return fail({ code: "VALIDATION", fieldErrors: {} });
  }

  // siteConfig, the active cycle, and the category list are independent
  // reads — fetch them concurrently instead of one after another.
  let siteConfig, cycle, categories;
  try {
    [siteConfig, cycle, categories] = await Promise.all([
      getSiteConfig(),
      getActiveCycle(),
      getCategories(),
    ]);
  } catch {
    return fail({ code: "DATA_UNAVAILABLE" });
  }

  const moderation = moderateNames({
    displayName,
    companyName,
    creatorName: siteConfig?.creatorName,
  });
  if (!moderation.ok) {
    return fail({ code: "MODERATION_REJECTED", reason: moderation.reason });
  }

  if (!cycle) {
    return fail({ code: "NO_ACTIVE_CYCLE" });
  }

  // The entry's own category tag is always required (the schema mandates a
  // category reference on every entry) — this is separate from the scope,
  // which is the board (page) the claim must beat and may have no category
  // filter at all (e.g. claiming from the global "/" view tagged as Brand
  // still only has to beat the global top).
  const entryCategory = categories.find((c) => c.slug === entryCategorySlug);
  if (!entryCategory) {
    return fail({ code: "CATEGORY_NOT_FOUND" });
  }
  if (scopeCategorySlug && !categories.some((c) => c.slug === scopeCategorySlug)) {
    return fail({ code: "CATEGORY_NOT_FOUND" });
  }

  let entries;
  try {
    entries = await getConfirmedEntries(cycle._id);
  } catch {
    return fail({ code: "DATA_UNAVAILABLE" });
  }
  const filtered = filterEntries(entries, {
    categorySlug: scopeCategorySlug ?? undefined,
    today,
  });
  const floor = scopeTopAmount(filtered) + (siteConfig?.minimumIncrement ?? 0);

  if (amount < floor) {
    return fail({ code: "OUTBID", floor });
  }

  if (
    !process.env.SANITY_API_WRITE_TOKEN ||
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    return fail({ code: "SERVER_MISCONFIGURED" });
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
      amount,
      status: "pending",
      clickCount: 0,
      raiseCount: 1,
      category: { _type: "reference", _ref: entryCategory._id },
      cycle: { _type: "reference", _ref: cycle._id },
    });
  } catch {
    return fail({ code: "ENTRY_CREATE_FAILED" });
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

    if (posthog) {
      posthog.capture({
        distinctId: entry._id,
        event: "order_created",
        properties: {
          amount,
          entry_category: entryCategorySlug,
          scope_category: scopeCategorySlug,
          scope_today: today,
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
    return fail({ code: "ORDER_CREATE_FAILED" });
  }
}
