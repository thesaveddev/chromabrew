import { NextResponse } from "next/server";
import { getScanStatusDto } from "@/lib/audit/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scan status.
 *
 * Anyone holding the scan's unguessable cuid can read it — the same sharing
 * model the public project view at /p/[id] already uses. Anonymous scans have
 * no owner to check against, and adding an ownership check would break them.
 * Scans are never listed, so an id only exists for the person it was returned to.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;
  try {
    const scan = await getScanStatusDto(scanId);
    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }
    // A scan's state is specific to its caller; never let a proxy cache it.
    return NextResponse.json(scan, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // The UI polls this endpoint, so it must always answer with the documented
    // JSON shape — a transient database failure should be retryable, not opaque.
    console.error("audit status lookup failed", error);
    return NextResponse.json(
      { error: "The scan status is temporarily unavailable.", code: "internal" },
      { status: 503 },
    );
  }
}
