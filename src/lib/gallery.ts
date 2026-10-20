import { generatePalette } from "@/lib/design-system/palette/generate";
import { normalizeHex } from "@/lib/design-system/colour/convert";
import type { GeneratorConfig } from "@/lib/design-system/types";

/**
 * The community loop: project owners opt public projects into the gallery,
 * and the gallery derives a five-swatch palette from each project's own
 * generator config. Derivation re-runs the palette engine deterministically,
 * so gallery swatches always match what the owner sees in the generator.
 */

export interface CommunityEntry {
  id: string;
  name: string;
  author: string;
  colors: [string, string, string, string, string];
  /** The harmony strategy the palette was generated with, if known. */
  strategy?: string;
  updatedAt: string;
}

/** Read the strategy id out of a generator config, if it names a real one. */
export function galleryStrategy(config: GeneratorConfig): string | undefined {
  const id = (config as Partial<GeneratorConfig>).paletteStrategy;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export interface GalleryFilter {
  query?: string;
  strategy?: string;
}

/**
 * Filter gallery entries by free text (name, author, hex) and/or harmony
 * strategy. Pure, so the explorer UI and tests share it exactly.
 */
export function filterCommunityEntries(
  entries: CommunityEntry[],
  filter: GalleryFilter,
): CommunityEntry[] {
  const q = (filter.query ?? "").trim().toLowerCase();
  const strategy = filter.strategy ?? "all";
  return entries.filter((entry) => {
    if (strategy !== "all" && entry.strategy !== strategy) return false;
    if (!q) return true;
    const hexQuery = q.startsWith("#") ? q : `#${q}`;
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.author.toLowerCase().includes(q) ||
      entry.colors.some(
        (color) =>
          color.toLowerCase().includes(q) ||
          color.toLowerCase().includes(hexQuery),
      )
    );
  });
}

/** Safely read a generator config out of a JSON column. */
export function parseGalleryConfig(value: unknown): GeneratorConfig | null {
  if (!value || typeof value !== "object") return null;
  const config = value as Partial<GeneratorConfig>;
  if (typeof config.primary !== "string" || !normalizeHex(config.primary)) {
    return null;
  }
  return config as GeneratorConfig;
}

/**
 * Derive five gallery swatches from a project config. Returns null when the
 * config cannot produce a palette (unknown strategy, bad values) — a project
 * that cannot render is excluded from the gallery, never shown broken.
 */
export function projectPalette(config: GeneratorConfig): [string, string, string, string, string] | null {
  try {
    const swatches = generatePalette(config.primary, config.paletteStrategy, {
      overrides: config.paletteOverrides,
      size: 5,
    })
      .slice(0, 5)
      .map((swatch) => normalizeHex(swatch.hex))
      .filter((hex): hex is string => hex !== null);
    if (swatches.length < 5) return null;
    return swatches as [string, string, string, string, string];
  } catch {
    return null;
  }
}
