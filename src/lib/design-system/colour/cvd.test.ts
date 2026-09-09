import { describe, expect, it } from "vitest";
import {
  cvdPair,
  CVD_DIFF_THRESHOLD,
  CVD_TYPES,
  differenceScore,
  simulateCvd,
} from "./cvd";

describe("simulateCvd", () => {
  it("leaves a color unchanged under normal vision", () => {
    expect(simulateCvd("#ff0000", "normal")).toBe("#ff0000");
  });

  it("applies the protanopia matrix to pure red", () => {
    expect(simulateCvd("#ff0000", "protanopia")).toBe("#271d00");
  });

  it("applies the deuteranopia matrix to pure red", () => {
    expect(simulateCvd("#ff0000", "deuteranopia")).toBe("#5e4700");
  });

  it("applies the tritanopia matrix to pure red", () => {
    expect(simulateCvd("#ff0000", "tritanopia")).toBe("#ff0001");
  });

  it("applies the achromatopsia (luminance) matrix", () => {
    expect(simulateCvd("#ff0000", "achromatopsia")).toBe("#363636");
    expect(simulateCvd("#808080", "achromatopsia")).toBe("#808080");
  });

  it("clamps channel values into gamut", () => {
    expect(simulateCvd("#0000ff", "protanopia")).toBe("#0019ff");
  });
});

describe("differenceScore", () => {
  it("returns 0 for identical colors and ~100 for black vs white", () => {
    expect(differenceScore("#123456", "#123456")).toBe(0);
    expect(differenceScore("#ffffff", "#000000")).toBe(100);
  });
});

describe("cvdPair", () => {
  it("flags colors that differ mainly by hue but collapse for total color blindness", () => {
    // Red and a near-equal-luma green stay distinct to normal vision
    // (difference ~60) but the achromatopsia matrix maps both onto the
    // same grey, collapsing them below the threshold.
    const normal = differenceScore("#ff0000", "#004c00");
    const sim = cvdPair("#ff0000", "#004c00", "achromatopsia");
    expect(normal).toBeGreaterThanOrEqual(CVD_DIFF_THRESHOLD);
    expect(sim.difference).toBeLessThan(CVD_DIFF_THRESHOLD);
  });

  it("reports distinguishable pairs for every listed condition", () => {
    for (const type of CVD_TYPES.map((t) => t.id)) {
      const pair = cvdPair("#111111", "#ffffff", type);
      expect(pair.difference).toBeGreaterThanOrEqual(CVD_DIFF_THRESHOLD);
    }
  });
});