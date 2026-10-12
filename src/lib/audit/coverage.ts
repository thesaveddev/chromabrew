/**
 * Coverage reporting.
 *
 * Read back from what the pipeline recorded on the scan, so the report can
 * state its own coverage instead of leaving an empty findings list to be
 * interpreted. Two rules hold here:
 *
 *   1. Absence is never a zero. A fact that was not recorded (an older scan, a
 *      fetch-only run) stays null so the report can say "not measured" rather
 *      than implying the engine looked and found nothing.
 *   2. The engine's own reason is carried through. When axe-core cannot run,
 *      the reason is stored and shown, because "no accessibility violations"
 *      and "the accessibility engine did not run" are opposite statements.
 *
 * Pure and dependency-free: no Prisma, no filesystem, no browser.
 */

import type { RenderModeId, ScanCoverageDto, UnmeasurableReasonId } from "./types";

type Metadata = Record<string, unknown>;

function asMetadata(metadata: unknown): Metadata {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Metadata)
    : {};
}

function readNumber(metadata: unknown, key: string): number | null {
  const value = asMetadata(metadata)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(metadata: unknown, key: string): string | null {
  const value = asMetadata(metadata)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readBoolean(metadata: unknown, key: string): boolean {
  return asMetadata(metadata)[key] === true;
}

function readRenderMode(metadata: unknown): RenderModeId | null {
  const value = asMetadata(metadata).renderMode;
  return value === "browser" || value === "fetch" ? value : null;
}

const UNMEASURABLE_REASONS: readonly UnmeasurableReasonId[] = [
  "background_image",
  "altered_rendering",
  "unsupported_colour",
];

function readUnmeasurableReasons(metadata: unknown): Partial<Record<UnmeasurableReasonId, number>> {
  const value = asMetadata(metadata).unmeasurableReasons;
  const reasons: Partial<Record<UnmeasurableReasonId, number>> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return reasons;
  for (const reason of UNMEASURABLE_REASONS) {
    const count = (value as Metadata)[reason];
    if (typeof count === "number" && Number.isFinite(count) && count > 0) reasons[reason] = count;
  }
  return reasons;
}

/** The engines' own account of what they did on this scan. */
export function buildScanCoverage(metadata: unknown, fallbackRuleCount: number): ScanCoverageDto {
  return {
    renderMode: readRenderMode(metadata),
    renderFallbackReason: readString(metadata, "renderFallbackReason"),
    rulesRun: readNumber(metadata, "ruleCount") ?? fallbackRuleCount,
    axeRan: readBoolean(metadata, "axeRan"),
    axeVersion: readString(metadata, "axeVersion"),
    axeError: readString(metadata, "axeError"),
    axeFindings: readNumber(metadata, "axeFindingCount") ?? 0,
    nativeFindings: readNumber(metadata, "nativeFindingCount") ?? 0,
    textSamplesMeasured: readNumber(metadata, "textSampleCount") ?? 0,
    textElementsUnmeasurable: readNumber(metadata, "unmeasurableSamples") ?? 0,
    unmeasurableReasons: readUnmeasurableReasons(metadata),
    linksFound: readNumber(metadata, "linksFound"),
    linksExternal: readNumber(metadata, "linksExternal"),
    blockedRequests: readNumber(metadata, "blockedRequestCount") ?? 0,
  };
}
