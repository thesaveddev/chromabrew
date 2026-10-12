import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScanReport } from "./scan-report";
import type { FindingDto, ScanCoverageDto, ScanResultsDto } from "@/lib/audit/types";

/**
 * One implementation of a report serves both the owner's page and the shared
 * link, so what it renders is asserted directly: the screenshot, the findings
 * and the coverage panel. Rendered with `renderToStaticMarkup` (as the coverage
 * panel test does) so no test-only DOM dependency is needed.
 *
 * The screenshot URL here is the token-scoped one a shared report carries; the
 * component must render the URL it is given rather than building its own, which
 * is what keeps a shared page free of scan-scoped links.
 */

const TOKEN = "AYc5QcwU70Ln7WkO48Xc23k4CYQ-9ukb";

const coverage: ScanCoverageDto = {
  renderMode: "browser",
  renderFallbackReason: null,
  rulesRun: 10,
  axeRan: true,
  axeVersion: "4.13.0",
  axeError: null,
  axeFindings: 3,
  nativeFindings: 4,
  textSamplesMeasured: 201,
  textElementsUnmeasurable: 0,
  unmeasurableReasons: {},
  linksFound: 1,
  linksExternal: 1,
  blockedRequests: 0,
};

const finding: FindingDto = {
  id: "finding-1",
  ruleId: "meta-description",
  category: "metadata",
  severity: "medium",
  title: "Page has no meta description",
  description: "No meta description was found in the rendered document.",
  whyMatters: null,
  recommendation: "Add a description that summarises the page.",
  implementation: null,
  elementSelector: "head",
  wcagCriterion: null,
  detectionMethod: "deterministic",
  confidence: null,
  pageUrl: "https://example.com/",
  createdAt: "2026-10-12T08:00:00.000Z",
  fix: null,
};

function report(overrides: Partial<ScanResultsDto> = {}): ScanResultsDto {
  return {
    scan: {
      id: "scan-1",
      url: "https://example.com/",
      normalizedUrl: "https://example.com/",
      status: "completed",
      stage: "preparing",
      scope: "single_page",
      viewportWidth: 1280,
      viewportHeight: 720,
      pagesScanned: 1,
      pagesTotal: 1,
      pagesFailed: 0,
      errorMessage: null,
      createdAt: "2026-10-12T07:59:00.000Z",
      startedAt: "2026-10-12T07:59:01.000Z",
      completedAt: "2026-10-12T07:59:08.000Z",
      durationMs: 7500,
      ruleCount: 10,
      renderMode: "browser",
    },
    counts: { total: 4, critical: 0, high: 0, medium: 4, low: 0, informational: 0 },
    categories: { metadata: 4 },
    pages: [
      {
        id: "page-1",
        url: "https://example.com/",
        title: "Example Domain",
        statusCode: 200,
        loadTimeMs: 236,
        errorMessage: null,
        rendered: true,
        screenshotUrl: `/r/${TOKEN}/screenshot?page=page-1`,
      },
    ],
    findings: [finding],
    duplicatesGrouped: 1,
    coverage,
    ...overrides,
  };
}

const render = (overrides: Partial<ScanResultsDto> = {}) =>
  renderToStaticMarkup(createElement(ScanReport, { results: report(overrides) }));

describe("ScanReport", () => {
  it("shows the rendered screenshot from the URL the report carries", () => {
    const html = render();
    expect(html).toContain("<img");
    expect(html).toContain(`/r/${TOKEN}/screenshot?page=page-1`);
    expect(html).toContain("as the scanner rendered it");
    expect(html).toContain("1280×720");
  });

  it("shows the coverage panel, not just the findings", () => {
    const html = render();
    expect(html).toContain("What ran on this page");
    expect(html).toContain("10 native rules");
    expect(html).toContain("axe-core 4.13.0 ran");
    expect(html).toContain("201 text samples measured");
  });

  it("names the audited URL, the page and its response", () => {
    const html = render();
    expect(html).toContain("Example Domain");
    expect(html).toContain("https://example.com/");
    expect(html).toContain("HTTP 200");
    expect(html).toContain("10 rules ran");
  });

  it("renders each finding with its severity", () => {
    const html = render();
    expect(html).toContain("Page has no meta description");
    expect(html).toContain("Medium");
    expect(html).toContain("4 issues");
    expect(html).toContain("1 duplicate report grouped");
  });

  it("marks how the page was analysed", () => {
    expect(render()).toContain("Rendered in a browser");

    // Both copies of the render mode come from the same recorded fact, so a
    // fetch-only scan is described as one everywhere on the page.
    const fetched = render({
      scan: { ...report().scan, renderMode: "fetch" },
      coverage: { ...coverage, renderMode: "fetch" },
    });
    expect(fetched).toContain("Served HTML only");
    expect(fetched).toContain("Not measured — the page was fetched, not rendered");
    // The measurement that never happened must not be reported as though it had.
    expect(fetched).not.toContain("201 text samples measured");
  });

  it("shows no screenshot when none was captured", () => {
    const html = render({
      pages: [{ ...report().pages[0], screenshotUrl: null }],
    });
    expect(html).not.toContain("<img");
    expect(html).not.toContain("as the scanner rendered it");
  });

  it("says plainly that nothing has been changed on the audited site", () => {
    const html = render();
    expect(html).toContain("not a\ncertificate of conformance".replace("\n", " "));
    expect(html).toContain("before-and-after previews do not exist");
  });

  it("flags a partially completed scan instead of presenting it as clean", () => {
    const html = render({
      scan: {
        ...report().scan,
        status: "partially_completed",
        errorMessage: "The page answered 503.",
      },
    });
    expect(html).toContain("The page answered 503.");
  });
});
