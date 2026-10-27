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
    expect(html).toContain("axe-core 4.13");
    expect(html).toContain("computed styles");
  });

  it("does not claim capabilities the audit does not have", () => {
    expect(html).toContain("Nothing is changed on your site");
    expect(html).not.toMatch(/full[- ]site|entire site|all pages|certif(y|ied|ication)\b/i);
  });

  it("does not describe the audit as paid", () => {
    expect(html.toLowerCase()).not.toMatch(
      /\bpremium\b|\bupgrade\b|\bsubscription\b|\bpricing\b|\btrial\b|\bpro plan\b/,
    );
  });

  it("points at the audit and at a fix-it tool", () => {
    expect(html).toContain('href="/audit"');
    expect(html).toContain("Explore Website Audit");
    expect(html).toContain('href="/tools/contrast-checker"');
  });
});
