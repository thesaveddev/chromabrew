import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readScreenshot } from "@/lib/audit/screenshot-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound() {
  return NextResponse.json({ error: "Screenshot not found" }, { status: 404 });
}

/**
 * The captured screenshot for one page of a scan.
 *
 * The only thing taken from the request is an id. The page is looked up scoped
 * to its scan, so an id from somebody else's scan cannot be substituted, and the
 * filesystem path comes from the database row rather than the URL.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;
  const pageId = new URL(request.url).searchParams.get("page");
  if (!pageId) return notFound();

  try {
    const page = await prisma.scannedPage.findFirst({
      where: { id: pageId, scanId },
      select: { screenshotPath: true },
    });
    if (!page?.screenshotPath) return notFound();

    const png = await readScreenshot(page.screenshotPath);
    // The row can outlive the file (retention, a wiped worker volume); that is a
    // missing screenshot, not a server fault.
    if (!png) return notFound();

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        // A scan id is the only thing protecting this image, so keep it out of
        // shared caches.
        "Cache-Control": "private, no-store",
        "Content-Length": String(png.byteLength),
      },
    });
  } catch (error) {
    console.error("audit screenshot lookup failed", error);
    return NextResponse.json(
      { error: "The screenshot is temporarily unavailable.", code: "internal" },
      { status: 503 },
    );
  }
}
