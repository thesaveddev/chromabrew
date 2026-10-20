/**
 * The analysis pipeline.
 *
 * Two pipelines produce the same shape of result:
 *
 *   browser — render the page in a real browser, run axe-core inside it, measure
 *             contrast from computed styles, capture a screenshot, collect links
 *   fetch   — analyse only the HTML the server sent
 *
 * The browser pipeline is preferred, and the fetch pipeline is what happens
 * when it cannot run. That degradation is the single most important decision in
 * this module, so it is stated explicitly rather than inferred from empty
 * results:
 *
 *   - every fallback carries `renderFallbackReason`, which is stored on the scan
 *     and shown in the report next to the findings;
 *   - a fallback outcome leaves the render-only facts absent (`links: null`,
 *     no `renderMeta` keys), so coverage reads "not measured", never zero;
 *   - an error that is *not* a renderer problem is rethrown. A page that breaks
 *     the pipeline must fail the scan, not silently become a thin report.
 *
 * Nothing here touches the database, the filesystem or the clock beyond what it
 * measures, which is what makes the decision above testable offline.
 */

import { analyzePageFacts, analyzeUrl, extractPageFacts, type PageFacts } from "./analyzer";
import { detectBotChallenge } from "./challenge";
import { AXE_RUN_TAGS, mapAxeViolations } from "./axe";
import {
  isBrowserRendererAvailable,
  renderPage,
  RendererError,
  RendererUnavailableError,
  type RenderedPage,
  type RenderOptions,
} from "./browser";
import { buildContrastFindings, measureContrast } from "./contrast-rules";
import { dedupeFindings } from "./dedupe";
import { applyProposedFixes } from "./fixes";
import type { HostResolver } from "./url-validator";
import type { FindingDraft, JsonObject, LinkInventory, RenderModeId, ScanStageId } from "./types";

/** How many refused request URLs to keep as evidence. */
const MAX_RECORDED_BLOCKED_REQUESTS = 10;

export interface AnalysisOutcome {
  renderMode: RenderModeId;
  /** Set when the browser was tried and could not be used. */
  renderFallbackReason: string | null;
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  title: string | null;
  loadTimeMs: number;
  bytes: number;
  truncated: boolean;
  redirects: string[];
  facts: PageFacts;
  /** The link inventory, or null when the HTML was fetched instead of rendered. */
  links: LinkInventory | null;
  /** Deduplicated: findings that lost to a better-sourced twin are in `duplicates`. */
  findings: FindingDraft[];
  duplicates: { finding: FindingDraft; groupId: string; keptRuleId: string }[];
  duplicatesGrouped: number;
  screenshot: Uint8Array | null;
  /** Facts the report quotes about the engines, keyed for the scan metadata. */
  renderMeta: JsonObject;
}

/**
 * The browser seam.
 *
 * Production uses Playwright; tests pass their own so both branches of the
 * degradation decision can be exercised without a browser host, and pass `null`
 * to represent a host where rendering is switched off.
 */
export interface PageRenderer {
  available(): Promise<boolean>;
  render(url: URL, options: RenderOptions): Promise<RenderedPage>;
}

const playwrightRenderer: PageRenderer = {
  available: isBrowserRendererAvailable,
  render: (url, options) => renderPage(url, options),
};

export interface AnalysisOptions {
  /** Injectable for tests; defaults to the system resolver. */
  resolve?: HostResolver;
  /** Injectable for tests; the fetch pipeline uses it instead of network I/O. */
  fetchImpl?: typeof fetch;
  /**
   * The renderer to use. Omit for Playwright; pass `null` to pin the pipeline
   * to the fetch path (this is how "no browser on this host" is tested).
   */
  renderer?: PageRenderer | null;
  onStage?: (stage: ScanStageId) => void | Promise<void>;
}

async function analyzeWithFetch(
  url: URL,
  options: AnalysisOptions,
  onStage: (stage: ScanStageId) => Promise<void>,
): Promise<AnalysisOutcome> {
  const outcome = await analyzeUrl(url, {
    resolve: options.resolve,
    fetchImpl: options.fetchImpl,
    onStage,
  });
  const deduped = dedupeFindings(outcome.findings);
  return {
    renderMode: "fetch",
    renderFallbackReason: null,
    finalUrl: outcome.page.finalUrl,
    statusCode: outcome.page.statusCode,
    contentType: outcome.page.contentType,
    title: outcome.facts.title,
    loadTimeMs: outcome.page.loadTimeMs,
    bytes: outcome.page.bytes,
    truncated: outcome.page.truncated,
    redirects: outcome.page.redirects,
    facts: outcome.facts,
    // Link discovery needs a DOM: a fetch sees only the served HTML.
    links: null,
    // Fixes are generated once, here, for both pipelines: the metadata rules run
    // on the served HTML too, so a fetch-only scan still gets them.
    findings: applyProposedFixes(deduped.kept),
    duplicates: deduped.duplicates,
    duplicatesGrouped: deduped.duplicates.length,
    screenshot: null,
    // Nothing rendered, so no computed-style, contrast, link or axe facts exist.
    // They are absent rather than zeroed: "not collected" and "collected and
    // empty" are different statements and the report must be able to tell.
    renderMeta: { nativeFindingCount: outcome.findings.length },
  };
}

async function analyzeWithBrowser(
  url: URL,
  renderer: PageRenderer,
  options: AnalysisOptions,
  width: number,
  height: number,
  onStage: (stage: ScanStageId) => Promise<void>,
): Promise<AnalysisOutcome> {
  const rendered = await renderer.render(url, {
    width,
    height,
    resolve: options.resolve,
    onStage: async (stage) => {
      await onStage(stage);
    },
  });

  // A bot-protection interstitial is not a page: the engines must not be
  // pointed at it, or the report would audit the provider's challenge screen
  // and present it as the reader's site.
  const botChallenge = detectBotChallenge({
    statusCode: rendered.statusCode,
    server: rendered.server,
    cfMitigated: rendered.cfMitigated,
    html: rendered.html,
  });

  // The rendered DOM, not the served response: JavaScript-built markup and copy
  // are part of the page the user actually sees.
  const facts = extractPageFacts(rendered.html, rendered.finalUrl);
  const context = {
    url: rendered.finalUrl,
    statusCode: rendered.statusCode,
    contentType: rendered.contentType,
    botChallenge,
  };

  if (botChallenge) {
    return {
      renderMode: "browser",
      renderFallbackReason: null,
      finalUrl: rendered.finalUrl,
      statusCode: rendered.statusCode,
      contentType: rendered.contentType,
      title: rendered.title,
      loadTimeMs: rendered.loadTimeMs,
      bytes: rendered.html.length,
      truncated: rendered.textSamplesTruncated,
      redirects: [],
      facts,
      // The interstitial's links belong to the provider, not the site.
      links: null,
      findings: applyProposedFixes(analyzePageFacts(facts, context)),
      duplicates: [],
      duplicatesGrouped: 0,
      // Kept: the interstitial is the evidence that the scan was blocked.
      screenshot: rendered.screenshot,
      // Render-only keys stay absent so coverage reads "not measured" —
      // nothing of the site was measured, because none of it was rendered.
      renderMeta: { botChallenge: botChallenge.provider },
    };
  }

  const native = analyzePageFacts(facts, context);

  // Engine output is measured before deduplication: the coverage panel states
  // what each engine actually reported, and `duplicatesGrouped` states how much
  // of it described the same problem twice.
  const axeFindings = rendered.axeResults ? mapAxeViolations(rendered.axeResults) : [];
  const contrastFindings = buildContrastFindings(rendered.textSamples);
  const contrastSummary = measureContrast(rendered.textSamples);
  const nativeFindings = [...native, ...contrastFindings];
  // Deduplicate first, then fix: a problem two engines agreed on is one problem
  // and should carry one proposal.
  const deduped = dedupeFindings([...nativeFindings, ...axeFindings]);
  const fixed = applyProposedFixes(deduped.kept);

  return {
    renderMode: "browser",
    renderFallbackReason: null,
    finalUrl: rendered.finalUrl,
    statusCode: rendered.statusCode,
    contentType: rendered.contentType,
    title: rendered.title,
    loadTimeMs: rendered.loadTimeMs,
    bytes: rendered.html.length,
    truncated: rendered.textSamplesTruncated,
    redirects: [],
    facts,
    links: rendered.links,
    findings: fixed,
    duplicates: deduped.duplicates,
    duplicatesGrouped: deduped.duplicates.length,
    screenshot: rendered.screenshot,
    renderMeta: {
      axeVersion: rendered.axeVersion,
      axeRan: rendered.axeResults !== null,
      // Recorded so a silent engine failure is visible in the scan record
      // instead of looking like a page with no accessibility problems.
      axeError: rendered.axeError,
      axeTags: [...AXE_RUN_TAGS],
      axeFindingCount: axeFindings.length,
      nativeFindingCount: nativeFindings.length,
      requestCount: rendered.requestCount,
      blockedRequestCount: rendered.blockedRequests.length,
      blockedRequests: rendered.blockedRequests.slice(0, MAX_RECORDED_BLOCKED_REQUESTS),
      textSampleCount: rendered.textSamples.length,
      unmeasurableSamples: rendered.unmeasurableSamples,
      unmeasurableReasons: rendered.unmeasurableReasons as JsonObject,
      measurableSamples: contrastSummary.measurable,
      failingSamples: contrastSummary.failing,
      linksFound: rendered.links.distinct,
      linksInternal: rendered.links.internal,
      linksExternal: rendered.links.external,
      linksTruncated: rendered.links.truncated,
      externalLinkHosts: rendered.links.externalHosts,
    },
  };
}

/** Analyse one validated URL, degrading from the browser to a fetch if needed. */
export async function analyzePage(
  url: URL,
  options: AnalysisOptions,
  width: number,
  height: number,
): Promise<AnalysisOutcome> {
  const onStage = async (stage: ScanStageId) => {
    await options.onStage?.(stage);
  };

  const renderer = options.renderer === undefined ? playwrightRenderer : options.renderer;

  if (!renderer || !(await renderer.available())) {
    return {
      ...(await analyzeWithFetch(url, options, onStage)),
      renderFallbackReason: renderer
        ? "Browser rendering is not installed on this server, so only the served HTML was analysed."
        : "Browser rendering is disabled on this server, so only the served HTML was analysed.",
    };
  }

  try {
    return await analyzeWithBrowser(url, renderer, options, width, height, onStage);
  } catch (error) {
    if (error instanceof RendererUnavailableError || error instanceof RendererError) {
      // Degrade rather than fail: the HTTP fetch may still work, and the
      // renderMode plus this reason tell the reader exactly what was skipped.
      const fallback = await analyzeWithFetch(url, options, onStage);
      return { ...fallback, renderFallbackReason: error.message };
    }
    // Anything else is a real failure and must reach the caller, which records
    // the scan as failed. It must never be reported as a successful thin scan.
    throw error;
  }
}
