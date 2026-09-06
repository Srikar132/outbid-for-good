import { NextRequest, NextResponse } from "next/server";
import { getEntryById, incrementClick } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = getEntryById(id);

  if (!entry) {
    return NextResponse.redirect(new URL("/", _req.url));
  }

  incrementClick(id);

  return NextResponse.redirect(entry.url);
}
