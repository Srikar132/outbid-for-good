import { defineQuery } from "next-sanity";
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { getPostHogClient } from "@/lib/posthog-server";

const ENTRY_URL_QUERY = defineQuery(
  `*[_type == "leaderboardEntry" && _id == $id][0].url`
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = await client.fetch(ENTRY_URL_QUERY, { id });

  if (!url) {
    return NextResponse.redirect(new URL("/", _req.url));
  }

  // Click-count increments are not written back to Sanity yet — that's a
  // write path deferred to its own approval (needs a write-scoped token).
  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: id,
      event: "entry_link_clicked",
      properties: {
        entry_id: id,
      },
    });
    await posthog.flush();
  }

  return NextResponse.redirect(url);
}
