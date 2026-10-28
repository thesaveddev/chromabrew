import { generatePalette } from "@/lib/design-system/palette/generate";
import { normalizeHex } from "@/lib/design-system/colour/convert";
import { contrastRatio } from "@/lib/design-system/colour/contrast";
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
  /** Up-votes collected on the entry: the community curation signal. */
  votes: number;
}

/**
 * One voter's identity for a project vote: the signed-in user when there is
 * one, else the salted IP hash (same construction as the audit rate limiter),
 * so voting needs no account while staying one-per-person. Null when neither
 * is known — without an identity a vote cannot be deduplicated, so it cannot
 * be counted.
 */
export function voterKeyFor(input: { userId?: string | null; ipHash?: string | null }): string | null {
  if (input.userId) return `user:${input.userId}`;
  if (input.ipHash) return `ip:${input.ipHash}`;
  return null;
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
 * The minimum anchor contrast for a community palette to earn an indexable
 * page and a sitemap entry: the darkest and lightest stops must clear AA for
 * large text. Below that the project stays shareable but out of the catalog.
 */
export const COMMUNITY_ANCHOR_MIN_RATIO = 3;

/** A project row as the gallery and the sitemap both select it. */
export interface GalleryProjectRow {
  id: string;
  name: string;
  config: unknown;
  updatedAt: Date;
  author: string;
  /** Up-vote count, read from the row's vote relation. */
  votes: number;
}

/** A community entry that cleared the quality gate, with its anchor ratio. */
export interface QualifiedCommunityEntry extends CommunityEntry {
  /** Darkest-vs-lightest contrast: the curation signal, higher first. */
  anchorRatio: number;
}

/**
 * Qualify one public, opted-in project for the community catalog. Null when
 * the config cannot render or the anchor pair fails the contrast gate — the
 * gallery page, the entry page, and the sitemap all share this function, so
 * a URL the sitemap lists can never 404 on the gate and a gated-out project
 * can never leak into the index.
 */
export function qualifyCommunityEntry(row: GalleryProjectRow): QualifiedCommunityEntry | null {
  const config = parseGalleryConfig(row.config);
  if (!config) return null;
  const colors = projectPalette(config);
  if (!colors) return null;
  const anchorRatio = contrastRatio(colors[0], colors[4]);
  if (anchorRatio < COMMUNITY_ANCHOR_MIN_RATIO) return null;
  return {
    id: row.id,
    name: row.name,
    author: row.author,
    colors,
    strategy: galleryStrategy(config),
    updatedAt: row.updatedAt.toISOString(),
    anchorRatio,
    votes: row.votes,
  };
}

/**
 * Curation order: most up-voted first, strongest anchor contrast breaks
 * ties, newest update breaks those. With no votes anywhere this degrades
 * exactly to the old anchor-then-recency order, so the ranking never needs
 * a seeded exception for a quiet gallery.
 */
export function compareCommunityEntries(
  a: QualifiedCommunityEntry,
  b: QualifiedCommunityEntry,
): number {
  return (
    b.votes - a.votes ||
    b.anchorRatio - a.anchorRatio ||
    b.updatedAt.localeCompare(a.updatedAt)
  );
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
