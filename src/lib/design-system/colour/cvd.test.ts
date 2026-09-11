import { describe, expect, it } from "vitest";
import {
  cvdPair,
  CVD_DIFF_THRESHOLD,
  CVD_ANOMALIES,
  CVD_DEFAULT_SEVERITY,
  CVD_TYPES,
  differenceScore,
  simulateCvd,
  simulateCvdRgb,
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

describe("anomalous conditions and severity", () => {
  it("severity 0 is identical to normal vision", () => {
    for (const type of CVD_ANOMALIES.map((t) => t.id)) {
      expect(simulateCvd("#ff0000", type, 0)).toBe("#ff0000");
      expect(simulateCvd("#0f6bd6", type, 0)).toBe("#0f6bd6");
    }
  });

  it("severity 1 lands exactly on the matching full deficiency", () => {
    expect(simulateCvd("#ff0000", "protanomaly", 1)).toBe("#271d00");
    expect(simulateCvd("#ff0000", "deuteranomaly", 1)).toBe("#5e4700");
    expect(simulateCvd("#ff0000", "tritanomaly", 1)).toBe("#ff0001");
  });

  it("sits between normal and full for a mid severity", () => {
    const mid = simulateCvd("#ff0000", "deuteranomaly", 0.5);
    expect(mid).not.toBe("#ff0000");
    expect(mid).not.toBe("#5e4700");
    // The green channel shifts but stays between the two extremes.
    const greenOf = (hex: string) => parseInt(hex.slice(3, 5), 16);
    expect(greenOf(mid)).toBeGreaterThan(greenOf("#ff0000"));
    expect(greenOf(mid)).toBeLessThan(greenOf("#5e4700"));
  });

  it("uses the documented default severity when none is passed", () => {
    const withDefault = simulateCvd("#ff0000", "deuteranomaly");
    const withExplicit = simulateCvd("#ff0000", "deuteranomaly", CVD_DEFAULT_SEVERITY);
    expect(withDefault).toBe(withExplicit);
  });

  it("clamps out-of-range severity values", () => {
    expect(simulateCvd("#ff0000", "protanomaly", -1)).toBe("#ff0000");
    expect(simulateCvd("#ff0000", "deuteranomaly", 2)).toBe("#5e4700");
  });

  it("exports a pixel-level API consistent with the hex one", () => {
    const simulated = simulateCvdRgb({ r: 255, g: 0, b: 0 }, "protanopia");
    const hex = simulateCvd("#ff0000", "protanopia");
    expect(hex).toBe(
      `#${[simulated.r, simulated.g, simulated.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`,
    );
  });

  it("keeps full (anopia) conditions independent of the severity argument", () => {
    expect(simulateCvd("#ff0000", "protanopia", 0.1)).toBe("#271d00");
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