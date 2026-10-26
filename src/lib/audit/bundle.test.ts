import { describe, expect, it } from "vitest";

import { buildScanBundle, renderReportMarkdown } from "./bundle";
import type { FindingDto, ScanResultsDto } from "./types";

/**
 * The bundle is the premium handoff, so it must never drift from the report:
 * the same DTO feeds both, and these tests assert the archive carries the
 * score, every finding and the screenshots. The ZIP writer stores files
 * uncompressed, so names and contents appear literally in the bytes.
 */

const finding: FindingDto = {
  id: "finding-1",
  ruleId: "color-contrast",
  category: "color_contrast",
  severity: "high",
  title: "Text contrast too low",
  description: "Two elements fail the 4.5:1 threshold.",
  whyMatters: "Low-vision readers cannot read the copy.",
  recommendation: "Darken the text.",
  implementation: "Use #1a1a1a on #ffffff.",
  elementSelector: "#lede",
  wcagCriterion: "1.4.3",
  detectionMethod: "deterministic",
  confidence: 1,
  pageUrl: "https://example.com/",
  createdAt: "2026-10-26T08:00:00.000Z",
  fix: null,
};

function results(): ScanResultsDto {
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
      createdAt: "2026-10-26T07:59:00.000Z",
      startedAt: "2026-10-26T07:59:01.000Z",
      completedAt: "2026-10-26T07:59:08.000Z",
      durationMs: 7500,
      ruleCount: 10,
      renderMode: "browser",
    },
    counts: { total: 1, critical: 0, high: 1, medium: 0, low: 0, informational: 0 },
    categories: { color_contrast: 1 },
    pages: [
      {
        id: "page-1",
        url: "https://example.com/",
        title: "Example Domain",
        statusCode: 200,
        loadTimeMs: 236,
        errorMessage: null,
        rendered: true,
        screenshotUrl: "/r/token/screenshot?page=page-1",
        elementRects: [],
      },
    ],
    findings: [finding],
    duplicatesGrouped: 0,
    coverage: {
      renderMode: "browser",
      renderFallbackReason: null,
      rulesRun: 10,
      axeRan: true,
      axeVersion: "4.13.0",
      axeError: null,
      axeFindings: 1,
      nativeFindings: 0,
      textSamplesMeasured: 40,
      textElementsUnmeasurable: 0,
      unmeasurableReasons: {},
      linksFound: 0,
      linksExternal: 0,
      blockedRequests: 0,
    },
  };
}

describe("renderReportMarkdown", () => {
  it("leads with the same health score the report panel shows", () => {
    // One high finding deducts 8 from 100.
    const md = renderReportMarkdown(results());
    expect(md).toContain("Health score: 92/100");
    expect(md).toContain("https://example.com/");
  });

  it("carries every finding with its fix, not just its title", () => {
    const md = renderReportMarkdown(results());
    expect(md).toContain("Text contrast too low");
    expect(md).toContain("Darken the text.");
    expect(md).toContain("Use #1a1a1a on #ffffff.");
    expect(md).toContain("WCAG: 1.4.3");
  });
});

describe("buildScanBundle", () => {
  it("packs markdown, JSON, readme and screenshots in one archive", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const zip = buildScanBundle(results(), [
      { name: "page-1-abcdefgh", url: "https://example.com/", png },
    ]);
    const text = new TextDecoder("latin1").decode(zip);
    expect(text).toContain("report.md");
    expect(text).toContain("report.json");
    expect(text).toContain("README.txt");
    expect(text).toContain("screenshots/page-1-abcdefgh.png");
    expect(text).toContain("Health score: 92/100");
    expect(text).toContain("Text contrast too low");
  });

  it("still bundles when no screenshot was captured", () => {
    const zip = buildScanBundle(results(), []);
    const text = new TextDecoder("latin1").decode(zip);
    expect(text).toContain("report.md");
    expect(text).toContain("no screenshots were captured");
    expect(text).not.toContain("screenshots/");
  });
});
