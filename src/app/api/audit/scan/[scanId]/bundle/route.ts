import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildScanBundle, type BundleScreenshot } from "@/lib/audit/bundle";
import { getScanResultsDto } from "@/lib/audit/queries";
import { hasEntitlement } from "@/lib/entitlements-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The report as a file: report.md + report.json + screenshots in one ZIP.
 *
 * Owner-only and Pro-gated — the bundle is the premium deliverable, the
 * handoff an owner sends to a client or files for a release. Anonymous scans
 * have no owner to gate on, so they 404 here the way they do on the share
 * route; the on-page report and the browser print path stay free.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to download the report." }, { status: 401 });
  }

  const { scanId } = await params;
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { id: true, userId: true, normalizedUrl: true },
  });
  if (!scan || scan.userId !== session.user.id) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (!(await hasEntitlement(session.user.id, "pro"))) {
    return NextResponse.json(
      { error: "The report bundle is a Pro feature.", upgradeUrl: "/pricing" },
      { status: 403 },
    );
  }

  const results = await getScanResultsDto(scanId);
  if (!results) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const shots = await prisma.scannedPage.findMany({
    where: { scanId },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true, screenshotData: true },
  });
  const screenshots: BundleScreenshot[] = shots
    .filter((shot) => shot.screenshotData && shot.screenshotData.length > 0)
    .map((shot, i) => ({
      name: `page-${i + 1}-${shot.id.slice(0, 8)}`,
      url: shot.url,
      png: new Uint8Array(shot.screenshotData as Uint8Array),
    }));

  const zip = buildScanBundle(results, screenshots);
  const host = (() => {
    try {
      return new URL(results.scan.normalizedUrl).hostname.replace(/[^a-z0-9]+/gi, "-");
    } catch {
      return "site";
    }
  })();

  return new Response(zip as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="audit-${host}-${scanId.slice(0, 8)}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
