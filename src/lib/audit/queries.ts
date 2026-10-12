/**
 * Read-side queries for the audit feature.
 *
 * Everything the API returns is built here so the client-facing shape lives in
 * one place and never leaks internal columns (ipHash, metadata internals,
 * userAgent) by accident.
 */

import { prisma } from "@/lib/db";
// The rule catalogue lives with the rules; queries only needs the count as a
// fallback for rows written before it was recorded in metadata.
import { AUDIT_RULE_COUNT } from "./analyzer";
import { buildScanCoverage } from "./coverage";
import {
  PROPOSED_FIX_KEY,
  parseProposedFix,
  SEVERITY_ORDER,
  type DetectionMethodId,
  type FindingCategoryId,
  type FindingDto,
  type FindingSeverityId,
  type ProposedFixData,
  type ScanResultsDto,
  type RenderModeId,
  type ScanScopeId,
  type ScanStageId,
  type ScanStatusDto,
  type ScanStatusId,
  type ScannedPageDto,
} from "./types";

export type { ScanResultsDto, ScanStatusDto };

function parseStage(metadata: unknown): ScanStageId {
  const stage =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>).stage
      : undefined;
  return stage === "validating" || stage === "rendering" || stage === "analyzing" || stage === "preparing"
    ? stage
    : "validating";
}

function parseRuleCount(metadata: unknown): number {
  const value =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>).ruleCount
      : undefined;
  return typeof value === "number" && Number.isFinite(value) ? value : AUDIT_RULE_COUNT;
}

function parseNumber(metadata: unknown, key: string): number | null {
  const value =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)[key]
      : undefined;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseRenderMode(metadata: unknown): RenderModeId | null {
  const value =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>).renderMode
      : undefined;
  return value === "browser" || value === "fetch" ? value : null;
}

/**
 * The generated replacement for a finding, stored as `suggestedValues.fix`.
 *
 * This JSON comes back from the database and rows written before fix
 * generation existed simply do not have the key, so it is narrowed rather than
 * cast: a missing or malformed value costs the report its fix and nothing else.
 */
function parseFix(suggestedValues: unknown): ProposedFixData | null {
  if (!suggestedValues || typeof suggestedValues !== "object" || Array.isArray(suggestedValues)) {
    return null;
  }
  return parseProposedFix((suggestedValues as Record<string, unknown>)[PROPOSED_FIX_KEY]);
}

type ScanRow = {
  id: string;
  url: string;
  normalizedUrl: string;
  status: string;
  scope: string;
  viewportWidth: number;
  viewportHeight: number;
  pagesScanned: number;
  pagesTotal: number;
  pagesFailed: number;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  metadata: unknown;
};

function toStatusDto(scan: ScanRow): ScanStatusDto {
  return {
    id: scan.id,
    url: scan.url,
    normalizedUrl: scan.normalizedUrl,
    status: scan.status as ScanStatusId,
    stage: parseStage(scan.metadata),
    scope: scan.scope as ScanScopeId,
    viewportWidth: scan.viewportWidth,
    viewportHeight: scan.viewportHeight,
    pagesScanned: scan.pagesScanned,
    pagesTotal: scan.pagesTotal,
    pagesFailed: scan.pagesFailed,
    errorMessage: scan.errorMessage,
    createdAt: scan.createdAt.toISOString(),
    startedAt: scan.startedAt?.toISOString() ?? null,
    completedAt: scan.completedAt?.toISOString() ?? null,
    durationMs: scan.durationMs,
    ruleCount: parseRuleCount(scan.metadata),
    renderMode: parseRenderMode(scan.metadata),
  };
}

export async function getScanStatusDto(id: string): Promise<ScanStatusDto | null> {
  const scan = await prisma.scan.findUnique({
    where: { id },
    select: {
      id: true,
      url: true,
      normalizedUrl: true,
      status: true,
      scope: true,
      viewportWidth: true,
      viewportHeight: true,
      pagesScanned: true,
      pagesTotal: true,
      pagesFailed: true,
      errorMessage: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      durationMs: true,
      metadata: true,
    },
  });
  return scan ? toStatusDto(scan) : null;
}

export interface ScanResultsOptions {
  /**
   * Where the report fetches its screenshots from. The owner's report uses the
   * scan-scoped route; a shared report uses its token, so a shared page never
   * carries an id that resolves for anyone who is not the owner.
   */
  screenshotUrlFor?: (page: { id: string; scanId: string }) => string;
}

function defaultScreenshotUrl(page: { id: string; scanId: string }): string {
  return `/api/audit/scan/${page.scanId}/screenshot?page=${page.id}`;
}

export async function getScanResultsDto(
  id: string,
  options: ScanResultsOptions = {},
): Promise<ScanResultsDto | null> {
  const screenshotUrlFor = options.screenshotUrlFor ?? defaultScreenshotUrl;
  const scan = await prisma.scan.findUnique({
    where: { id },
    select: {
      id: true,
      url: true,
      normalizedUrl: true,
      status: true,
      scope: true,
      viewportWidth: true,
      viewportHeight: true,
      pagesScanned: true,
      pagesTotal: true,
      pagesFailed: true,
      errorMessage: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      durationMs: true,
      metadata: true,
      scannedPages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          url: true,
          title: true,
          statusCode: true,
          loadTimeMs: true,
          errorMessage: true,
          rendered: true,
          screenshotPath: true,
        },
      },
      findings: {
        // Grouped duplicates are kept in the table but never double-counted in
        // the report the user reads.
        where: { isDuplicate: false },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          ruleId: true,
          category: true,
          severity: true,
          title: true,
          description: true,
          whyMatters: true,
          recommendation: true,
          implementation: true,
          elementSelector: true,
          wcagCriterion: true,
          detectionMethod: true,
          confidence: true,
          createdAt: true,
          pageId: true,
          suggestedValues: true,
        },
      },
    },
  });
  if (!scan) return null;

  const pages: ScannedPageDto[] = scan.scannedPages.map((page) => ({
    id: page.id,
    url: page.url,
    title: page.title,
    statusCode: page.statusCode,
    loadTimeMs: page.loadTimeMs,
    errorMessage: page.errorMessage,
    rendered: page.rendered,
    // The screenshot route re-checks that the page belongs to the scan; the id
    // is never used as a filesystem path.
    screenshotUrl: page.screenshotPath
      ? screenshotUrlFor({ id: page.id, scanId: scan.id })
      : null,
  }));

  const urlByPageId = new Map(pages.map((page) => [page.id, page.url]));

  const findings: FindingDto[] = scan.findings.map((finding) => ({
    id: finding.id,
    ruleId: finding.ruleId,
    category: finding.category as FindingCategoryId,
    severity: finding.severity as FindingSeverityId,
    title: finding.title,
    description: finding.description,
    whyMatters: finding.whyMatters,
    recommendation: finding.recommendation,
    implementation: finding.implementation,
    elementSelector: finding.elementSelector,
    wcagCriterion: finding.wcagCriterion,
    detectionMethod: finding.detectionMethod as DetectionMethodId,
    confidence: finding.confidence === null ? null : Number(finding.confidence),
    pageUrl: finding.pageId ? (urlByPageId.get(finding.pageId) ?? null) : null,
    createdAt: finding.createdAt.toISOString(),
    fix: parseFix(finding.suggestedValues),
  }));

  const counts = { total: findings.length } as Record<FindingSeverityId, number> & {
    total: number;
  };
  for (const severity of SEVERITY_ORDER) counts[severity] = 0;
  const categories: Partial<Record<FindingCategoryId, number>> = {};
  for (const finding of findings) {
    counts[finding.severity] += 1;
    categories[finding.category] = (categories[finding.category] ?? 0) + 1;
  }

  return {
    scan: toStatusDto(scan),
    counts,
    categories,
    pages,
    findings,
    duplicatesGrouped: parseNumber(scan.metadata, "duplicatesGrouped") ?? 0,
    coverage: buildScanCoverage(scan.metadata, AUDIT_RULE_COUNT),
  };
}
