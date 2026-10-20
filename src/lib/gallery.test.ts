import { describe, expect, it } from "vitest";
import {
  filterCommunityEntries,
  galleryStrategy,
  parseGalleryConfig,
  projectPalette,
  type CommunityEntry,
} from "./gallery";

const ENTRIES: CommunityEntry[] = [
  {
    id: "a",
    name: "Ocean Drive",
    author: "Mara",
    colors: ["#0b1e3a", "#1d4e89", "#2f8f9d", "#7fc8bc", "#e6f4f1"],
    strategy: "analogous",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "b",
    name: "Ember Night",
    author: "Theo",
    colors: ["#241623", "#5c2a3c", "#a03e4e", "#e07a5f", "#f6d8b8"],
    strategy: "complementary",
    updatedAt: "2026-10-02T00:00:00.000Z",
  },
  {
    id: "c",
    name: "Untitled Mono",
    author: "Anonymous",
    colors: ["#16161a", "#3a3a44", "#6e6e7d", "#b5b5c0", "#f0f0f4"],
    updatedAt: "2026-10-03T00:00:00.000Z",
  },
];

describe("filterCommunityEntries", () => {
  it("returns everything when no filter is applied", () => {
    expect(filterCommunityEntries(ENTRIES, {})).toHaveLength(3);
  });

  it("matches names and authors case-insensitively", () => {
    expect(filterCommunityEntries(ENTRIES, { query: "ocean" }).map((e) => e.id)).toEqual(["a"]);
    expect(filterCommunityEntries(ENTRIES, { query: "THEO" }).map((e) => e.id)).toEqual(["b"]);
  });

  it("matches hex with or without the hash", () => {
    expect(filterCommunityEntries(ENTRIES, { query: "4cc9f0" })).toHaveLength(0);
    expect(filterCommunityEntries(ENTRIES, { query: "7fc8bc" }).map((e) => e.id)).toEqual(["a"]);
    expect(filterCommunityEntries(ENTRIES, { query: "#7FC8BC" }).map((e) => e.id)).toEqual(["a"]);
  });

  it("filters by strategy", () => {
    expect(filterCommunityEntries(ENTRIES, { strategy: "complementary" }).map((e) => e.id)).toEqual(["b"]);
    expect(filterCommunityEntries(ENTRIES, { strategy: "triadic" })).toHaveLength(0);
  });

  it("combines text and strategy filters", () => {
    expect(
      filterCommunityEntries(ENTRIES, { query: "e", strategy: "analogous" }).map((e) => e.id),
    ).toEqual(["a"]);
    expect(
      filterCommunityEntries(ENTRIES, { query: "ember", strategy: "analogous" }),
    ).toHaveLength(0);
  });
});

describe("galleryStrategy", () => {
  it("reads the strategy id from a config", () => {
    expect(galleryStrategy({ paletteStrategy: "triadic" } as never)).toBe("triadic");
  });

  it("returns undefined when the config names none", () => {
    expect(galleryStrategy({} as never)).toBeUndefined();
  });
});

describe("gallery derivation", () => {
  it("derives five swatches from a valid generator config", () => {
    const config = parseGalleryConfig({
      primary: "#47003a",
      paletteStrategy: "complementary",
      paletteOverrides: {},
    });
    expect(config).not.toBeNull();
    const palette = projectPalette(config!);
    expect(palette).not.toBeNull();
    expect(palette).toHaveLength(5);
    for (const hex of palette!) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("rejects configs without a usable primary", () => {
    expect(parseGalleryConfig(null)).toBeNull();
    expect(parseGalleryConfig({ primary: "not-a-color" })).toBeNull();
  });

  it("excludes configs with unknown strategies instead of rendering broken", () => {
    const config = parseGalleryConfig({
      primary: "#47003a",
      paletteStrategy: "nope-not-real",
    });
    // The primary is fine so parsing succeeds; derivation must refuse.
    expect(projectPalette(config!)).toBeNull();
  });
});
