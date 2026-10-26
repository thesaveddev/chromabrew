import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import {
  getScanHistory,
  getScanRegression,
  type ScanHistoryEntryDto,
  type ScanRegressionDto,
} from "@/lib/audit/queries";
import {
  listSchedulesForUrl,
  type ScheduleDto,
} from "@/lib/audit/schedules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The site's story around one scan: earlier runs and what changed.
 *
 * Owner-gated, unlike the report itself: a scan id is not a secret, but the
 * history around it (how many audits ran, when, and what they found) belongs
 * to whoever owns the schedule-watching account. Anonymous scans have no
 * owner, so this route only answers for scans tied to the signed-in user.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view scan history." }, { status: 401 });
  }

  const { scanId } = await params;
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { userId: true, normalizedUrl: true },
  });
  if (!scan || scan.userId !== session.user.id) {
    // Anonymous scans and other people's scans read the same: not found.
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const [history, regression, schedules]: [
    ScanHistoryEntryDto[],
    ScanRegressionDto | null,
    ScheduleDto[],
  ] = await Promise.all([
    getScanHistory(scanId),
    getScanRegression(scanId),
    listSchedulesForUrl(session.user.id, scan.normalizedUrl),
  ]);

  return NextResponse.json(
    { history, regression, schedules },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
