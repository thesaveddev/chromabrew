/**
 * Emailed scheduled reports: the Pro deliverable on top of watches.
 *
 * A watch re-scans silently; a watch with recipients emails the finished
 * report to up to three addresses. The runner calls this once per finished
 * scan with the scan id the schedule recorded as `lastScanId` at enqueue
 * time. Email is best-effort by design: every failure path returns a count
 * rather than throwing, so mail can never turn a finished scan into a
 * failed one.
 *
 * Server-only: reads the database, the entitlement snapshot and Resend.
 */

import { prisma } from "@/lib/db";
import { sendScheduleReportEmail, type ScheduleReportSummary } from "@/lib/mail";
import { siteUrl } from "@/lib/site-url";
import { hasEntitlement } from "@/lib/entitlements-server";

import { getScanRegression, getScanResultsDto } from "./queries";
import { scoreBand, scoreFromCounts } from "./score";
import { SEVERITY_ORDER, isReportReady } from "./types";

function storedRecipients(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

/**
 * Email every watch that points at this finished scan. Returns how many
 * watches were mailed; skips watches with no recipients, non-Pro owners
 * (a lapsed subscription keeps the watch, loses the email) and scans with
 * no readable report. Never throws.
 */
export async function sendScheduleReportsForScan(scanId: string): Promise<{ sent: number }> {
  try {
    const schedules = await prisma.auditSchedule.findMany({
      where: { lastScanId: scanId },
      select: { id: true, userId: true, emailRecipients: true },
    });

    let sent = 0;
    for (const schedule of schedules) {
      try {
        const recipients = storedRecipients(schedule.emailRecipients);
        if (recipients.length === 0) continue;
        if (!(await hasEntitlement(schedule.userId, "pro"))) continue;

        const [results, regression] = await Promise.all([
          getScanResultsDto(scanId),
          getScanRegression(scanId),
        ]);
        if (!results || !isReportReady(results.scan.status)) continue;

        const score = scoreFromCounts(results.counts);
        const ranked = [...results.findings].sort(
          (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
        );
        const summary: ScheduleReportSummary = {
          siteUrl: results.scan.url,
          reportUrl: `${siteUrl}/audit/${scanId}`,
          bundleUrl: `${siteUrl}/api/audit/scan/${scanId}/bundle`,
          score,
          scoreLabel: scoreBand(score).label,
          total: results.counts.total,
          critical: results.counts.critical,
          high: results.counts.high,
          pagesScanned: results.scan.pagesScanned,
          completedAt: results.scan.completedAt,
          newSinceLast: regression?.diff.addedTotal ?? null,
          fixedSinceLast: regression?.diff.fixedTotal ?? null,
          topFindings: ranked
            .slice(0, 5)
            .map((finding) => ({ severity: finding.severity, title: finding.title })),
        };

        if (await sendScheduleReportEmail({ to: recipients, summary })) sent += 1;
      } catch (error) {
        // One watch's email never blocks the next watch's.
        console.error("schedule report email failed", { scheduleId: schedule.id, error });
      }
    }
    return { sent };
  } catch (error) {
    console.error("schedule report emails failed", { scanId, error });
    return { sent: 0 };
  }
}
