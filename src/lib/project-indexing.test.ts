import { describe, expect, it } from "vitest";
import {
  PROJECT_INDEX_MIN_AGE_DAYS,
  isDuplicateConfig,
  projectConfigHash,
  projectIndexingEnabled,
  projectIndexVerdict,
  stableStringify,
  type ProjectIndexGateId,
  type ProjectIndexInput,
} from "./project-indexing";
import { DEFAULT_CONFIG } from "./design-system/share";

const NOW = new Date("2026-10-19T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

/** A project that passes every gate; individual tests break exactly one. */
const passing: ProjectIndexInput = {
  visibility: "public",
  listedInGallery: true,
  name: "Aurora dashboard",
  description:
    "Warm, high-contrast system for a analytics dashboard with a plum primary and teal accents.",
  config: { primary: "#47003a", paletteStrategy: "triadic", paletteSize: 6 },
  createdAt: daysAgo(10),
  savedVersionCount: 1,
  duplicateConfig: false,
};

const verdictOf = (overrides: Partial<ProjectIndexInput>, now: Date = NOW) =>
  projectIndexVerdict({ ...passing, ...overrides }, now);

describe("projectIndexVerdict", () => {
  it("indexes a project that passes every gate", () => {
    expect(projectIndexVerdict(passing, NOW)).toEqual({ indexable: true, failed: [] });
  });

  it.each<[string, Partial<ProjectIndexInput>, ProjectIndexGateId]>([
    ["private visibility", { visibility: "private" }, "visibility"],
    ["gallery opt-out", { listedInGallery: false }, "gallery-opt-in"],
    ["missing description", { description: null }, "description"],
    ["short description", { description: "Too thin to rank." }, "description"],
    ["missing primary", { config: { paletteStrategy: "analogous" } }, "primary"],
    ["invalid primary", { config: { primary: "plum" } }, "primary"],
    ["default config", { config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)) }, "non-default-config"],
    ["no saved versions", { savedVersionCount: 0 }, "saved-version"],
    ["duplicate config", { duplicateConfig: true }, "unique-config"],
  ])("fails gate: %s", (_label, overrides, gate) => {
    const verdict = verdictOf(overrides);
    expect(verdict.indexable).toBe(false);
    expect(verdict.failed).toEqual([gate]);
  });

  it("fails the age gate just under the threshold", () => {
    const verdict = verdictOf({ createdAt: daysAgo(PROJECT_INDEX_MIN_AGE_DAYS) }, NOW);
    // exactly at the threshold passes…
    expect(verdict.indexable).toBe(true);
    // …one millisecond younger does not.
    const tooYoung = verdictOf(
      { createdAt: new Date(NOW.getTime() - PROJECT_INDEX_MIN_AGE_DAYS * 86_400_000 + 1) },
      NOW,
    );
    expect(tooYoung.indexable).toBe(false);
    expect(tooYoung.failed).toEqual(["age"]);
  });

  it("reports every failed gate in plan order", () => {
    const verdict = verdictOf({
      visibility: "private",
      listedInGallery: false,
      description: "short",
      createdAt: NOW,
      duplicateConfig: true,
    });
    expect(verdict.failed).toEqual([
      "visibility",
      "gallery-opt-in",
      "description",
      "age",
      "unique-config",
    ]);
  });

  it("treats a description at exactly the minimum as passing", () => {
    expect(verdictOf({ description: "x".repeat(60) }).indexable).toBe(true);
    expect(verdictOf({ description: "x".repeat(59) }).failed).toEqual(["description"]);
  });
});

describe("stableStringify", () => {
  it("is insensitive to key order", () => {
    expect(stableStringify({ a: 1, b: { c: 2, d: 3 } })).toBe(
      stableStringify({ b: { d: 3, c: 2 }, a: 1 }),
    );
  });

  it("omits undefined values like JSON does, and keeps array order", () => {
    expect(stableStringify({ a: undefined, b: [3, 1, 2] })).toBe('{"b":[3,1,2]}');
  });
});

describe("projectConfigHash / isDuplicateConfig", () => {
  const config = { primary: "#47003a", paletteSize: 6, lockedIndices: [1, 4] };

  it("matches across key order but not across values", () => {
    expect(projectConfigHash({ paletteSize: 6, lockedIndices: [1, 4], primary: "#47003a" })).toBe(
      projectConfigHash(config),
    );
    expect(projectConfigHash({ ...config, paletteSize: 7 })).not.toBe(projectConfigHash(config));
  });

  it("detects a clone among other indexable configs", () => {
    const others = [{ primary: "#000000" }, { ...config, paletteSize: 6 }];
    expect(isDuplicateConfig(config, others)).toBe(true);
    expect(isDuplicateConfig(config, [{ primary: "#000000" }])).toBe(false);
    expect(isDuplicateConfig(config, [])).toBe(false);
  });
});

describe("projectIndexingEnabled", () => {
  it("is off by default — Stage B ships noindex in practice", () => {
    expect(projectIndexingEnabled({})).toBe(false);
    expect(projectIndexingEnabled({ PROJECT_INDEXING: "1" })).toBe(false);
    expect(projectIndexingEnabled({ PROJECT_INDEXING: "yes" })).toBe(false);
  });

  it("turns on only for the literal true", () => {
    expect(projectIndexingEnabled({ PROJECT_INDEXING: "true" })).toBe(true);
  });
});
