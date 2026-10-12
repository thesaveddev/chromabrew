/**
 * Shareable report links.
 *
 * A finished scan can be published at `/r/<token>` so somebody who is not the
 * owner — a client, a colleague, a contractor — can read it. Three rules shape
 * this module:
 *
 *   1. **Nothing is public by id.** A report becomes readable only by virtue of
 *      a token that the owner deliberately created, and the token is 192 bits of
 *      randomness rather than a database id somebody could enumerate or
 *      recognise. Revoking clears it; the report returns to being unreadable.
 *   2. **Only finished work is shareable.** A queued or running scan has no
 *      findings to stand behind, and a failed one has nothing to show, so
 *      `shareScan` refuses all three. The status is re-checked when the link is
 *      read, so a token cannot outlive the report it points at into a state that
 *      was never shareable.
 *   3. **The owner is the only one who can create or revoke a link.** Ownership
 *      is the scan's `userId`, compared server-side; a scan with no owner
 *      (submitted signed out) cannot be shared, because there is no one whose
 *      permission could be checked.
 *
 * The public read path returns the same `ScanResultsDto` the owner sees, with
 * screenshots served through the token rather than through a scan id — one
 * implementation of "a report", so a shared link cannot drift from the report
 * the owner reviewed.
 */

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";
import { getScanResultsDto, type ScanStatusDto } from "./queries";
import { isReportReady, type ScanResultsDto, type ScanStatusId } from "./types";

/** 24 bytes = 192 bits, base64url-encoded to 32 URL-safe characters. */
const SHARE_TOKEN_BYTES = 24;

/** Tokens we will even ask the database about. */
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export type ShareErrorCode = "not_found" | "forbidden" | "not_shareable";

export class ShareError extends Error {
  readonly code: ShareErrorCode;

  constructor(message: string, code: ShareErrorCode) {
    super(message);
    this.name = "ShareError";
    this.code = code;
  }
}

export interface ScanShareState {
  shared: boolean;
  /** The token itself. Only ever returned to the owner of the scan. */
  token: string | null;
  /** The absolute URL to hand to someone else. */
  url: string | null;
  sharedAt: string | null;
}

export function createShareToken(): string {
  return randomBytes(SHARE_TOKEN_BYTES).toString("base64url");
}

/**
 * A cheap shape check before we query. It is not a security boundary — the
 * unguessability of the token is — but it keeps junk out of the database and
 * makes a malformed link a plain 404.
 */
export function isValidShareToken(token: string): boolean {
  return SHARE_TOKEN_PATTERN.test(token);
}

export function sharePath(token: string): string {
  return `/r/${token}`;
}

export function shareUrl(token: string): string {
  return `${siteUrl}${sharePath(token)}`;
}

/**
 * Screenshots on a shared report are fetched through the token, never through
 * the scan id, so the page carries no identifier that works for anyone else.
 */
export function sharedScreenshotUrl(token: string, page: { id: string }): string {
  return `${sharePath(token)}/screenshot?page=${page.id}`;
}

function toShareState(scan: {
  shareToken: string | null;
  sharedAt: Date | null;
}): ScanShareState {
  return {
    shared: scan.shareToken !== null,
    token: scan.shareToken,
    url: scan.shareToken ? shareUrl(scan.shareToken) : null,
    sharedAt: scan.sharedAt?.toISOString() ?? null,
  };
}

/**
 * The current share state, for the owner only. A scan that is not the caller's
 * is reported as `forbidden` rather than `not_found`: the caller already knows
 * the id they asked about, so pretending otherwise buys nothing.
 */
export async function getScanShare(scanId: string, userId: string): Promise<ScanShareState> {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { userId: true, status: true, shareToken: true, sharedAt: true },
  });
  if (!scan) throw new ShareError("That scan does not exist.", "not_found");
  if (scan.userId !== userId) {
    throw new ShareError("You can only share scans from your own account.", "forbidden");
  }
  return toShareState(scan);
}

export async function enableScanShare(scanId: string, userId: string): Promise<ScanShareState> {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { userId: true, status: true, shareToken: true, sharedAt: true },
  });
  if (!scan) throw new ShareError("That scan does not exist.", "not_found");
  if (scan.userId !== userId) {
    throw new ShareError("You can only share scans from your own account.", "forbidden");
  }
  // Shareable is exactly "the report exists": finished, with or without pages
  // that failed. Running, queued, failed and cancelled scans have nothing to
  // stand behind, so they are refused rather than published empty.
  if (!isReportReady(scan.status as ScanStatusId)) {
    throw new ShareError(
      "Only a finished audit can be shared — this one has not completed yet.",
      "not_shareable",
    );
  }

  // Idempotent: pressing share twice returns the link that already exists rather
  // than rotating it out from under whoever holds the first one.
  if (scan.shareToken) return toShareState(scan);

  const updated = await prisma.scan.update({
    where: { id: scanId },
    data: { shareToken: createShareToken(), sharedAt: new Date() },
    select: { shareToken: true, sharedAt: true },
  });
  return toShareState(updated);
}

export async function disableScanShare(scanId: string, userId: string): Promise<ScanShareState> {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { userId: true, shareToken: true, sharedAt: true },
  });
  if (!scan) throw new ShareError("That scan does not exist.", "not_found");
  if (scan.userId !== userId) {
    throw new ShareError("You can only share scans from your own account.", "forbidden");
  }

  const updated = await prisma.scan.update({
    where: { id: scanId },
    data: { shareToken: null, sharedAt: null },
    select: { shareToken: true, sharedAt: true },
  });
  return toShareState(updated);
}

export interface SharedReport {
  /** The token the report was reached with, for links that stay inside it. */
  token: string;
  /** The scan, as recorded — the shared page names the URL that was audited. */
  scan: ScanStatusDto;
  results: ScanResultsDto;
}

/**
 * Resolve a token to the report it names.
 *
 * Returns `null` for everything that is not a readable shared report: a
 * malformed token, an unknown one, a revoked one, or a scan that is not in a
 * shareable state. The caller turns all of them into a 404, so a revoked link
 * is indistinguishable from one that never existed.
 */
export async function getSharedReport(token: string): Promise<SharedReport | null> {
  if (!isValidShareToken(token)) return null;

  const scan = await prisma.scan.findUnique({
    where: { shareToken: token },
    select: { id: true, status: true },
  });
  if (!scan) return null;
  // Re-checked at read time: a token must not keep a report readable after the
  // scan has been restarted into a state that was never shareable.
  if (!isReportReady(scan.status as ScanStatusId)) return null;

  const results = await getScanResultsDto(scan.id, {
    screenshotUrlFor: (page) => sharedScreenshotUrl(token, page),
  });
  if (!results) return null;

  return { token, scan: results.scan, results };
}

/**
 * The page a shared screenshot belongs to: the token must name the scan, and the
 * page must belong to that scan. Returns the stored path, never a request value.
 */
export async function resolveSharedScreenshot(
  token: string,
  pageId: string,
): Promise<string | null> {
  if (!isValidShareToken(token)) return null;

  const page = await prisma.scannedPage.findFirst({
    where: { id: pageId, scan: { shareToken: token } },
    select: { screenshotPath: true },
  });
  return page?.screenshotPath ?? null;
}
