import { Resend } from "resend";

/** Lazy Resend client — only initialized if RESEND_API_KEY is set. */
export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = process.env.EMAIL_FROM ?? "ChromaBrew <onboarding@resend.dev>";
const TO = (process.env.FEEDBACK_NOTIFY_TO ?? "itsopeyemi@gmail.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Escape text for the HTML half of a report email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ScheduleReportTopFinding {
  severity: string;
  title: string;
}

export interface ScheduleReportSummary {
  /** The watched site, as the owner typed it. */
  siteUrl: string;
  /** Absolute URL of the finished report. */
  reportUrl: string;
  /** Absolute URL of the Pro ZIP bundle download. */
  bundleUrl: string;
  score: number;
  scoreLabel: string;
  total: number;
  critical: number;
  high: number;
  pagesScanned: number;
  completedAt: string | null;
  /** Null on the first finished scan, where there is nothing to compare. */
  newSinceLast: number | null;
  fixedSinceLast: number | null;
  topFindings: ScheduleReportTopFinding[];
}

/**
 * The scheduled-report email, as subject + text + HTML. Pure, so the copy
 * the inbox receives is unit-tested without touching Resend. Deliberately a
 * summary with links rather than the full report: the report page is the
 * readable artifact and the bundle is the archival one — the email's job is
 * to say what changed and where to look.
 */
export function renderScheduleReportEmail(summary: ScheduleReportSummary): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Site report: ${summary.siteUrl} — health ${summary.score}/100`;
  const regressionLine =
    summary.newSinceLast === null || summary.fixedSinceLast === null
      ? "First finished scan of this site — the next run will compare against it."
      : `New since last run: ${summary.newSinceLast} · Fixed: ${summary.fixedSinceLast}.`;
  const findingsLine =
    summary.topFindings.length > 0
      ? summary.topFindings
          .map((finding) => `[${finding.severity}] ${finding.title}`)
          .join("\n")
      : "No findings — the automated checks found nothing to complain about.";
  const text = [
    `Scheduled re-scan of ${summary.siteUrl} is done.`,
    ``,
    `Health score: ${summary.score}/100 (${summary.scoreLabel})`,
    `Findings: ${summary.total} total · ${summary.critical} critical · ${summary.high} high · ${summary.pagesScanned} pages scanned.`,
    regressionLine,
    ``,
    `Top findings:`,
    findingsLine,
    ``,
    `Full report: ${summary.reportUrl}`,
    `Download bundle (Pro): ${summary.bundleUrl}`,
  ].join("\n");
  const html = [
    `<div style="font-family:sans-serif;max-width:560px;color:#18181b">`,
    `<h2 style="margin:0 0 8px">Scheduled re-scan is done</h2>`,
    `<p style="margin:0 0 16px;color:#52525b">${escapeHtml(summary.siteUrl)}${summary.completedAt ? ` · scanned ${escapeHtml(summary.completedAt)}` : ""}</p>`,
    `<p style="font-size:28px;font-weight:bold;margin:0 0 4px">${summary.score}<span style="font-size:14px;color:#71717a">/100</span></p>`,
    `<p style="margin:0 0 16px;color:#52525b">${escapeHtml(summary.scoreLabel)} · ${summary.total} findings (${summary.critical} critical, ${summary.high} high) · ${summary.pagesScanned} pages</p>`,
    `<p style="margin:0 0 16px;color:#52525b">${escapeHtml(regressionLine)}</p>`,
    summary.topFindings.length > 0
      ? `<ul style="padding-left:20px">${summary.topFindings
          .map(
            (finding) =>
              `<li><strong>[${escapeHtml(finding.severity)}]</strong> ${escapeHtml(finding.title)}</li>`,
          )
          .join("")}</ul>`
      : `<p>No findings — the automated checks found nothing to complain about.</p>`,
    `<p><a href="${escapeHtml(summary.reportUrl)}">Open the full report</a> · <a href="${escapeHtml(summary.bundleUrl)}">Download the bundle</a></p>`,
    `</div>`,
  ].join("\n");
  return { subject, text, html };
}

/**
 * Email one finished scheduled re-scan to its recipients. Returns false
 * (no throw) when Resend is not configured or the send fails, so a missing
 * mail setup degrades into silent watches rather than failed scans.
 */
export async function sendScheduleReportEmail(input: {
  to: string[];
  summary: ScheduleReportSummary;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend || input.to.length === 0) return false;
  const { subject, text, html } = renderScheduleReportEmail(input.summary);
  try {
    await resend.emails.send({ from: FROM, to: input.to, subject, text, html });
    return true;
  } catch {
    return false;
  }
}

/**
 * Send a feedback notification email to the configured recipients.
 * Returns early (no throw) when Resend is not configured, so the
 * feedback flow keeps working even before env vars are set.
 */
export async function sendFeedbackEmail(input: {
  type: string;
  message: string;
  email?: string | null;
  page?: string | null;
  ip?: string | null;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend || TO.length === 0) return false;

  const typeLabel = input.type.charAt(0).toUpperCase() + input.type.slice(1);

  try {
    await resend.emails.send({
      from: FROM,
      to: TO,
      subject: `[ChromaBrew] New ${typeLabel.toLowerCase()} feedback`,
      text: [
        `Type: ${typeLabel}`,
        input.page ? `Page: ${input.page}` : null,
        input.email ? `Reporter: ${input.email}` : null,
        input.ip ? `IP: ${input.ip}` : null,
        "",
        "Message:",
        input.message,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return true;
  } catch {
    return false;
  }
}
