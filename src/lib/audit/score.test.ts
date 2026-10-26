import { describe, expect, it } from "vitest";

import {
  categoryScores,
  scoreBand,
  scoreFromCounts,
  scoreFromSeverities,
} from "./score";

describe("scoreFromCounts", () => {
  it("scores a clean run at 100", () => {
    expect(scoreFromCounts({})).toBe(100);
    expect(
      scoreFromCounts({ critical: 0, high: 0, medium: 0, low: 0, informational: 5 }),
    ).toBe(100);
  });

  it("deducts by severity weight", () => {
    // 1 high (-8) + 1 medium (-4) + 1 low (-1) = 87
    expect(scoreFromCounts({ high: 1, medium: 1, low: 1 })).toBe(87);
  });

  it("floors at zero instead of going negative", () => {
    expect(scoreFromCounts({ critical: 20 })).toBe(0);
  });
});

describe("scoreFromSeverities", () => {
  it("matches the counts version on the same input", () => {
    expect(scoreFromSeverities(["high", "medium", "low"])).toBe(
      scoreFromCounts({ high: 1, medium: 1, low: 1 }),
    );
  });

  it("ignores severities it does not recognise", () => {
    expect(scoreFromSeverities(["high", "bogus"])).toBe(92);
  });
});

describe("scoreBand", () => {
  it("bands the full range", () => {
    expect(scoreBand(100).label).toBe("Excellent");
    expect(scoreBand(90).label).toBe("Excellent");
    expect(scoreBand(89).label).toBe("Good");
    expect(scoreBand(70).label).toBe("Good");
    expect(scoreBand(69).label).toBe("Fair");
    expect(scoreBand(50).label).toBe("Fair");
    expect(scoreBand(49).label).toBe("Poor");
    expect(scoreBand(25).label).toBe("Poor");
    expect(scoreBand(24).label).toBe("Critical");
    expect(scoreBand(0).label).toBe("Critical");
  });
});

describe("categoryScores", () => {
  it("scores each category and sorts worst first", () => {
    const scores = categoryScores([
      { category: "metadata", severity: "medium" },
      { category: "accessibility", severity: "critical" },
      { category: "accessibility", severity: "low" },
      { category: "metadata", severity: "low" },
    ]);
    expect(scores.map((s) => s.category)).toEqual(["accessibility", "metadata"]);
    expect(scores[0]).toMatchObject({ score: 84, findings: 2 });
    expect(scores[1]).toMatchObject({ score: 95, findings: 2 });
  });

  it("is empty with no findings", () => {
    expect(categoryScores([])).toEqual([]);
  });
});
