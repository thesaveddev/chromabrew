import { NextResponse } from "next/server";
import { getScanStatusDto } from "@/lib/audit/queries";
import { expireAbandonedScan } from "@/lib/audit/runner";
import { scanQueueState } from "@/lib/audit/types";

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
    let scan = await getScanStatusDto(scanId);
    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // The one caller who cannot be left waiting is the one polling right now: if
    // no worker is coming for this scan, close it before answering. The sweep
    // that normally does this runs inside the worker — the very process that is
    // missing when a queue goes stale — so the poll has to be able to end it.
    if (scanQueueState(scan.status, scan.createdAt) === "abandoned") {
      if (await expireAbandonedScan(scanId)) {
        scan = (await getScanStatusDto(scanId)) ?? scan;
      }
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
