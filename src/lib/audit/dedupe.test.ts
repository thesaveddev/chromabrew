import { describe, expect, it } from "vitest";
import { dedupeFindings, RULE_TOPICS, topicFor } from "./dedupe";
import type { FindingDraft } from "./types";

/** The minimal shape the dedupe needs — no FindingDraft-only field is required. */
interface Sample {
  ruleId: string;
  elementSelector: string | null;
}

function sample(ruleId: string, elementSelector: string | null = null): Sample {
  return { ruleId, elementSelector };
}

function draft(ruleId: string, elementSelector: string | null = null): FindingDraft {
  return {
    ruleId,
    category: "accessibility",
    severity: "medium",
    title: `Finding for ${ruleId}`,
    description: "What was measured.",
    whyMatters: "Why it matters.",
    recommendation: "What to change.",
    implementation: "How to change it.",
    elementSelector,
    originalValues: null,
    suggestedValues: null,
    evidence: null,
    wcagCriterion: null,
    detectionMethod: "deterministic",
    confidence: 1,
  };
}

describe("topicFor", () => {
  it("maps both engines' rule ids onto one topic key", () => {
    expect(topicFor("img-alt")).toBe("topic:img-alt");
    expect(topicFor("axe:image-alt")).toBe("topic:img-alt");
    expect(topicFor("contrast-text")).toBe("topic:text-contrast");
    expect(topicFor("axe:color-contrast")).toBe("topic:text-contrast");
  });

  it("leaves a rule that belongs to no topic as its own group", () => {
    expect(topicFor("meta-description")).toBe("meta-description");
    expect(topicFor("robots-noindex")).toBe("robots-noindex");
    expect(topicFor("axe:landmark-one-main")).toBe("axe:landmark-one-main");
  });
});

describe("dedupeFindings", () => {
  it("keeps exactly one account of a problem reported by both engines", () => {
    const result = dedupeFindings([sample("img-alt", "img"), sample("axe:image-alt", "img")]);
    expect(result.kept).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
  });

  it("honours the documented survivor for every declared topic", () => {
    for (const topic of RULE_TOPICS) {
      const preferred = topic.prefer === "axe" ? topic.axe : topic.native;
      const other = topic.prefer === "axe" ? topic.native : topic.axe;
      const result = dedupeFindings([sample(topic.native), sample(topic.axe)]);

      expect(result.kept.map((finding) => finding.ruleId)).toEqual([preferred]);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].finding.ruleId).toBe(other);
      expect(result.duplicates[0].groupId).toBe(`topic:${topic.topic}`);
      expect(result.duplicates[0].keptRuleId).toBe(preferred);
    }
  });

  it("prefers axe for image alt text", () => {
    const result = dedupeFindings([sample("img-alt"), sample("axe:image-alt")]);
    expect(result.kept[0].ruleId).toBe("axe:image-alt");
    expect(result.duplicates[0].finding.ruleId).toBe("img-alt");
    expect(result.duplicates[0].groupId).toBe("topic:img-alt");
  });

  it("prefers our measured contrast finding over axe's", () => {
    const result = dedupeFindings([sample("axe:color-contrast"), sample("contrast-text")]);
    expect(result.kept[0].ruleId).toBe("contrast-text");
    expect(result.duplicates[0].finding.ruleId).toBe("axe:color-contrast");
    expect(result.duplicates[0].keptRuleId).toBe("contrast-text");
  });

  it("keeps a finding whose topic has only the unpreferred engine", () => {
    const result = dedupeFindings([sample("axe:image-alt"), sample("img-alt")]);
    expect(result.kept).toHaveLength(1);
    expect(dedupeFindings([sample("contrast-text")]).kept).toHaveLength(1);
    expect(dedupeFindings([sample("axe:image-alt")]).kept).toHaveLength(1);
    expect(result.duplicates[0].keptRuleId).toBe("axe:image-alt");
  });

  it("passes unrelated rules through untouched, in their original order", () => {
    const input = [
      sample("robots-noindex"),
      sample("img-alt"),
      sample("meta-description"),
      sample("axe:image-alt"),
      sample("meta-title-length"),
    ];
    const result = dedupeFindings(input);
    // Kept findings stay in input order, so meta-description (index 2) comes
    // before axe:image-alt (index 3) even though axe is the survivor of its topic.
    expect(result.kept.map((finding) => finding.ruleId)).toEqual([
      "robots-noindex",
      "meta-description",
      "axe:image-alt",
      "meta-title-length",
    ]);
    expect(result.duplicates.map((entry) => entry.finding.ruleId)).toEqual(["img-alt"]);
  });

  it("handles several overlapping topics in one pass, independently", () => {
    const input = [
      sample("axe:html-has-lang"),
      sample("html-lang"),
      sample("heading-h1"),
      sample("axe:page-has-heading-one"),
      sample("contrast-text"),
      sample("axe:color-contrast"),
      sample("meta-viewport"),
      sample("axe:meta-viewport"),
    ];
    const result = dedupeFindings(input);

    expect(result.kept.map((finding) => finding.ruleId)).toEqual([
      "axe:html-has-lang",
      "heading-h1",
      "contrast-text",
      "axe:meta-viewport",
    ]);
    expect(result.duplicates.map((entry) => entry.groupId)).toEqual([
      "topic:html-lang",
      "topic:primary-heading",
      "topic:text-contrast",
      "topic:viewport",
    ]);
  });

  it("reports duplicates in input order", () => {
    const input = [
      sample("axe:image-alt"),
      sample("axe:document-title", "head > title"),
      sample("img-alt"),
      sample("meta-title"),
    ];
    const result = dedupeFindings(input);
    expect(result.duplicates.map((entry) => entry.finding.ruleId)).toEqual([
      "img-alt",
      "meta-title",
    ]);
  });

  it("returns empty results for empty input", () => {
    expect(dedupeFindings([])).toEqual({ kept: [], duplicates: [] });
  });

  it("never mutates the input array or its objects", () => {
    const input = [sample("img-alt", "img"), sample("axe:image-alt", "img")];
    const snapshot = JSON.stringify(input);
    dedupeFindings(input);
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(input).toHaveLength(2);
  });

  it("keeps repeat occurrences of the same rule rather than collapsing them", () => {
    const result = dedupeFindings([sample("axe:image-alt", "img.a"), sample("axe:image-alt", "img.b")]);
    expect(result.kept).toHaveLength(2);
    expect(result.duplicates).toHaveLength(0);
  });

  it("is deterministic for the same input", () => {
    const input = [sample("img-alt"), sample("axe:image-alt"), sample("contrast-text")];
    expect(dedupeFindings(input)).toEqual(dedupeFindings(input));
  });

  it("works on full FindingDraft objects and preserves them by reference", () => {
    const native = draft("img-alt", "img");
    const axe = draft("axe:image-alt", "img");
    const result = dedupeFindings([native, axe]);

    expect(result.kept).toHaveLength(1);
    expect(result.kept[0]).toBe(axe);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].finding).toBe(native);
    expect(result.duplicates[0].groupId).toBe("topic:img-alt");
    expect(result.duplicates[0].keptRuleId).toBe("axe:image-alt");
  });

  it("keeps a single finding that overlaps nothing", () => {
    const result = dedupeFindings([sample("meta-description", 'head > meta[name="description"]')]);
    expect(result.kept).toHaveLength(1);
    expect(result.duplicates).toHaveLength(0);
  });
});
