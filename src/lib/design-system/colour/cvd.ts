import { hexToRgb, rgbToHex } from "./convert";
import { contrastRatio } from "./contrast";

/**
 * Color vision deficiency simulation. Matrices from Machado, Oliveira &
 * Fernandes (2009), the standard transform used by major accessibility
 * tools. Simulation happens in linear-ish RGB: each channel is a weighted
 * sum of the source channels, then clamped and rounded back to sRGB.
 */

export type CvdType =
  | "normal"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "achromatopsia";

export interface CvdVariant {
  id: CvdType;
  label: string;
  desc: string;
}

export const CVD_TYPES: CvdVariant[] = [
  { id: "normal", label: "Normal vision", desc: "Full trichromatic color vision" },
  { id: "protanopia", label: "Protanopia", desc: "No red cones (~1.3% of males)" },
  { id: "deuteranopia", label: "Deuteranopia", desc: "No green cones (~1.2% of males)" },
  { id: "tritanopia", label: "Tritanopia", desc: "No blue cones (~0.01% of population)" },
  { id: "achromatopsia", label: "Achromatopsia", desc: "Total color blindness (~0.003%)" },
];

const IDENTITY = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const MATRICES: Record<Exclude<CvdType, "normal">, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900],
  ],
  achromatopsia: [
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
  ],
};

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** Simulate how `hex` appears to someone with the given condition. */
export function simulateCvd(hex: string, type: CvdType = "normal"): string {
  const m = type === "normal" ? IDENTITY : MATRICES[type];
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const sr = Math.round(clamp01(m[0][0] * rn + m[0][1] * gn + m[0][2] * bn) * 255);
  const sg = Math.round(clamp01(m[1][0] * rn + m[1][1] * gn + m[1][2] * bn) * 255);
  const sb = Math.round(clamp01(m[2][0] * rn + m[2][1] * gn + m[2][2] * bn) * 255);
  return rgbToHex({ r: sr, g: sg, b: sb });
}

/** Perceptual-ish difference score 0–100 between two hex colours. */
export function differenceScore(a: string, b: string): number {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const dist = Math.sqrt(
    (pa.r - pb.r) ** 2 + (pa.g - pb.g) ** 2 + (pa.b - pb.b) ** 2,
  );
  return Math.min(100, (dist / 441) * 100);
}

export interface CvdPairResult {
  simulatedA: string;
  simulatedB: string;
  /** Difference 0–100 of the simulated pair; below ~30 they blur together. */
  difference: number;
  /** WCAG contrast of the simulated pair. */
  contrast: number;
}

/** Simulate a foreground/background pair under one condition. */
export function cvdPair(
  foreground: string,
  background: string,
  type: CvdType,
): CvdPairResult {
  const simulatedA = simulateCvd(foreground, type);
  const simulatedB = simulateCvd(background, type);
  return {
    simulatedA,
    simulatedB,
    difference: differenceScore(simulatedA, simulatedB),
    contrast: contrastRatio(simulatedA, simulatedB),
  };
}

/** Common convention: pairs with a simulated difference under this are hard to tell apart. */
export const CVD_DIFF_THRESHOLD = 30;