import { describe, expect, it } from "vitest";

import {
  COMMUNITY_ANCHOR_MIN_RATIO,
  compareCommunityEntries,
  qualifyCommunityEntry,
  voterKeyFor,
  type GalleryProjectRow,
  type QualifiedCommunityEntry,
} from "./gallery";

/**
 * The community half of the million-palette catalog.
 *
 * Opt-in projects earn indexable pages only through one shared gate — a
 * renderable config whose anchor pair clears the contrast minimum — used by
 * the gallery grid, the entry page, and the sitemap alike. Strongest anchors
 * surface first, so curation is measured, not recency.
 */
function row(overrides: Record<string, unknown>, updatedAt = "2026-10-01T00:00:00Z"): GalleryProjectRow {
  return {
    id: "proj-1",
    name: "Test project",
    config: { primary: "#336699", paletteStrategy: "complementary", ...overrides },
    updatedAt: new Date(updatedAt),
    author: "Tester",
    votes: 0,
  };
}

const RAMP = {
  paletteOverrides: {
    0: "#101010",
    1: "#336699",
    2: "#66aaff",
    3: "#cce4ff",
    4: "#ffffff",
  },
};

const MUD = {
  paletteOverrides: {
    0: "#111111",
    1: "#151515",
    2: "#1a1a1a",
    3: "#1e1e1e",
    4: "#222222",
  },
};

describe("qualifyCommunityEntry", () => {
  it("qualifies a renderable high-contrast project with its anchor ratio", () => {
    const entry = qualifyCommunityEntry(row(RAMP));
    expect(entry).not.toBeNull();
    expect(entry!.colors).toEqual(["#101010", "#336699", "#66aaff", "#cce4ff", "#ffffff"]);
    expect(entry!.anchorRatio).toBeGreaterThanOrEqual(COMMUNITY_ANCHOR_MIN_RATIO);
    expect(entry!.author).toBe("Tester");
  });

  it("rejects an unrunnable config instead of showing it broken", () => {
    expect(qualifyCommunityEntry(row({ paletteStrategy: "not-a-strategy" }))).toBeNull();
    expect(
      qualifyCommunityEntry({ ...row({}), config: { primary: "nope" } }),
    ).toBeNull();
    expect(qualifyCommunityEntry({ ...row({}), config: null })).toBeNull();
  });

  it("rejects a muddy anchor pair below the gate", () => {
    expect(qualifyCommunityEntry(row(MUD))).toBeNull();
  });
});

describe("compareCommunityEntries", () => {
  const entry = (
    ratio: number,
    updatedAt: string,
    votes = 0,
  ): QualifiedCommunityEntry => ({
    id: `${ratio}/${updatedAt}/${votes}`,
    name: "x",
    author: "x",
    colors: ["#000000", "#111111", "#222222", "#333333", "#ffffff"],
    updatedAt,
    anchorRatio: ratio,
    votes,
  });

  it("orders most up-voted first, strongest anchors break ties", () => {
    const loved = entry(3.1, "2026-01-01T00:00:00Z", 5);
    const strong = entry(12.4, "2026-01-01T00:00:00Z", 0);
    const strongNew = entry(12.4, "2026-10-20T00:00:00Z", 0);
    expect([strongNew, strong, loved].sort(compareCommunityEntries)).toEqual([
      loved,
      strongNew,
      strong,
    ]);
  });

  it("degrades to anchor-then-recency when nothing has votes", () => {
    const weak = entry(3.1, "2026-10-20T00:00:00Z");
    const strong = entry(12.4, "2026-01-01T00:00:00Z");
    const strongNew = entry(12.4, "2026-10-20T00:00:00Z");
    expect([weak, strong, strongNew].sort(compareCommunityEntries)).toEqual([
      strongNew,
      strong,
      weak,
    ]);
  });
});

describe("voterKeyFor", () => {
  it("prefers the signed-in user over the IP hash", () => {
    expect(voterKeyFor({ userId: "u1", ipHash: "abc" })).toBe("user:u1");
  });

  it("falls back to the hashed IP for anonymous readers", () => {
    expect(voterKeyFor({ userId: null, ipHash: "abc" })).toBe("ip:abc");
  });

  it("returns null when neither identity is known", () => {
    expect(voterKeyFor({})).toBeNull();
    expect(voterKeyFor({ userId: null, ipHash: null })).toBeNull();
  });
});
