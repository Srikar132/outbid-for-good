import { NextRequest, NextResponse } from "next/server";
import { getActiveCycle, getConfirmedEntries } from "@/sanity/lib/data";
import { normalizeIdentityUrl } from "@/lib/identity";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ exists: false });
  }

  const cycle = await getActiveCycle();
  if (!cycle) {
    return NextResponse.json({ exists: false });
  }

  const target = normalizeIdentityUrl(url);
  const entries = await getConfirmedEntries(cycle._id);
  const match = entries.find((entry) => normalizeIdentityUrl(entry.url) === target);

  if (!match) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    displayName: match.displayName,
    amount: match.amount,
    categorySlug: match.category?.slug ?? null,
  });
}
