import { describe, expect, it } from "vitest";
import {
  exportDate,
  exportSlug,
  exportTitle,
  exportVersion,
  formatExportDate,
  preparedForLine,
  slugify,
  whiteLabelFilename,
  whiteLabelLines,
} from "./context";
import { buildDesignSystem, normaliseConfig } from "..";

function system() {
  return buildDesignSystem(
    normaliseConfig({
      primary: "#47003a",
      paletteStrategy: "complementary",
      radiusStyle: "soft",
      typeRatio: 1.25,
    }),
  );
}

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Acme Dashboard")).toBe("acme-dashboard");
    expect(slugify("  Client X — Q3! ")).toBe("client-x-q3");
  });

  it("never returns an empty slug", () => {
    expect(slugify("!!!")).toBe("design-system");
    expect(slugify("")).toBe("design-system");
  });
});

describe("export naming", () => {
  it("falls back to legacy names without a project", () => {
    expect(exportSlug()).toBe("design-tokens");
    expect(exportTitle(undefined, "ChromaBrew Starter")).toBe("ChromaBrew Starter");
    expect(exportVersion()).toBe("v1");
    expect(whiteLabelFilename("design-tokens.css")).toBe("design-tokens.css");
  });

  it("derives everything from the project name", () => {
    const ctx = { projectName: "Acme Dashboard" };
    expect(exportSlug(ctx)).toBe("acme-dashboard");
    expect(exportTitle(ctx)).toBe("Acme Dashboard");
    expect(whiteLabelFilename("design-tokens.css", ctx)).toBe(
      "acme-dashboard-design-tokens.css",
    );
  });

  it("renders the prepared-for line only when a client is named", () => {
    expect(preparedForLine({ clientName: "Acme Inc" })).toBe("Prepared for Acme Inc · ");
    expect(preparedForLine({})).toBe("");
    expect(preparedForLine()).toBe("");
  });

  it("formats the date in UTC, independent of locale", () => {
    expect(formatExportDate(new Date(Date.UTC(2026, 9, 26)))).toBe("26 Oct 2026");
    expect(exportDate({ generatedAt: new Date(Date.UTC(2026, 0, 5)) })).toBe("5 Jan 2026");
  });

  it("computes one title + provenance for every surface", () => {
    const lines = whiteLabelLines(system(), {
      projectName: "Acme Dashboard",
      clientName: "Acme Inc",
      versionLabel: "v3",
      generatedAt: new Date(Date.UTC(2026, 9, 26)),
    }, "design tokens");
    expect(lines.title).toBe("Acme Dashboard design tokens");
    expect(lines.provenance).toBe(
      "Prepared for Acme Inc · v3 · 26 Oct 2026 · source #47003a",
    );
  });
});
