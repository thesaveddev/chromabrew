import { createHash } from "node:crypto";
import { isValidHex } from "./design-system/colour/convert";
import { normaliseConfig } from "./design-system/share";
import type { GeneratorConfig } from "./design-system/types";

/**
 * Indexing gates for public design-system projects (`/p/[id]`).
 *
 * Stage B of docs/PROGRAMMATIC_SEO_PLAN.md §3a. The plan's six gates map to
 * the gate ids below; gate 6 ("linked from /gallery") is structural rather
 * than a check — `listedInGallery` is exactly the flag the gallery reads to
 * list a project, so passing the gallery-opt-in gate puts the project on the
 * gallery index.
 *
 * Stage B ships the logic while indexing stays off: `projectIndexingEnabled()`
 * reads the `PROJECT_INDEXING` env switch, which is **false by default**, so
 * every project keeps serving `noindex` until Stage C flips the switch (which
 * waits for the Search Console baseline). The verdict is computed and unit
 * tested either way, so Stage C is a deploy of configuration, not of code.
 *
 * Everything here is pure and DB-free: the page layer resolves
 * `duplicateConfig` (an equality query against other gallery-listed public
 * projects) before calling in.
 */

/** Plan gate 2: a description at least this long, not the thin fallback. */
export const PROJECT_INDEX_MIN_DESCRIPTION = 60;
/** Plan gate 4: a project must have been public for at least this long. */
export const PROJECT_INDEX_MIN_AGE_DAYS = 7;

export type ProjectIndexGateId =
  | "visibility"
  | "gallery-opt-in"
  | "description"
  | "primary"
  | "non-default-config"
  | "saved-version"
  | "age"
  | "unique-config";

export interface ProjectIndexInput {
  visibility: "private" | "public";
  listedInGallery: boolean;
  name: string;
  description: string | null;
  /** The stored Prisma `Json` config — untyped on purpose; validated here. */
  config: unknown;
  createdAt: Date;
  savedVersionCount: number;
  /** Resolved by the caller: true when another indexable project shares this config. */
  duplicateConfig: boolean;
}

export interface ProjectIndexVerdict {
  indexable: boolean;
  /** Gates that failed, in plan order — empty means every gate passed. */
  failed: ProjectIndexGateId[];
}

/**
 * JSON with deterministically ordered keys, treating `undefined` like
 * JSON.stringify does (omitted). Prisma round-trips `Json` columns through
 * real JSON, so key order is an artifact of storage, not of user intent.
 */
export function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

/** Stable identity for a stored config — used for the clone/uniqueness gate. */
export function projectConfigHash(config: unknown): string {
  return createHash("sha256").update(stableStringify(config)).digest("hex");
}

/**
 * Gate 5 support: a config that matches another gallery-listed public
 * project is a clone and stays out of the index (spam-factory defence).
 */
export function isDuplicateConfig(candidate: unknown, otherConfigs: readonly unknown[]): boolean {
  const hash = projectConfigHash(candidate);
  return otherConfigs.some((other) => projectConfigHash(other) === hash);
}

/** Whether the Stage C switch is on. Strict: only the literal "true" enables. */
export function projectIndexingEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.PROJECT_INDEXING === "true";
}

export function projectIndexVerdict(input: ProjectIndexInput, now: Date = new Date()): ProjectIndexVerdict {
  const failed: ProjectIndexGateId[] = [];

  if (input.visibility !== "public") failed.push("visibility");
  if (!input.listedInGallery) failed.push("gallery-opt-in");

  const description = input.description?.trim() ?? "";
  if (description.length < PROJECT_INDEX_MIN_DESCRIPTION) failed.push("description");

  const config = input.config as { primary?: unknown } | null;
  if (!config || typeof config.primary !== "string" || !isValidHex(config.primary)) {
    failed.push("primary");
  } else {
    // Plan gate 3b: a project left at the default configuration is the result
    // of opening the generator and saving without deciding anything.
    const normalised = stableStringify(normaliseConfig((input.config ?? {}) as Partial<GeneratorConfig>));
    const fallback = stableStringify(normaliseConfig({}));
    if (normalised === fallback) failed.push("non-default-config");
  }

  if (!Number.isFinite(input.savedVersionCount) || input.savedVersionCount < 1) {
    failed.push("saved-version");
  }

  const ageMs = now.getTime() - input.createdAt.getTime();
  if (ageMs < PROJECT_INDEX_MIN_AGE_DAYS * 86_400_000) failed.push("age");

  if (input.duplicateConfig) failed.push("unique-config");

  return { indexable: failed.length === 0, failed };
}
