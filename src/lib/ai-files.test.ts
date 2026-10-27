import { describe, expect, it } from "vitest";

import {
  buildAiTxt,
  buildDiscoveryFiles,
  buildLlmsTxt,
  DEFAULT_AI_AGENTS,
} from "./ai-files";

/**
 * The files are the deliverable: they must be convention-shaped so crawlers
 * read them, and never contain junk from sloppy input. Empty sections get
 * dropped, junk URLs get dropped, bad input throws so the tool shows a
 * field-level message instead of handing over a broken file.
 */

describe("buildLlmsTxt", () => {
  it("renders the convention shape", () => {
    const txt = buildLlmsTxt({
      siteName: "Acme Bank",
      summary: "Everyday checking and savings.",
      homepage: "acmebank.com",
      sections: [
        {
          title: "Products",
          links: [
            { label: "Checking", url: "https://acmebank.com/checking", note: "No fees" },
            { label: "Savings", url: "https://acmebank.com/savings" },
          ],
        },
      ],
    });
    expect(txt).toContain("# Acme Bank");
    expect(txt).toContain("> Everyday checking and savings.");
    expect(txt).toContain("## Products");
    expect(txt).toContain("- [Checking](https://acmebank.com/checking): No fees");
    expect(txt).toContain("- [Savings](https://acmebank.com/savings)");
    expect(txt.endsWith("\n")).toBe(true);
  });

  it("drops empty sections and unusable URLs instead of emitting them", () => {
    const txt = buildLlmsTxt({
      siteName: "Acme",
      summary: "",
      homepage: "https://acme.example/",
      sections: [
        { title: "Empty", links: [{ label: "Nothing", url: "" }] },
        { title: "Bad", links: [{ label: "Also nothing", url: "http://" }] },
      ],
    });
    expect(txt).not.toContain("## Empty");
    expect(txt).not.toContain("## Bad");
  });

  it("refuses a file with no subject or no home", () => {
    expect(() =>
      buildLlmsTxt({ siteName: "  ", summary: "", homepage: "https://a.example/" }),
    ).toThrow("site name");
    expect(() =>
      buildLlmsTxt({ siteName: "Acme", summary: "", homepage: "not a url at all !!!" }),
    ).toThrow("homepage");
  });
});

describe("buildAiTxt", () => {
  it("names the site and permits the common crawlers by default", () => {
    const txt = buildAiTxt({ siteName: "Acme", homepage: "https://acme.example/" });
    expect(txt).toContain("# ai.txt for Acme");
    expect(txt).toContain("Site: https://acme.example/");
    for (const agent of DEFAULT_AI_AGENTS) {
      expect(txt).toContain(agent);
    }
  });

  it("disallows paths and omits blank fields", () => {
    const txt = buildAiTxt({
      siteName: "Acme",
      homepage: "https://acme.example/",
      allow: ["GPTBot"],
      disallow: ["/account", "/internal"],
    });
    expect(txt).toContain("Disallow:");
    expect(txt).toContain("  /account");
    expect(txt).not.toContain("Owner:");
    expect(txt).not.toContain("Contact:");
  });
});

describe("buildDiscoveryFiles", () => {
  it("returns both files in presentation order", () => {
    const files = buildDiscoveryFiles(
      { siteName: "Acme", summary: "Things.", homepage: "https://acme.example/" },
      { siteName: "Acme", homepage: "https://acme.example/" },
    );
    expect(files.map((f) => f.filename)).toEqual(["llms.txt", "ai.txt"]);
    expect(files.every((f) => f.content.length > 0)).toBe(true);
  });
});
