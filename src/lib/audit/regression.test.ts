import { describe, expect, it } from "vitest";

import { diffScanFindings, type RegressionInput } from "./regression";

function finding(ruleId: string, pageUrl: string | null = "https://example.com/"): RegressionInput {
  return { ruleId, severity: "high", title: ruleId, pageUrl };
}

describe("diffScanFindings", () => {
  it("reports new, fixed and persisting findings by rule and page", () => {
    const previous = [finding("a"), finding("b"), finding("c")];
    const current = [finding("b"), finding("c"), finding("d")];

    const diff = diffScanFindings(previous, current);

    expect(diff.added.map((f) => f.ruleId)).toEqual(["d"]);
    expect(diff.fixed.map((f) => f.ruleId)).toEqual(["a"]);
    expect(diff.addedTotal).toBe(1);
    expect(diff.fixedTotal).toBe(1);
    expect(diff.persistingTotal).toBe(2);
  });

  it("treats the same rule on different pages as different problems", () => {
    const previous = [finding("a", "https://example.com/one")];
    const current = [finding("a", "https://example.com/two")];

    const diff = diffScanFindings(previous, current);

    expect(diff.addedTotal).toBe(1);
    expect(diff.fixedTotal).toBe(1);
    expect(diff.persistingTotal).toBe(0);
  });

  it("collapses repeat elements to one entry and caps the display lists", () => {
    const previous = Array.from({ length: 5 }, (_, i) => finding(`old-${i}`));
    const current = Array.from({ length: 5 }, (_, i) => finding(`old-${i}`));

    const diff = diffScanFindings(previous, current, 2);

    expect(diff.persistingTotal).toBe(5);
    expect(diff.added).toEqual([]);
    expect(diff.fixed).toEqual([]);
  });

  it("caps long lists while keeping honest totals", () => {
    const current = Array.from({ length: 10 }, (_, i) => finding(`new-${i}`));

    const diff = diffScanFindings([], current, 3);

    expect(diff.added).toHaveLength(3);
    expect(diff.addedTotal).toBe(10);
  });

  it("returns an empty diff when there is nothing to compare", () => {
    expect(diffScanFindings([], [])).toEqual({
      addedTotal: 0,
      fixedTotal: 0,
      persistingTotal: 0,
      added: [],
      fixed: [],
    });
  });
});
