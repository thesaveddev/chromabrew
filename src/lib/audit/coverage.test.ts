import { describe, expect, it } from "vitest";
import { buildScanCoverage } from "./coverage";

const FALLBACK_RULE_COUNT = 10;

/** A scan metadata blob shaped exactly like the one the runner writes. */
const measuredScan = {
  stage: "preparing",
  renderMode: "browser",
  ruleCount: 10,
  axeVersion: "4.13.0",
  axeRan: true,
  axeError: null,
  axeFindingCount: 6,
  nativeFindingCount: 7,
  blockedRequestCount: 0,
  textSampleCount: 158,
  unmeasurableSamples: 105,
  unmeasurableReasons: { background_image: 74, altered_rendering: 31 },
  linksFound: 214,
  linksExternal: 16,
};

describe("buildScanCoverage", () => {
  it("reports what each engine did", () => {
    const coverage = buildScanCoverage(measuredScan, FALLBACK_RULE_COUNT);

    expect(coverage).toMatchObject({
      renderMode: "browser",
      rulesRun: 10,
      axeRan: true,
      axeVersion: "4.13.0",
      axeError: null,
      axeFindings: 6,
      nativeFindings: 7,
      textSamplesMeasured: 158,
      textElementsUnmeasurable: 105,
      unmeasurableReasons: { background_image: 74, altered_rendering: 31 },
      linksFound: 214,
      linksExternal: 16,
      blockedRequests: 0,
    });
  });

  it("keeps an engine failure visible instead of turning it into an empty pass", () => {
    const coverage = buildScanCoverage(
      {
        renderMode: "browser",
        axeRan: false,
        axeVersion: "4.13.0",
        axeError: "ReferenceError: t is not defined",
        axeFindingCount: null,
      },
      FALLBACK_RULE_COUNT,
    );

    // The finding count is a recorded fact: axe produced none because it crashed.
    expect(coverage.axeRan).toBe(false);
    expect(coverage.axeError).toBe("ReferenceError: t is not defined");
    expect(coverage.axeFindings).toBe(0);
  });

  it("does not invent facts that were never recorded", () => {
    // A fetch-only scan, or one written before these fields existed.
    const coverage = buildScanCoverage({ renderMode: "fetch", ruleCount: 10 }, FALLBACK_RULE_COUNT);

    // Links were never collected, so the report must be able to say so rather
    // than displaying a confident "0 links".
    expect(coverage.linksFound).toBeNull();
    expect(coverage.linksExternal).toBeNull();
    // axe never ran and no reason was recorded — both stay explicit.
    expect(coverage.axeRan).toBe(false);
    expect(coverage.axeError).toBeNull();
    expect(coverage.textSamplesMeasured).toBe(0);
    expect(coverage.unmeasurableReasons).toEqual({});
  });

  it("survives a missing or malformed metadata blob", () => {
    const fallback = buildScanCoverage(null, FALLBACK_RULE_COUNT);
    expect(fallback.renderMode).toBeNull();
    expect(fallback.rulesRun).toBe(FALLBACK_RULE_COUNT);
    expect(fallback.linksFound).toBeNull();

    const malformed = buildScanCoverage(
      { unmeasurableReasons: "not an object", axeRan: "yes", ruleCount: "ten" },
      FALLBACK_RULE_COUNT,
    );
    expect(malformed.unmeasurableReasons).toEqual({});
    expect(malformed.axeRan).toBe(false);
    expect(malformed.rulesRun).toBe(FALLBACK_RULE_COUNT);
  });

  it("reads the AI-discovery facts only when both states were recorded", () => {
    expect(
      buildScanCoverage(
        { aiRobots: "present", aiLlms: "absent", aiBlockedBots: ["GPTBot"] },
        FALLBACK_RULE_COUNT,
      ).aiDiscovery,
    ).toEqual({ robots: "present", llms: "absent", blockedBots: ["GPTBot"] });

    // A scan that predates the section reads as not measured, not as absent.
    expect(buildScanCoverage({}, FALLBACK_RULE_COUNT).aiDiscovery).toBeNull();
    expect(
      buildScanCoverage({ aiRobots: "present" }, FALLBACK_RULE_COUNT).aiDiscovery,
    ).toBeNull();
    // Malformed states and bot lists are dropped, never trusted.
    expect(
      buildScanCoverage(
        { aiRobots: "here", aiLlms: "absent", aiBlockedBots: ["GPTBot", 42, ""] },
        FALLBACK_RULE_COUNT,
      ).aiDiscovery,
    ).toBeNull();
    expect(
      buildScanCoverage(
        { aiRobots: "present", aiLlms: "present", aiBlockedBots: "GPTBot" },
        FALLBACK_RULE_COUNT,
      ).aiDiscovery,
    ).toEqual({ robots: "present", llms: "present", blockedBots: [] });
  });

  it("drops unknown reasons and ignores zero counts", () => {
    const coverage = buildScanCoverage(
      { unmeasurableReasons: { background_image: 0, altered_rendering: 3, made_up: 99 } },
      FALLBACK_RULE_COUNT,
    );
    expect(coverage.unmeasurableReasons).toEqual({ altered_rendering: 3 });
  });

  it("keeps a colour that could not be resolved as its own coverage gap", () => {
    // "Not measured" must survive the round trip: if this reason were dropped,
    // the report would claim full contrast coverage over a page where some text
    // was never readable, which is the one thing the coverage panel exists to
    // prevent.
    const coverage = buildScanCoverage(
      {
        unmeasurableReasons: {
          background_image: 2,
          altered_rendering: 1,
          unsupported_colour: 5,
          made_up: 99,
        },
      },
      FALLBACK_RULE_COUNT,
    );
    expect(coverage.unmeasurableReasons).toEqual({
      background_image: 2,
      altered_rendering: 1,
      unsupported_colour: 5,
    });
  });
});
