import { NextResponse } from "next/server";
import { getScanStatusDto } from "@/lib/audit/queries";
import { expireAbandonedScan } from "@/lib/audit/runner";
import { scanQueueState, type ScanStatusId } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The light status poll the progress view uses.
 *
 * A scan that has sat queued past the queue's window is closed here, on the
 * reader's own request. The sweep that normally reaps abandoned rows runs
 * inside the worker, and a stale queue means there is no worker to run it, so
 * this poll is the only thing left that can end the wait: without it the view
 * spins forever on a state that can no longer change. It costs one indexed
 * write, once, on a row that is terminal afterwards.
 *
 * The body is `getScanStatusDto` — the same DTO every other scan endpoint
 * returns, so the progress view learns the pipeline *stage* and the URL it is
 * auditing. This route used to answer with a hand-picked subset of columns,
 * which is why the waiting room could only say "running" while the reader
 * wondered what, if anything, was happening.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;

  let dto = await getScanStatusDto(scanId);
  if (!dto) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scanQueueState(dto.status as ScanStatusId, dto.createdAt) === "abandoned") {
    if (await expireAbandonedScan(scanId)) {
      dto = (await getScanStatusDto(scanId)) ?? dto;
    }
  }

  // A scan's state is specific to its caller; never let a proxy cache it.
  return NextResponse.json(dto, { headers: { "Cache-Control": "no-store" } });
}
