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
import { planNextPages } from "./crawl";
import { analyzePage, type AnalysisOutcome, type AnalysisOptions } from "./pipeline";
import { readScreenshot, saveScreenshot } from "./screenshot-store";
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
      "That scope is not available yet — audits cover a single page or a whole site up to five pages.",
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

/**
 * The scan-level message when the seed page itself failed.
 *
 * A bot-blocked seed ends a whole-site crawl before it starts — the error
document's links are not the site's links — so the message must say the crawl
 * never started and offer the two ways through, not just the HTTP code. The
 * provider is read from the scan record rather than re-detected, so the fetch
 * and browser pipelines report the same block in the same words. Pure: the
 * terminal write in `runClaimedScan` is the only caller.
 */
export function seedErrorMessage(input: {
  statusCode: number;
  blockedProvider: string | null;
  maxPages: number;
}): string {
  if (input.blockedProvider) {
    const crawlNote =
      input.maxPages > 1
        ? ", so the crawl never started and no pages were audited"
        : " before it could be audited";
    return (
      `${input.blockedProvider} bot verification blocked the seed page${crawlNote}. ` +
      "The blocked-page finding has the allowlist steps — or audit the page from your own browser at /audit/this-page, which runs with your session."
    );
  }
  return `The page responded with HTTP ${input.statusCode}; findings describe the error document.`;
}

/** Provider name when the seed outcome carries the bot-challenge finding. */
function seedBlockedProvider(outcome: AnalysisOutcome): string | null {
  if (!outcome.findings.some((finding) => finding.ruleId === "bot-challenge")) {
    return null;
  }
  return typeof outcome.renderMeta.botChallenge === "string"
    ? outcome.renderMeta.botChallenge
    : "Bot protection";
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
 * A soft ceiling on how long one scan may keep crawling, comfortably inside
 * the stale window that would have another process write it off as
 * interrupted. A site with the budget's worth of pages is reported with the
 * pages it has; the budget only stops the crawl from running unbounded.
 */
const CRAWL_TIME_BUDGET_MS = 8 * 60 * 1000;

/** Persist one analyzed page: row, screenshot, findings. Never throws for a screenshot. */
async function persistScannedPage(
  scanId: string,
  outcome: AnalysisOutcome,
): Promise<{ pageId: string; failed: boolean }> {
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
        // Measured boxes for the report's screenshot markers. Capped at
        // capture time; validated again on the way out in queries.ts.
        elementRects: (outcome.elementRects ?? []) as unknown as Prisma.InputJsonValue,
        // The deduplicated link inventory the crawler plans the next pages
        // from; capped by the renderer, and the render meta records whether
        // the cap was hit.
        links: outcome.links as unknown as Prisma.InputJsonValue,
      } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  if (outcome.screenshot) {
    // The bytes go to the database first, in their own transaction: that is
    // the copy the web tier serves (it cannot see this worker's disk), and it
    // must not be lost because writing the worker-local file failed. The file
    // is a convenience for retention and local debugging — when *it* fails,
    // only the convenience is gone.
    try {
      await prisma.scannedPage.update({
        where: { id: page.id },
        data: { screenshotData: Buffer.from(outcome.screenshot) },
      });
    } catch {
      // A screenshot that cannot be stored is missing evidence, not a failed
      // scan — the findings stand on their own measurements.
    }
    try {
      const storedPath = await saveScreenshot(scanId, page.id, outcome.screenshot);
      await prisma.scannedPage.update({
        where: { id: page.id },
        data: { screenshotPath: storedPath },
      });
    } catch {
      // Same principle: the report degrades to "no screenshot", not to a
      // failed audit.
    }
  }

  const rows = findingRows(scanId, page.id, outcome);
  if (rows.length > 0) {
    await prisma.finding.createMany({ data: rows });
  }

  return { pageId: page.id, failed: isError };
}

/**
 * Process a scan that is already claimed (status "running").
 *
 * Runs the seed URL, then — for scopes that carry a page budget — follows
 * same-origin links from each page's inventory until the budget or the time
 * budget runs out. Every follow-up page is validated and analysed exactly as
 * the seed was: one dead link costs that page, never the scan.
 *
 * `resolve` and `fetchImpl` are injectable so the pipeline can be exercised
 * without network access.
 */
export async function runClaimedScan(scanId: string, options: RunOptions = {}): Promise<void> {
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan || scan.status !== "running") return;

  const startedAt = scan.startedAt?.getTime() ?? Date.now();
  const onStage = (stage: ScanStageId) => setStage(scanId, stage);
  const scope = scopeOption(scan.scope as ScanScopeId);

  try {
    await onStage("validating");
    const seed = await validateScanUrl(scan.normalizedUrl, options.resolve);

    let pagesScanned = 0;
    let pagesFailed = 0;
    let firstOutcome: AnalysisOutcome | null = null;
    let crawlStoppedByBudget = false;

    // Normalized URLs this scan owns: the seed plus everything planned or
    // scanned, so the crawl can never visit one page twice.
    const known = new Set<string>([seed.url.toString()]);
    const queue: string[] = [];

    const scanOnePage = async (rawUrl: string): Promise<AnalysisOutcome> => {
      await onStage("validating");
      // Every followed URL clears the same SSRF gates as the seed: DNS is
      // re-resolved per page, so a link that went private since the seed was
      // rendered is still refused.
      const { url } = await validateScanUrl(rawUrl, options.resolve);
      await onStage("rendering");
      const outcome = await analyzePage(url, options, scan.viewportWidth, scan.viewportHeight);
      await onStage("preparing");
      return outcome;
    };

    // Seed page first. Its failures are the scan's failures, as before.
    const seedOutcome = await scanOnePage(seed.url.toString());
    firstOutcome = seedOutcome;
    const seedResult = await persistScannedPage(scanId, seedOutcome);
    pagesScanned += 1;
    if (seedResult.failed) pagesFailed += 1;

    // Plan follow-up pages from the seed's inventory while the render context
    // and the reader's patience both last. Fetch-mode outcomes carry no links,
    // so a degraded scan is a one-page scan — stated by renderMode, never
    // pretended away. An error document's links are not the site's links, so
    // a failed seed page ends the crawl where it began.
    if (scope.maxPages > 1 && seedOutcome.links && !seedResult.failed) {
      for (const next of planNextPages({
        scannedUrl: seed.url.toString(),
        seedUrl: scan.normalizedUrl,
        links: seedOutcome.links.links,
        known,
        remaining: scope.maxPages - pagesScanned,
      })) {
        known.add(next);
        queue.push(next);
      }

      // The progress view reads pagesTotal: after the first page it means the
      // real count for this site, not the scope's ceiling.
      await prisma.scan.update({
        where: { id: scanId },
        data: { pagesTotal: pagesScanned + queue.length },
      });

      while (queue.length > 0) {
        if (Date.now() - startedAt > CRAWL_TIME_BUDGET_MS) {
          crawlStoppedByBudget = true;
          break;
        }
        const nextUrl = queue.shift() as string;
        try {
          const outcome = await scanOnePage(nextUrl);
          await persistScannedPage(scanId, outcome);
          pagesScanned += 1;
          if (outcome.statusCode >= 400) pagesFailed += 1;

          // Breadth across the site, not depth down one branch: links from
          // every page join the same queue, so /pricing and /about both make
          // the cut before either section's children do.
          if (outcome.links) {
            for (const next of planNextPages({
              scannedUrl: outcome.finalUrl,
              seedUrl: scan.normalizedUrl,
              links: outcome.links.links,
              known,
              remaining: scope.maxPages - pagesScanned - queue.length,
            })) {
              known.add(next);
              queue.push(next);
            }
          }

          // Live counters: the reader watches 2 of 3 become 3 of 3.
          await prisma.scan.update({
            where: { id: scanId },
            data: {
              pagesScanned,
              pagesFailed,
              pagesTotal: pagesScanned + queue.length,
            },
          });
        } catch (error) {
          // A follow-up page that cannot be validated, fetched or rendered is
          // one unvisited page, not a failed audit: record it and carry on.
          pagesScanned += 1;
          pagesFailed += 1;
          const reason =
            error instanceof UrlValidationError || error instanceof FetchError
              ? error.message
              : "The page could not be analysed.";
          await prisma.scannedPage.create({
            data: {
              scanId,
              url: nextUrl,
              title: null,
              statusCode: null,
              loadTimeMs: null,
              rendered: false,
              errorMessage: reason,
              metadata: {} as Prisma.InputJsonValue,
            },
          });
          await prisma.scan.update({
            where: { id: scanId },
            data: { pagesScanned, pagesFailed, pagesTotal: pagesScanned + queue.length },
          });
        }
      }
    }

    await onStage("preparing");
    const outcome = firstOutcome as AnalysisOutcome;
    const isError = outcome.statusCode >= 400;
    const durationMs = Date.now() - startedAt;
    const metadata = await readMetadata(scanId);

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: pagesFailed === 0 ? "completed" : "partially_completed",
        pagesScanned,
        pagesFailed,
        completedAt: new Date(),
        durationMs,
        errorMessage: isError
          ? seedErrorMessage({
              statusCode: outcome.statusCode,
              blockedProvider: seedBlockedProvider(outcome),
              maxPages: scope.maxPages,
            })
          : pagesFailed > 0
            ? `${pagesFailed} of ${pagesScanned} pages could not be analysed; findings describe the rest.`
            : crawlStoppedByBudget
              ? `The crawl reached its time budget after ${pagesScanned} page${pagesScanned === 1 ? "" : "s"}; the findings cover those.`
              : null,
        metadata: {
          ...metadata,
          stage: "preparing",
          renderMode: outcome.renderMode,
          ...(outcome.renderFallbackReason
            ? { renderFallbackReason: outcome.renderFallbackReason }
            : {}),
          ...(crawlStoppedByBudget
            ? { crawlStoppedByBudget: true, crawlBudgetMinutes: CRAWL_TIME_BUDGET_MS / 60_000 }
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
 * Repair screenshots captured before the web tier learned to serve DB bytes.
 *
 * Rows written by an older worker carry only `screenshotPath` — a file on
 * *this* host's disk, which the web tier on its separate host has never been
 * able to read. That is why old reports showed a broken image: the report
 * advertised the path, and the server on the other machine found nothing
 * there. The bytes are the copy the web tier serves, so this reads each
 * worker-local file back and stores it on the row, once.
 *
 * Bounded and side-effect-light by design: newest first, a fixed batch per
 * call, and a file that is already gone is skipped rather than treated as an
 * error — retention deletes files, and a lost file is a lost screenshot, not a
 * broken scan. Returns how many rows were repaired so the worker can log it.
 */
export async function backfillScreenshotBytes(limit = 500): Promise<number> {
  const rows = await prisma.scannedPage.findMany({
    where: { screenshotPath: { not: null }, screenshotData: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, screenshotPath: true },
  });

  let repaired = 0;
  for (const row of rows) {
    if (!row.screenshotPath) continue;
    const bytes = await readScreenshot(row.screenshotPath);
    if (!bytes) continue;
    try {
      await prisma.scannedPage.update({
        where: { id: row.id },
        // A copy rather than the Buffer itself: Prisma's Bytes field wants a
        // Uint8Array over a plain ArrayBuffer, and a pooled Buffer may carry
        // ArrayBufferLike.
        data: { screenshotData: new Uint8Array(bytes) },
      });
      repaired += 1;
    } catch {
      // One unrepairable row must not stop the rest of the batch.
    }
  }
  return repaired;
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
