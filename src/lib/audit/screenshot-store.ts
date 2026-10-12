/**
 * Screenshot storage for the audit scanner.
 *
 * Screenshots live on the local filesystem for now (the schema already has
 * `ScannedPage.screenshotPath`, so moving to object storage later means changing
 * this module alone). Two rules keep it safe:
 *
 *   1. A request can never name a file. Filenames come only from validated scan
 *      and page ids; the path served back is read from the database row.
 *   2. Every read is re-checked to resolve inside the storage directory, so a
 *      corrupted or hand-edited row still cannot reach outside it.
 */

import type { Dirent } from "node:fs";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_DIR_NAME = ".audit-screenshots";

/** cuid-like ids only: the shapes Prisma generates, and nothing else. */
const SAFE_ID = /^[a-z0-9]{10,40}$/i;

/** A stored filename as this module writes it. */
const SAFE_FILE = /^[a-z0-9-]+\.png$/i;

export function screenshotDir(): string {
  const configured = process.env.AUDIT_SCREENSHOT_DIR?.trim();
  return configured && configured.length > 0
    ? configured
    : path.join(process.cwd(), DEFAULT_DIR_NAME);
}

export function isSafeId(value: string): boolean {
  return SAFE_ID.test(value);
}

/**
 * Build the stored filename. Throws rather than sanitising: an unsafe id means
 * a caller passed something it should not have, and quietly rewriting it would
 * hide that.
 */
export function screenshotFileName(scanId: string, pageId: string): string {
  if (!isSafeId(scanId) || !isSafeId(pageId)) {
    throw new Error("Refusing to build a screenshot filename from an unsafe id");
  }
  return `${scanId}-${pageId}.png`;
}

/** Persist a PNG and return the relative filename to store on the page row. */
export async function saveScreenshot(
  scanId: string,
  pageId: string,
  png: Uint8Array,
): Promise<string> {
  const fileName = screenshotFileName(scanId, pageId);
  const directory = screenshotDir();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), png);
  return fileName;
}

/**
 * Read a stored screenshot by its relative filename.
 *
 * Returns null — never throws — for anything that is not a bare, expected
 * filename, so a hostile or stale value can only ever produce a 404.
 */
export async function readScreenshot(relativePath: string): Promise<Buffer | null> {
  if (!relativePath || relativePath.includes("\0")) return null;
  if (relativePath.includes("/") || relativePath.includes("\\")) return null;
  if (relativePath.includes("..")) return null;
  if (!SAFE_FILE.test(relativePath)) return null;

  const directory = path.resolve(screenshotDir());
  const resolved = path.resolve(directory, relativePath);
  // Defence in depth: the name passed the allowlist, but confirm the resolved
  // path really is directly inside the storage directory.
  if (path.dirname(resolved) !== directory) return null;

  try {
    return await readFile(resolved);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** Remove every stored screenshot for a scan. Used by retention. */
export async function deleteScreenshotsFor(scanId: string): Promise<number> {
  if (!isSafeId(scanId)) {
    throw new Error("Refusing to delete screenshots for an unsafe scan id");
  }

  const directory = screenshotDir();
  let entries: Dirent[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }

  let deleted = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith(`${scanId}-`)) continue;
    if (!SAFE_FILE.test(entry.name)) continue;
    await unlink(path.join(directory, entry.name));
    deleted += 1;
  }
  return deleted;
}
