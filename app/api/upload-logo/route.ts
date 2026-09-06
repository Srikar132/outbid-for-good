import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeClient } from "@/sanity/lib/writeClient";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const RATE_LIMIT = { max: 5, windowMs: 60_000 };

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`upload:${ip}`, RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many uploads. Wait a minute and try again." },
      { status: 429 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be under 2MB." }, { status: 400 });
  }
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await writeClient.assets.upload("image", buffer, {
      filename: file.name,
      contentType: file.type,
    });
    return NextResponse.json({ assetId: asset._id });
  } catch {
    return NextResponse.json(
      { error: "Couldn't upload image. Try again." },
      { status: 502 }
    );
  }
}
