import { describe, expect, it } from "vitest";

import {
  AI_READINESS_RULE_COUNT,
  analyzeAiReadiness,
  blockedAiBots,
  classifyDiscoveryDoc,
  extractAiTrustSignals,
  parseRobotsTxt,
  type DiscoveryDoc,
} from "./ai-readiness";

function doc(overrides: Partial<DiscoveryDoc> = {}): DiscoveryDoc {
  return {
    status: 200,
    contentType: "text/plain; charset=utf-8",
    body: "User-agent: *\nDisallow:\n",
    ...overrides,
  };
}

describe("parseRobotsTxt", () => {
  it("groups consecutive user-agent lines and keeps disallows in order", () => {
    const groups = parseRobotsTxt(
      "User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /private\nDisallow: /tmp\n",
    );
    expect(groups).toEqual([
      { agents: ["gptbot", "claudebot"], disallows: ["/private", "/tmp"] },
    ]);
  });

  it("starts a new group after a rule line", () => {
    const groups = parseRobotsTxt(
      "User-agent: *\nDisallow: /admin\nUser-agent: GPTBot\nAllow: /\n",
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({ agents: ["*"], disallows: ["/admin"] });
    expect(groups[1]).toEqual({ agents: ["gptbot"], disallows: [] });
  });

  it("strips comments and matches directives case-insensitively", () => {
    const groups = parseRobotsTxt(
      "# block the bots\nUSER-AGENT: CCBot # common crawl\nDISALLOW: / # everything\n",
    );
    expect(groups).toEqual([{ agents: ["ccbot"], disallows: ["/"] }]);
  });

  it("ignores rules before any user-agent line", () => {
    expect(parseRobotsTxt("Disallow: /\nUser-agent: *\nDisallow: /x\n")).toEqual([
      { agents: ["*"], disallows: ["/x"] },
    ]);
  });

  it("keeps an empty disallow as an explicit allow", () => {
    const groups = parseRobotsTxt("User-agent: *\nDisallow:\n");
    expect(groups[0].disallows).toEqual([""]);
  });
});

describe("blockedAiBots", () => {
  it("names an AI agent disallowed from the root", () => {
    expect(
      blockedAiBots([{ agents: ["gptbot"], disallows: ["/private", "/"] }]),
    ).toEqual(["GPTBot"]);
  });

  it("treats a wildcard root block as blocking every AI crawler", () => {
    expect(blockedAiBots([{ agents: ["*"], disallows: ["/"] }])).toContain("GPTBot");
    expect(blockedAiBots([{ agents: ["*"], disallows: ["/"] }])).toContain("ClaudeBot");
  });

  it("does not flag partial disallows or explicit allows", () => {
    expect(blockedAiBots([{ agents: ["*"], disallows: ["/admin", ""] }])).toEqual([]);
    expect(blockedAiBots([{ agents: ["gptbot"], disallows: ["/search"] }])).toEqual([]);
  });

  it("ignores blocks aimed at other crawlers", () => {
    expect(
      blockedAiBots([{ agents: ["semrushbot"], disallows: ["/"] }]),
    ).toEqual([]);
  });
});

describe("classifyDiscoveryDoc", () => {
  it("marks a failed fetch as unavailable, never absent", () => {
    expect(classifyDiscoveryDoc(null)).toBe("unavailable");
    expect(classifyDiscoveryDoc(doc({ status: 500 }))).toBe("unavailable");
    expect(classifyDiscoveryDoc(doc({ status: 403 }))).toBe("unavailable");
  });

  it("marks 404 and 410 as absent", () => {
    expect(classifyDiscoveryDoc(doc({ status: 404, body: "nope" }))).toBe("absent");
    expect(classifyDiscoveryDoc(doc({ status: 410, body: "gone" }))).toBe("absent");
  });

  it("marks an empty body as absent", () => {
    expect(classifyDiscoveryDoc(doc({ body: "  \n" }))).toBe("absent");
  });

  it("treats an HTML error page wearing the file's URL as absent", () => {
    expect(
      classifyDiscoveryDoc(
        doc({
          contentType: "text/html; charset=utf-8",
          body: "<!doctype html><html><head><title>Not found</title></head></html>",
        }),
      ),
    ).toBe("absent");
  });

  it("accepts a real file even when the server labels it HTML", () => {
    expect(
      classifyDiscoveryDoc(
        doc({
          contentType: "text/html",
          body: "# Site\n\nA summary.\n",
        }),
      ),
    ).toBe("present");
  });

  it("marks a served file as present", () => {
    expect(classifyDiscoveryDoc(doc())).toBe("present");
  });
});

describe("extractAiTrustSignals", () => {
  it("recognises contact, support and mailto links", () => {
    expect(extractAiTrustSignals('<a href="/contact">Contact</a>').hasContactLink).toBe(true);
    expect(extractAiTrustSignals('<a href="https://x.test/support">Help</a>').hasContactLink).toBe(
      true,
    );
    expect(extractAiTrustSignals('<a href="mailto:hi@x.test">Email</a>').hasContactLink).toBe(
      true,
    );
  });

  it("does not mistake an about page for a contact link", () => {
    const signals = extractAiTrustSignals('<a href="/about">About</a>');
    expect(signals.hasContactLink).toBe(false);
  });

  it("finds Organization schema inside JSON-LD script blocks", () => {
    const html = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"X"}</script>`;
    expect(extractAiTrustSignals(html).hasOrganizationSchema).toBe(true);
  });

  it("reports neither signal on a bare page", () => {
    expect(extractAiTrustSignals("<body><h1>Hi</h1></body>")).toEqual({
      hasContactLink: false,
      hasOrganizationSchema: false,
    });
  });
});

describe("analyzeAiReadiness", () => {
  it("stays silent when every document is present and trust signals exist", () => {
    const { findings, facts } = analyzeAiReadiness({
      robots: doc(),
      llms: doc({ contentType: "text/markdown", body: "# Site\n" }),
      hasContactLink: true,
      hasOrganizationSchema: false,
    });
    expect(findings).toEqual([]);
    expect(facts).toEqual({ robots: "present", llms: "present", blockedBots: [] });
  });

  it("counts four rules in the catalogue", () => {
    expect(AI_READINESS_RULE_COUNT).toBe(4);
  });

  it("reports a missing robots.txt as informational", () => {
    const { findings } = analyzeAiReadiness({
      robots: doc({ status: 404, body: "nope" }),
      llms: doc({ contentType: "text/markdown", body: "# Site\n" }),
      hasContactLink: true,
      hasOrganizationSchema: true,
    });
    expect(findings.map((finding) => finding.ruleId)).toEqual(["ai-robots-txt"]);
    expect(findings[0].severity).toBe("informational");
  });

  it("reports blocked AI crawlers by name as a low finding", () => {
    const { findings, facts } = analyzeAiReadiness({
      robots: doc({ body: "User-agent: *\nDisallow: /\n" }),
      llms: doc({ contentType: "text/markdown", body: "# Site\n" }),
      hasContactLink: true,
      hasOrganizationSchema: true,
    });
    const blocked = findings.find((finding) => finding.ruleId === "ai-bot-blocked");
    expect(blocked?.severity).toBe("low");
    expect(blocked?.title).toContain("GPTBot");
    expect(facts.blockedBots).toContain("GPTBot");
  });

  it("cross-links the llms.txt generator when the file is missing", () => {
    const { findings } = analyzeAiReadiness({
      robots: doc(),
      llms: doc({ status: 404, body: "nope" }),
      hasContactLink: true,
      hasOrganizationSchema: true,
    });
    const llmsFinding = findings.find((finding) => finding.ruleId === "ai-llms-txt");
    expect(llmsFinding?.recommendation).toContain("/tools/llms-txt-generator");
  });

  it("reports missing trust signals only when both are absent", () => {
    const none = analyzeAiReadiness({
      robots: doc(),
      llms: doc({ contentType: "text/markdown", body: "# Site\n" }),
      hasContactLink: false,
      hasOrganizationSchema: false,
    });
    expect(none.findings.map((finding) => finding.ruleId)).toEqual(["ai-trust-signals"]);

    for (const signals of [
      { hasContactLink: true, hasOrganizationSchema: false },
      { hasContactLink: false, hasOrganizationSchema: true },
    ]) {
      const { findings } = analyzeAiReadiness({
        robots: doc(),
        llms: doc({ contentType: "text/markdown", body: "# Site\n" }),
        ...signals,
      });
      expect(findings).toEqual([]);
    }
  });

  it("draws no findings from documents the fetch could not retrieve", () => {
    const { findings, facts } = analyzeAiReadiness({
      robots: null,
      llms: null,
      hasContactLink: false,
      hasOrganizationSchema: false,
    });
    // The trust signals come from the page itself, so they still report;
    // the unreachable documents stay silent rather than reading as absent.
    expect(findings.map((finding) => finding.ruleId)).toEqual(["ai-trust-signals"]);
    expect(facts).toEqual({ robots: "unavailable", llms: "unavailable", blockedBots: [] });
  });
});
