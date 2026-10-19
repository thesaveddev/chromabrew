/**
 * Scan lifecycle.
 *
 * A scan is claimed with a conditional update, so two workers racing for the
 * same queued row cannot both process it. Every failure path writes a terminal
 * status and a user-facing message — a scan never stays "running" because a
 * process died, and a failed scan is never reported as a successful one.
 *
 * This module owns the database, the filesystem and the clock. What the page is
 * analysed *by* lives in `pipeline.ts`, which is why the pipeline can be tested
 * without a database and this file stays a thin record of state transitions.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FetchError, AUDIT_RULE_COUNT, SCANNER_USER_AGENT } from "./analyzer";
// The renderer errors can only reach this layer from a renderer's own
// availability probe — `analyzePage` converts everything else into a labelled
// fallback — and they still deserve their own terminal status.
import { RendererError, RendererUnavailableError } from "./browser";
import { analyzePage, type AnalysisOutcome, type AnalysisOptions } from "./pipeline";
import { saveScreenshot } from "./screenshot-store";
import { normalizeUrl, UrlValidationError, validateScanUrl } from "./url-validator";
import {
  AUDIT_RULES_VERSION,
  AUDIT_SCANNER_VERSION,
  SCAN_QUEUE_ABANDON_MS,
  isScopeImplemented,
  scopeOption,
  viewportOption,
  type ScanScopeId,
  type ScanScopeOption,
  type ScanStageId,
  type ViewportOption,
} from "./types";

/** A scan left running longer than this is treated as interrupted. */
const STALE_SCAN_MS = 10 * 60 * 1000;

export interface EnqueueInput {
  url: string;
  scope: ScanScopeId;
  viewportId: string;
  userId: string | null;
  ipHash: string | null;
}

export class ScanRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ScanRequestError";
    this.code = code;
  }
}

/**
 * Everything about a scan request that can be judged without the database.
 *
 * Split out of `enqueueScan` so a caller can reject bad input *before* it
 * consults the quota. The order matters: a load limit must not decide whether a
 * typo is a typo. Checking the quota first meant that while two scans were in
 * flight the public endpoint answered every request — including an unparseable
 * URL — with "the scanner is busy", and the UI showed a rate-limit message for
 * something the reader could simply fix.
 *
 * Throws `ScanRequestError` for an unimplemented scope and `UrlValidationError`
 * for a URL the scanner will not accept; both messages are written to be shown.
 *
 * `normalizeUrl` both syntax-checks the URL (throwing for junk) and strips
 * tracking parameters, so the row stores the same canonical form the worker
 * validates. `assertAllowedUrlSyntax` returns `{ url, hostname }`, and using it
 * here wrote the literal string "[object Object]" into normalizedUrl, so every
 * scan enqueued this way failed validation in the worker.
 */
export function validateScanRequest(input: {
  url: string;
  scope: ScanScopeId;
  viewportId: string;
}): { normalizedUrl: string; viewport: ViewportOption; scope: ScanScopeOption } {
  if (!isScopeImplemented(input.scope)) {
    throw new ScanRequestError(
      "scope_not_implemented",
      "That scope is not available yet — this release audits a single page. Multi-page crawling is next.",
    );
  }

  return {
    normalizedUrl: normalizeUrl(input.url),
    viewport: viewportOption(input.viewportId),
    scope: scopeOption(input.scope),
  };
}

/**
 * Create a queued scan row. The URL is syntax-checked here so obvious junk is
 * rejected synchronously, while DNS work happens in the worker.
 */
export async function enqueueScan(input: EnqueueInput): Promise<{ id: string }> {
  const { normalizedUrl, viewport, scope } = validateScanRequest({
    url: input.url,
    scope: input.scope,
    viewportId: input.viewportId,
  });

  const scan = await prisma.scan.create({
    data: {
      url: input.url.trim(),
      normalizedUrl,
      status: "queued",
      scope: input.scope,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      pagesTotal: scope.maxPages,
      pagesScanned: 0,
      pagesFailed: 0,
      userAgent: SCANNER_USER_AGENT,
      ipHash: input.ipHash,
      userId: input.userId,
      rulesVersion: AUDIT_RULES_VERSION,
      scannerVersion: AUDIT_SCANNER_VERSION,
      metadata: { stage: "validating" satisfies ScanStageId, ruleCount: AUDIT_RULE_COUNT },
    },
    select: { id: true },
  });

  return scan;
}

async function readMetadata(scanId: string): Promise<Record<string, unknown>> {
  const row = await prisma.scan.findUnique({ where: { id: scanId }, select: { metadata: true } });
  return row?.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

async function setStage(scanId: string, stage: ScanStageId) {
  const metadata = await readMetadata(scanId);
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      metadata: { ...metadata, stage, ruleCount: AUDIT_RULE_COUNT } as Prisma.InputJsonValue,
    },
  });
}

async function failScan(scanId: string, code: string, message: string, startedAt: number) {
  const metadata = await readMetadata(scanId);
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: "failed",
      errorMessage: message,
      completedAt: new Date(),
      durationMs: Date.now() - startedAt,
      metadata: { ...metadata, errorCode: code, stage: "preparing" } as Prisma.InputJsonValue,
    },
  });
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

function findingRows(
  scanId: string,
  pageId: string,
  outcome: AnalysisOutcome,
): Prisma.FindingCreateManyInput[] {
  const kept: Prisma.FindingCreateManyInput[] = outcome.findings.map((finding) => ({
    scanId,
    pageId,
    ruleId: finding.ruleId,
    category: finding.category,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    whyMatters: finding.whyMatters,
    recommendation: finding.recommendation,
    implementation: finding.implementation,
    elementSelector: finding.elementSelector,
    wcagCriterion: finding.wcagCriterion,
    detectionMethod: finding.detectionMethod,
    confidence: finding.confidence,
    ...(finding.originalValues ? { originalValues: finding.originalValues } : {}),
    ...(finding.suggestedValues ? { suggestedValues: finding.suggestedValues } : {}),
    ...(finding.evidence ? { evidence: finding.evidence } : {}),
  }));

  // Grouped duplicates are stored, not discarded: the report hides them so a
  // defect is not counted twice, but the record of what each engine said and
  // which version won stays queryable.
  const duplicates: Prisma.FindingCreateManyInput[] = outcome.duplicates.map(
    ({ finding, groupId, keptRuleId }) => ({
      scanId,
      pageId,
      ruleId: finding.ruleId,
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      whyMatters: finding.whyMatters,
      recommendation: finding.recommendation,
      implementation: finding.implementation,
      elementSelector: finding.elementSelector,
      wcagCriterion: finding.wcagCriterion,
      detectionMethod: finding.detectionMethod,
      confidence: finding.confidence,
      isDuplicate: true,
      duplicateGroupId: groupId,
      evidence: { ...(finding.evidence ?? {}), supersededBy: keptRuleId },
      ...(finding.originalValues ? { originalValues: finding.originalValues } : {}),
    }),
  );

  return [...kept, ...duplicates];
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

/** Everything `analyzePage` accepts, re-exported so callers have one import. */
export type RunOptions = AnalysisOptions;

/** Atomically move a queued scan to running. Returns false if someone else won. */
async function claim(scanId: string): Promise<boolean> {
  const claimed = await prisma.scan.updateMany({
    where: { id: scanId, status: "queued" },
    data: { status: "running", startedAt: new Date(), errorMessage: null },
  });
  return claimed.count > 0;
}

/**
 * Process a scan that is already claimed (status "running").
 *
 * `resolve` and `fetchImpl` are injectable so the pipeline can be exercised
 * without network access.
 */
export async function runClaimedScan(scanId: string, options: RunOptions = {}): Promise<void> {
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan || scan.status !== "running") return;

  const startedAt = scan.startedAt?.getTime() ?? Date.now();
  const onStage = (stage: ScanStageId) => setStage(scanId, stage);

  try {
    await onStage("validating");
    const { url } = await validateScanUrl(scan.normalizedUrl, options.resolve);

    const outcome = await analyzePage(url, options, scan.viewportWidth, scan.viewportHeight);

    await onStage("preparing");
    const isError = outcome.statusCode >= 400;

    const page = await prisma.scannedPage.create({
      data: {
        scanId,
        url: outcome.finalUrl,
        title: outcome.title,
        statusCode: outcome.statusCode,
        loadTimeMs: outcome.loadTimeMs,
        rendered: outcome.renderMode === "browser",
        errorMessage: isError ? `HTTP ${outcome.statusCode}` : null,
        metadata: {
          bytes: outcome.bytes,
          truncated: outcome.truncated,
          contentType: outcome.contentType,
          redirects: outcome.redirects,
          facts: outcome.facts as unknown as Prisma.InputJsonValue,
          renderMode: outcome.renderMode,
          render: outcome.renderMeta,
          // The deduplicated link inventory is persisted for the crawler in
          // Stage 6; already capped by the renderer, and the render meta records
          // whether the cap was hit.
          links: outcome.links as unknown as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    if (outcome.screenshot) {
      try {
        const storedPath = await saveScreenshot(scanId, page.id, outcome.screenshot);
        await prisma.scannedPage.update({
          where: { id: page.id },
          data: {
            screenshotPath: storedPath,
            // The bytes travel with the row so the web tier can serve them
            // without ever seeing the worker's disk. The file stays as the
            // worker-local copy retention cleans up.
            screenshotData: Buffer.from(outcome.screenshot),
          },
        });
      } catch {
        // A screenshot that cannot be stored is missing evidence, not a failed
        // scan — the findings stand on their own measurements.
      }
    }

    const rows = findingRows(scanId, page.id, outcome);
    if (rows.length > 0) {
      await prisma.finding.createMany({ data: rows });
    }

    const durationMs = Date.now() - startedAt;
    const metadata = await readMetadata(scanId);

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: isError ? "partially_completed" : "completed",
        pagesScanned: 1,
        pagesFailed: isError ? 1 : 0,
        completedAt: new Date(),
        durationMs,
        errorMessage: isError
          ? `The page responded with HTTP ${outcome.statusCode}; findings describe the error document.`
          : null,
        metadata: {
          ...metadata,
          stage: "preparing",
          renderMode: outcome.renderMode,
          ...(outcome.renderFallbackReason
            ? { renderFallbackReason: outcome.renderFallbackReason }
            : {}),
          axeVersion: outcome.renderMeta.axeVersion ?? null,
          axeRan: outcome.renderMeta.axeRan ?? false,
          axeError: outcome.renderMeta.axeError ?? null,
          axeFindingCount: outcome.renderMeta.axeFindingCount ?? null,
          nativeFindingCount: outcome.renderMeta.nativeFindingCount ?? null,
          blockedRequestCount: outcome.renderMeta.blockedRequestCount ?? 0,
          textSampleCount: outcome.renderMeta.textSampleCount ?? null,
          unmeasurableSamples: outcome.renderMeta.unmeasurableSamples ?? null,
          unmeasurableReasons: outcome.renderMeta.unmeasurableReasons ?? null,
          failingSamples: outcome.renderMeta.failingSamples ?? null,
          linksFound: outcome.renderMeta.linksFound ?? null,
          linksExternal: outcome.renderMeta.linksExternal ?? null,
          ruleCount: AUDIT_RULE_COUNT,
          findingCount: outcome.findings.length,
          duplicatesGrouped: outcome.duplicatesGrouped,
          durationMs,
        } as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if (error instanceof UrlValidationError) {
      await failScan(scanId, error.code, error.message, startedAt);
      return;
    }
    if (error instanceof FetchError) {
      await failScan(scanId, error.code, error.message, startedAt);
      return;
    }
    if (error instanceof RendererUnavailableError) {
      await failScan(scanId, "renderer_unavailable", error.message, startedAt);
      return;
    }
    if (error instanceof RendererError) {
      await failScan(scanId, error.code, error.message, startedAt);
      return;
    }
    await failScan(
      scanId,
      "internal",
      "The audit could not be completed. The site may be unreachable or blocking automated requests.",
      startedAt,
    );
  }
}

/** Shown to a reader whose audit nobody ever picked up. */
const ABANDONED_QUEUE_MESSAGE =
  "No scanner started this audit in time, so it was cancelled. That usually means the scanner was offline — run the audit again.";

/**
 * Close the two ways a scan can be left in the air by a process that stopped.
 *
 * `running` for longer than the stale window: the worker died mid-render.
 * `queued` for longer than the queue's own window: nothing ever claimed it —
 * the worker was down, or gone. The second is the worse one, because a queued
 * row holds one of the two scanner slots: a worker that never comes back does
 * not merely leave old rows lying around, it closes the gate on every new
 * audit for everybody. Clearing them is what lets the queue recover on its own.
 */
export async function recoverStaleScans(): Promise<number> {
  const now = Date.now();
  const staleRunning = new Date(now - STALE_SCAN_MS);
  const abandonedQueued = new Date(now - SCAN_QUEUE_ABANDON_MS);

  const [running, queued] = await Promise.all([
    prisma.scan.updateMany({
      where: { status: "running", startedAt: { lt: staleRunning } },
      data: {
        status: "failed",
        errorMessage: "The audit was interrupted before it finished. Run it again.",
        completedAt: new Date(),
      },
    }),
    prisma.scan.updateMany({
      where: { status: "queued", createdAt: { lt: abandonedQueued } },
      data: {
        status: "failed",
        errorMessage: ABANDONED_QUEUE_MESSAGE,
        completedAt: new Date(),
      },
    }),
  ]);

  return running.count + queued.count;
}

/**
 * Close one scan that has sat queued past the queue's window.
 *
 * `recoverStaleScans` sweeps, but it is called by the worker — precisely the
 * process that is missing when a queue goes stale — so a reader waiting on an
 * abandoned scan needs the poll they are already making to be able to end it.
 * Without that, a dead worker leaves them watching a progress view that can
 * never change.
 *
 * Scoped to one id and guarded by status and age, so it is a no-op against a
 * live scan and a single write against an abandoned one: after it, the row is
 * `failed` and the guard no longer matches.
 */
export async function expireAbandonedScan(scanId: string, now = Date.now()): Promise<boolean> {
  const result = await prisma.scan.updateMany({
    where: {
      id: scanId,
      status: "queued",
      createdAt: { lt: new Date(now - SCAN_QUEUE_ABANDON_MS) },
    },
    data: {
      status: "failed",
      errorMessage: ABANDONED_QUEUE_MESSAGE,
      completedAt: new Date(),
    },
  });
  return result.count > 0;
}

/**
 * Run a queued scan to a terminal state. Safe to call twice: the claim makes
 * the second caller a no-op rather than a duplicate scan.
 */
export async function runScan(scanId: string, options: RunOptions = {}): Promise<void> {
  if (!(await claim(scanId))) return;
  await runClaimedScan(scanId, options);
}

/**
 * Claim the oldest queued scan for this worker and leave it "running".
 * Returns null when the queue is empty — the signal for a worker loop to sleep.
 */
export async function claimNextScan(): Promise<string | null> {
  await recoverStaleScans();

  const next = await prisma.scan.findFirst({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!next) return null;

  return (await claim(next.id)) ? next.id : null;
}

/** Drain one job from the queue. Used by the in-process kick and by workers. */
export async function runQueuedScan(options: RunOptions = {}): Promise<string | null> {
  const id = await claimNextScan();
  if (!id) return null;
  await runClaimedScan(id, options);
  return id;
}
