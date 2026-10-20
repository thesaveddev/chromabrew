import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SCAN_QUEUE_ABANDON_MS, SCAN_QUEUE_NOTICE_MS } from "@/lib/audit/types";
import { ScanProgressView, type ScanProgressStatus } from "./scan-progress";

/**
 * The progress view is the only thing a reader has while a scan is running, and
 * the one thing it must never do is imply progress that is not happening.
 * Rendered to static markup so no DOM dependency is needed, as the coverage
 * panel's test does.
 */
const CREATED_AT = "2026-10-13T12:00:00.000Z";
const QUEUED_AT = Date.parse(CREATED_AT);

function render(
  status: Partial<ScanProgressStatus>,
  waitedMs: number,
): string {
  const full: ScanProgressStatus = {
    id: "cmv4verify",
    status: "queued",
    pagesScanned: 0,
    pagesTotal: 1,
    errorMessage: null,
    createdAt: CREATED_AT,
    startedAt: null,
    completedAt: null,
    ...status,
  };
  return renderToStaticMarkup(
    createElement(ScanProgressView, { status: full, now: QUEUED_AT + waitedMs }),
  );
}

describe("ScanProgressView", () => {
  it("keeps the ordinary progress copy while a queued scan is still inside the notice window", () => {
    const html = render({}, SCAN_QUEUE_NOTICE_MS - 1_000);

    expect(html).not.toContain("Waiting for a scanner");
    expect(html).toContain("Pages scanned: 0 / 1");
    expect(html).toContain("the report appears here as soon as the scan finishes");
  });

  it("says it is waiting for a scanner once a queued scan passes the notice window", () => {
    const html = render({}, 30_000);

    expect(html).toContain("Waiting for a scanner");
    expect(html).toContain("Your audit is queued and starts as soon as a scanner is free");
    // The wait is stated, not implied: 30s at the moment this render was taken.
    expect(html).toContain("Queued for 30s.");
    // And the checklist's claim of progress is gone with it.
    expect(html).not.toContain("Pages scanned: 0 / 1");
  });

  it("counts the wait in minutes once it is long enough to need them", () => {
    const html = render({}, 95_000);

    expect(html).toContain("Queued for 1m 35s.");
  });

  it("still waits when the clock has run past the point the server would close the scan", () => {
    // The server reaps an abandoned scan on the next poll, so this render is a
    // sub-second window — but claiming progress in it would be a lie either way.
    const html = render({}, SCAN_QUEUE_ABANDON_MS + 5_000);

    expect(html).toContain("Waiting for a scanner");
  });

  it("shows a running scan as running rather than waiting", () => {
    const html = render(
      { status: "running", stage: "analyzing", normalizedUrl: "https://example.com/pricing" },
      60_000,
    );

    // The heading names the real work and the real host — not a generic
    // status word — and it is unmistakably not the queue state.
    expect(html).toContain("Auditing example.com");
    expect(html).toContain("example.com/pricing");
    expect(html).not.toContain("Waiting for a scanner");
  });

  it("lights the real stage in the checklist and counts the running time", () => {
    const html = render(
      {
        status: "running",
        stage: "analyzing",
        normalizedUrl: "https://example.com/",
        startedAt: CREATED_AT,
      },
      65_000,
    );

    // Every stage is listed, the reported one is marked in progress, and the
    // ones before it are complete — all three states come from the worker's
    // own stage field, never from a timer in the UI.
    expect(html).toContain("Validating URL");
    expect(html).toContain("Fetching website");
    expect(html).toContain("Analysing page");
    expect(html).toContain("Preparing findings");
    expect(html).toContain("in progress");
    expect(html).toContain("running for 1m 05s");
  });

  it("shows page-by-page progress for a multi-page crawl", () => {
    const html = render(
      { status: "running", stage: "rendering", pagesScanned: 1, pagesTotal: 5 },
      30_000,
    );

    expect(html).toContain("Pages scanned: 1 / 5");
    expect(html).toContain("Page 2 of 5");
    expect(html).toContain("1 done");
  });

  it("keeps the scanner bay out of the queue state", () => {
    // Nothing is being fetched while queued, so the bay must not animate or
    // imply a stage: the sweep and the stage rail are for live work only.
    const html = render({}, 30_000);

    expect(html).not.toContain("scanner-sweep");
    expect(html).not.toContain("in progress");
  });

  it("shows the real stage to the scan page once the status route reports it", () => {
    // The stage lives in scan metadata and the status route now returns it;
    // before, this view could only say "running" with nothing to show.
    const html = render({ status: "running", stage: "preparing" }, 10_000);

    expect(html).toContain("Preparing findings");
    expect(html).toContain("Validating URL");
  });

  it("explains a failed scan and offers the way back to the form", () => {
    const html = render(
      {
        status: "failed",
        errorMessage: "No scanner started this audit in time, so it was cancelled.",
      },
      0,
    );

    expect(html).toContain("This audit could not run");
    expect(html).toContain("No scanner started this audit in time");
    expect(html).toContain("Nothing was scanned. You can run the audit again.");
    expect(html).toContain('href="/audit"');
  });
});
