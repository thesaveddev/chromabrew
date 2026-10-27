import { describe, expect, it } from "vitest";

import { renderScheduleReportEmail, type ScheduleReportSummary } from "./mail";

function summary(overrides: Partial<ScheduleReportSummary> = {}): ScheduleReportSummary {
  return {
    siteUrl: "https://example.com/",
    reportUrl: "https://chromabrew.com/audit/scan-1",
    bundleUrl: "https://chromabrew.com/api/audit/scan/scan-1/bundle",
    score: 82,
    scoreLabel: "Good",
    total: 4,
    critical: 0,
    high: 1,
  pagesScanned: 3,
  completedAt: "2026-10-26",
  newSinceLast: 2,
  fixedSinceLast: 1,
  topFindings: [{ severity: "high", title: "Missing document language" }],
    ...overrides,
  };
}

describe("renderScheduleReportEmail", () => {
  it("leads with the score and links to the report and bundle", () => {
    const { subject, text, html } = renderScheduleReportEmail(summary());
    expect(subject).toContain("https://example.com/");
    expect(subject).toContain("82/100");
    expect(text).toContain("Health score: 82/100 (Good)");
    expect(text).toContain("https://chromabrew.com/audit/scan-1");
    expect(text).toContain("https://chromabrew.com/api/audit/scan/scan-1/bundle");
    expect(html).toContain("Open the full report");
    expect(html).toContain("Download the bundle");
  });

  it("reports the regression against the previous run", () => {
    const { text, html } = renderScheduleReportEmail(summary());
    expect(text).toContain("New since last run: 2 · Fixed: 1.");
    expect(html).toContain("New since last run: 2");

    const first = renderScheduleReportEmail(
      summary({ newSinceLast: null, fixedSinceLast: null }),
    );
    expect(first.text).toContain("First finished scan of this site");
  });

  it("says so explicitly when the scan found nothing", () => {
    const { text, html } = renderScheduleReportEmail(summary({ total: 0, topFindings: [] }));
    expect(text).toContain("found nothing to complain about");
    expect(html).toContain("found nothing to complain about");
  });

  it("escapes finding titles in the HTML half", () => {
    const { html } = renderScheduleReportEmail(
      summary({ topFindings: [{ severity: "high", title: '<img src=x onerror="evil()">' }] }),
    );
    expect(html).not.toContain('<img src=x onerror="evil()">');
    expect(html).toContain("&lt;img");
  });
});
