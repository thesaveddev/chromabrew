import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuditSection } from "./audit-section";

/**
 * The home-page section for the website audit.
 *
 * It is almost entirely claims, and a claim is exactly the kind of thing that
 * rots in silence: the section could promise crawling it does not do, or link to
 * a tool that was renamed, and nothing else in the suite would notice. Rendered
 * to static markup so no DOM dependency is needed, as the coverage panel's test
 * does.
 */
describe("AuditSection", () => {
  const html = renderToStaticMarkup(createElement(AuditSection));

  it("names the audit and says what it measures", () => {
    expect(html).toContain('id="audit-heading"');
    expect(html).toContain("Audit a live page and see what is actually failing");
    expect(html).toContain("Free website audit");
    expect(html).toContain("axe-core 4.13 plus ten structural rules");
    expect(html).toContain("Contrast measured from computed styles");
  });

  it("shows a real capture, described as one", () => {
    // next/image rewrites the src through the optimizer, so the path arrives
    // percent-encoded inside the `url` parameter rather than as a plain path.
    expect(html).toContain("audit-report.png");
    expect(html).toContain("url=%2Faudit-media%2Faudit-report.png");
    // The alt text is the only description a reader who cannot see the image
    // gets, so it has to carry the same "this is a real run" claim.
    expect(html).toMatch(/alt="A real audit report/);
    expect(html).toContain("A real report, not a mockup");
    // Height and width are stated, so the section does not shift as it loads.
    // They must be the capture's own 2x pixel count halved — 2304×2238 — or the
    // reserved box carries a slightly different ratio than the image.
    expect(html).toMatch(/width="1152"/);
    expect(html).toMatch(/height="1119"/);
  });

  it("does not claim capabilities the audit does not have", () => {
    // These are the promises the report explicitly refuses to make; see the
    // limitations note in scan-report.tsx. Each one here would be a false claim.
    expect(html).toContain("crawls up to 5 same-origin pages");
    expect(html).toContain("conformance certificate");
    expect(html).not.toMatch(/full[- ]site|entire site|all pages|certif(y|ied|ication)\b/i);
  });

  it("does not describe the audit as paid", () => {
    // It is free, and it is not a plan: no pricing, trial or upgrade language.
    expect(html.toLowerCase()).not.toMatch(
      /\bpremium\b|\bupgrade\b|\bsubscription\b|\bpricing\b|\btrial\b|\bpro plan\b/,
    );
  });

  it("points at the audit and at the tools that fix what it finds", () => {
    expect(html).toContain('href="/audit"');
    expect(html).toContain("Explore Website Audit");
    for (const href of [
      "/tools/contrast-checker",
      "/tools/wcag-palette-checker",
      "/tools/shade-generator",
      "/tools/dark-mode-generator",
    ]) {
      expect(html, `missing fix-it link to ${href}`).toContain(`href="${href}"`);
    }
  });
});
