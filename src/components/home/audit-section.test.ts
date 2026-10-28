import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuditSection } from "./audit-section";

/**
 * The home-page section for the website audit.
 *
 * It is almost entirely claims, and a claim is exactly the kind of thing that
 * rots in silence. Rendered to static markup so no DOM dependency is needed.
 */
describe("AuditSection", () => {
  const html = renderToStaticMarkup(createElement(AuditSection));

  it("names the audit and says what it measures", () => {
    expect(html).toContain('id="audit-heading"');
    expect(html).toContain("Audit a live website. Find what needs improving.");
    expect(html).toContain("Free website audit");
    expect(html).toContain("axe-core 4.13 plus");
    expect(html).toContain("computed styles");
  });

  it("shows the five-step journey and a real capture", () => {
    expect(html).toContain("Enter a public website URL");
    expect(html).toContain("Re-scan to validate fixes");
    expect(html).toContain("audit-report.png");
    expect(html).toContain("url=%2Faudit-media%2Faudit-report.png");
    expect(html).toMatch(/alt="A real audit report/);
    expect(html).toContain("A real report, not a mockup");
    expect(html).toMatch(/width="1152"/);
    expect(html).toMatch(/height="1119"/);
  });

  it("does not claim capabilities the audit does not have", () => {
    expect(html).toContain("Nothing is changed on your site");
    expect(html).toContain("not a conformance certificate");
    expect(html).not.toMatch(/full[- ]site|entire site|all pages|certif(y|ied|ication)\b/i);
  });

  it("does not describe the audit as paid", () => {
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
