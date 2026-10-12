import { NextResponse } from "next/server";

import { resolveSharedScreenshot } from "@/lib/audit/share";
import { readScreenshot } from "@/lib/audit/screenshot-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound() {
  return NextResponse.json({ error: "Screenshot not found" }, { status: 404 });
}

/**
 * The screenshot for a page of a shared scan.
 *
 * The token names the scan and the page id is looked up scoped to that scan, so
 * a page id from another report resolves to nothing. As on the owner's route the
 * filesystem path comes from the database row, never from the request.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const pageId = new URL(request.url).searchParams.get("page");
  if (!pageId) return notFound();

  try {
    const screenshotPath = await resolveSharedScreenshot(token, pageId);
    if (!screenshotPath) return notFound();

    const png = await readScreenshot(screenshotPath);
    if (!png) return notFound();

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        // The link is meant to be passed around, but caching a customer's
        // screenshot in a shared cache is a different decision; keep it private.
        "Cache-Control": "private, no-store",
        "Content-Length": String(png.byteLength),
      },
    });
  } catch (error) {
    console.error("shared audit screenshot lookup failed", error);
    return NextResponse.json(
      { error: "The screenshot is temporarily unavailable.", code: "internal" },
      { status: 503 },
    );
  }
}
