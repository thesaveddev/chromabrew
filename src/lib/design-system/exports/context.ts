import type { DesignSystem } from "../types";

/**
 * Client-ready packaging context for export adapters.
 *
 * Everything a deliverable needs to read as belonging to a project rather
 * than to the tool that made it: the project name (drives filenames and
 * headers), the client it was prepared for, and a version label. Every field
 * is optional so every existing call site keeps working unchanged — an
 * adapter without a context emits exactly what it always has.
 */
export interface ExportContext {
  /** Project name, e.g. "Acme Dashboard". Drives slugs, titles and headers. */
  projectName?: string;
  /** Who the deliverable was prepared for, e.g. "Acme Inc". */
  clientName?: string;
  /** Version label, e.g. "v3". Defaults to "v1". */
  versionLabel?: string;
  /** When the export was produced. Defaults to now. */
  generatedAt?: Date;
}

/** URL- and filename-safe slug, lowercased, hyphen-separated. */
export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "design-system";
}

/** Filename stem for a deliverable: the project slug, or the legacy default. */
export function exportSlug(ctx?: ExportContext): string {
  const name = ctx?.projectName?.trim();
  return name ? slugify(name) : "design-tokens";
}

/** Display name for a deliverable. */
export function exportTitle(ctx?: ExportContext, fallback?: string): string {
  const name = ctx?.projectName?.trim();
  if (name) return name;
  return fallback?.trim() || "Design system";
}

/** Version label, defaulting to "v1" so a deliverable is never versionless. */
export function exportVersion(ctx?: ExportContext): string {
  const version = ctx?.versionLabel?.trim();
  return version || "v1";
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Stable, locale-independent date ("26 Oct 2026"), rendered in UTC so the
 * same export stamps the same line on every machine — including in tests.
 */
export function formatExportDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function exportDate(ctx?: ExportContext): string {
  return formatExportDate(ctx?.generatedAt ?? new Date());
}

/**
 * One "Prepared for X · " prefix, or "" when no client was named — so callers
 * never render a dangling label.
 */
export function preparedForLine(ctx?: ExportContext): string {
  const client = ctx?.clientName?.trim();
  return client ? `Prepared for ${client} · ` : "";
}

export interface WhiteLabelLines {
  /** Human-readable title, e.g. "Acme Dashboard design tokens". */
  title: string;
  /** "Prepared for Acme Inc · v3 · 26 Oct 2026" (client part omitted when absent). */
  provenance: string;
}

/**
 * The two lines every file header and manifest carries, computed once so the
 * CSS comment, the JSON description and the README cannot disagree.
 */
export function whiteLabelLines(
  system: DesignSystem,
  ctx: ExportContext | undefined,
  kind: string,
): WhiteLabelLines {
  return {
    title: `${exportTitle(ctx, system.metadata.name)} ${kind}`,
    provenance: `${preparedForLine(ctx)}${exportVersion(ctx)} · ${exportDate(ctx)} · source ${system.source.primary.hex}`,
  };
}

/**
 * Prefix a default filename with the project slug when a project is named:
 * "design-tokens.css" becomes "acme-dashboard-design-tokens.css". Without a
 * project the legacy name stands, so existing links and docs keep working.
 */
export function whiteLabelFilename(filename: string, ctx?: ExportContext): string {
  const name = ctx?.projectName?.trim();
  if (!name) return filename;
  return `${slugify(name)}-${filename}`;
}
