import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expireAbandonedScan } from "@/lib/audit/runner";
import { scanQueueState, type ScanStatusId } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCAN_FIELDS = {
  id: true,
  status: true,
  pagesScanned: true,
  pagesTotal: true,
  errorMessage: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
} as const;

async function readScan(scanId: string) {
  return prisma.scan.findUnique({ where: { id: scanId }, select: SCAN_FIELDS });
}

/**
 * The light status poll the progress view uses.
 *
 * A scan that has sat queued past the queue's window is closed here, on the
 * reader's own request. The sweep that normally reaps abandoned rows runs
 * inside the worker, and a stale queue means there is no worker to run it, so
 * this poll is the only thing left that can end the wait: without it the view
 * spins forever on a state that can no longer change. It costs one indexed
 * write, once, on a row that is terminal afterwards.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;

  let scan = await readScan(scanId);
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scanQueueState(scan.status as ScanStatusId, scan.createdAt) === "abandoned") {
    if (await expireAbandonedScan(scanId)) {
      scan = (await readScan(scanId)) ?? scan;
    }
  }

  // A scan's state is specific to its caller; never let a proxy cache it.
  return NextResponse.json(scan, { headers: { "Cache-Control": "no-store" } });
}
