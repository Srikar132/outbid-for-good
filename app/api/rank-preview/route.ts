import { NextRequest, NextResponse } from "next/server";
import { getActiveCycle, getScopeRankPreview } from "@/sanity/lib/data";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const amount = Number(searchParams.get("amount"));
  const categorySlug = searchParams.get("category");
  const today = searchParams.get("today") === "true";

  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const cycle = await getActiveCycle();
  if (!cycle) {
    return NextResponse.json({ rank: 1, total: 1 });
  }

  const since = today ? new Date(Date.now() - DAY_MS).toISOString() : null;
  const result = await getScopeRankPreview({
    cycleId: cycle._id,
    categorySlug: categorySlug || null,
    since,
    amount,
  });

  return NextResponse.json(result);
}
