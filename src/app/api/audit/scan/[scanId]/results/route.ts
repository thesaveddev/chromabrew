import { NextResponse } from "next/server";

import { getScanResultsDto } from "@/lib/audit/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Findings, pages and coverage for one scan.
 *
 * The response is built by `queries.ts` like every other audit response. It
 * previously returned the Prisma rows verbatim, which handed the caller columns
 * that are nobody's business — `ipHash`, `userAgent`, the raw `metadata`, and
 * (once sharing existed) the share token itself. A scan id is not a secret, so
 * anything this route returns must be something its holder is meant to see.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;
  const results = await getScanResultsDto(scanId);
  if (!results) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json(results, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
