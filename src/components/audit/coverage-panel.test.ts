import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CoveragePanel } from "./coverage-panel";
import type { ScanCoverageDto } from "@/lib/audit/types";

/**
 * The panel is what the reader uses to tell "nothing is wrong" from "nothing was
 * checked", so its rendered text is asserted rather than its props. Rendered with
 * `renderToStaticMarkup` so no test-only DOM dependency is needed.
 */
function render(coverage: Partial<ScanCoverageDto> = {}): string {
  const full: ScanCoverageDto = {
    renderMode: "browser",
    renderFallbackReason: null,
    rulesRun: 10,
    axeRan: true,
    axeVersion: "4.13.0",
    axeError: null,
    axeFindings: 6,
    nativeFindings: 7,
    textSamplesMeasured: 158,
    textElementsUnmeasurable: 0,
    unmeasurableReasons: {},
    linksFound: 138,
    linksExternal: 65,
    blockedRequests: 0,
    ...coverage,
  };
  return renderToStaticMarkup(createElement(CoveragePanel, { coverage: full }));
}

describe("CoveragePanel", () => {
  it("states what each engine did", () => {
    const html = render();

    expect(html).toContain("What ran on this page");
    expect(html).toContain("10 native rules");
    expect(html).toContain("7 findings on the rendered document");
    expect(html).toContain("axe-core 4.13.0 ran");
    expect(html).toContain("6 violations");
    expect(html).toContain("158 text samples measured");
    expect(html).toContain("138 distinct links");
    expect(html).toContain("65 point off this site");
  });

  it("says an engine failed instead of implying it found nothing", () => {
    const html = render({
      axeRan: false,
      axeError: "ReferenceError: t is not defined",
      axeFindings: 0,
    });

    expect(html).toContain("Did not run");
    expect(html).toContain("ReferenceError: t is not defined");
    expect(html).toContain("were not checked");
    // Never presented as a clean result.
    expect(html).not.toContain("no violations");
  });

  it("distinguishes a fetch-only scan from a measured one", () => {
    const html = render({
      renderMode: "fetch",
      renderFallbackReason: "Browser rendering is not installed on this server.",
      axeRan: false,
      axeVersion: null,
      textSamplesMeasured: 0,
      textElementsUnmeasurable: 0,
      linksFound: null,
      linksExternal: null,
    });

    expect(html).toContain("Not measured — the page was fetched, not rendered");
    expect(html).toContain("Not collected");
    // The absence of a link count must not read as zero links.
    expect(html).not.toContain("0 distinct links");
  });

  it("explains why text could not be measured", () => {
    const html = render({
      textElementsUnmeasurable: 105,
      unmeasurableReasons: { background_image: 74, altered_rendering: 31 },
    });

    expect(html).toContain("105 text elements could not be measured");
    expect(html).toContain("74 sit on an image or gradient");
    expect(html).toContain("31 have a filter or blend mode applied");
  });

  it("reports refused requests only when there were any", () => {
    expect(render().includes("Safety policy")).toBe(false);
    expect(render({ blockedRequests: 2 })).toContain("2 subresource requests were refused");
  });
});
