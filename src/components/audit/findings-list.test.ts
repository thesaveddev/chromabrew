import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FindingCard } from "./findings-list";
import { IN_SITU_MAX_PX } from "@/lib/audit/in-situ-sample";
import type { FindingDto, ProposedFixData } from "@/lib/audit/types";

/**
 * The in-situ preview is a claim about what the reader's own page will look
 * like, so what matters is the markup that reaches the browser — the words
 * drawn, the size and weight they are drawn at, and the colours on both sides.
 * Rendered with `renderToStaticMarkup` so no test-only DOM dependency is needed.
 */
function contrastFix(overrides: Partial<NonNullable<ProposedFixData["contrast"]>> = {}): ProposedFixData {
  return {
    kind: "contrast",
    summary: "Keep the background: the text colour becomes #595960.",
    changes: [{ property: "color", before: "#9f9fa9", after: "#595960" }],
    css: null,
    tokens: [],
    validation: {
      rule: "WCAG 2.2 SC 1.4.3 Contrast (Minimum), Level AA — 4.5:1 for body text (16px, weight 400)",
      before: "2.62:1",
      after: "4.62:1",
      passed: true,
    },
    contrast: {
      foregroundBefore: "#9f9fa9",
      foregroundAfter: "#595960",
      background: "#ffffff",
      required: 4.5,
      ratioAfter: 4.62,
      fontSizePx: 16,
      fontWeight: 400,
      sampleText: "Buy now",
      ...overrides,
    },
  };
}

function finding(fix: ProposedFixData | null): FindingDto {
  return {
    id: "f1",
    ruleId: "color-contrast",
    category: "color_contrast",
    severity: "high",
    title: "Text contrast is 2.62:1 (needs 4.5:1)",
    description: "Text in p.lede is #9f9fa9 on #ffffff — a measured contrast ratio of 2.62:1.",
    whyMatters: null,
    recommendation: null,
    implementation: null,
    elementSelector: "p.lede",
    wcagCriterion: "WCAG 2.2 SC 1.4.3",
    detectionMethod: "deterministic",
    confidence: 1,
    pageUrl: null,
    createdAt: "2026-10-12T00:00:00Z",
    fix,
  };
}

const render = (fix: ProposedFixData | null) =>
  renderToStaticMarkup(createElement(FindingCard, { finding: finding(fix) }));

describe("the proposed fix drawn in situ", () => {
  it("draws the element's own words instead of a stand-in, on both sides", () => {
    const html = render(contrastFix());
    expect(html).toContain(">Buy now</p>");
    expect(html).not.toContain(">Aa</p>");
    // Once for the failing colour and once for the fixed one.
    expect(html.match(/>Buy now<\/p>/g)).toHaveLength(2);
  });

  it("draws each side at the size and weight the scan measured", () => {
    const html = render(contrastFix({ fontSizePx: 19, fontWeight: 700 }));
    expect(html).toContain("font-size:19px;font-weight:700");
    expect(html).toContain("measured at 19px, weight 700");
  });

  it("puts the failing colour before and the fixed colour after, on the same surface", () => {
    const html = render(contrastFix());
    expect(html).toContain("color:#9f9fa9;font-size:16px");
    expect(html).toContain("color:#595960;font-size:16px");
    // Both samples sit on the measured background, not a themed one.
    expect(html.match(/style="background-color:#ffffff"/g)).toHaveLength(2);
    expect(html.indexOf("#9f9fa9")).toBeLessThan(html.indexOf("#595960"));
  });

  it("names each side for assistive technology, in one announcement", () => {
    const html = render(contrastFix());
    expect(html).toContain('role="img"');
    expect(html).toContain("Before: &quot;Buy now&quot; in #9f9fa9 on #ffffff, at 16px weight 400");
    expect(html).toContain("After: &quot;Buy now&quot; in #595960 on #ffffff, at 16px weight 400");
    // The drawn text is hidden so it is not read a second time, out of context.
    expect(html).toContain('aria-hidden="true"');
  });

  it("keeps the caption outside the block it is judging", () => {
    // A caption painted on the very background under test could itself be
    // unreadable, which would be the report demonstrating its own problem.
    const html = render(contrastFix());
    const block = html.slice(html.indexOf('style="background-color:#ffffff"'));
    expect(block.slice(0, block.indexOf("</div>"))).not.toContain("on #ffffff");
    expect(html).toContain("Before · ");
    expect(html).toContain("After · ");
  });

  it("says the text is a stand-in when the scan could not capture it", () => {
    const html = render(contrastFix({ sampleText: null }));
    expect(html).toContain(">Aa</p>");
    expect(html).toContain("was not captured");
    expect(html).not.toContain("own text");
  });

  it("refuses to imply a size it did not draw", () => {
    const html = render(contrastFix({ fontSizePx: 72 }));
    expect(html).toContain(`font-size:${IN_SITU_MAX_PX}px`);
    expect(html).not.toContain("font-size:72px");
    expect(html).toContain(`measured at 72px, shown at ${IN_SITU_MAX_PX}px`);
  });

  it("treats the scanned page's text as text, never as markup", () => {
    // The sample is a snippet of someone else's page, so it must not be able to
    // open a tag or close an attribute however it is written.
    const injected = '<img src=x onerror="alert(1)">Sale';
    const html = render(contrastFix({ sampleText: injected }));
    expect(html).not.toContain(injected);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;Sale");
  });

  it("renders no preview at all for a colourless fix, which has nothing to draw", () => {
    const html = render({
      kind: "text_length",
      summary: "Shortened the meta description.",
      changes: [{ property: "meta description", before: "long", after: "short" }],
      css: null,
      tokens: [],
      validation: { rule: "120-155 characters", before: "210", after: "150", passed: true },
      contrast: null,
    });
    expect(html).not.toContain("<figure");
    // The re-measured claim still stands on its own.
    expect(html).toContain("150");
  });
});
