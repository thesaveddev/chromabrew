/**
 * In-browser audit: the same engines as the server pipeline, run in the
 * visitor's own tab.
 *
 * The server scanner fetches pages with its own identity, so a site behind
 * Cloudflare (or any bot verification, login wall, or IP allowlist) answers
 * it with a challenge instead of the page — and the honest result is a
 * refusal, not a report. But the visitor already passed that challenge in
 * their own browser: their session, cookies, IP and fingerprint are cleared.
 * Running axe-core plus the DOM/contrast analysis against the live page they
 * can already see genuinely inherits that clearance, because it *is* their
 * session. No iframe tricks, no cookie smuggling, no credential exfiltration.
 *
 * Client-safe by construction: only client-safe audit modules (page-facts,
 * dom-collect, axe adapter, contrast rules, fixes, dedupe) plus `axe-core`.
 * Nothing here fetches the page, touches the network, or sends page content
 * anywhere — results stay on the visitor's machine unless they choose to
 * copy or export them. In particular this module never imports `browser.ts`
 * (Playwright), `analyzer.ts` (fetch/SSRF) or `url-validator.ts`
 * (`node:net`): it imports the client-safe `page-facts.ts` and
 * `dom-collect.ts` those modules were split out into.
 *
 * Coverage honesty is preserved: when axe cannot run, the result says so
 * with the reason instead of reporting an empty violation list as a pass —
 * the same rule the server pipeline follows.
 */

import { AXE_RUN_TAGS, mapAxeViolations, type AxeResults } from "./axe";
import { buildContrastFindings, measureContrast } from "./contrast-rules";
import { dedupeFindings } from "./dedupe";
import { collectTextSamples } from "./dom-collect";
import { applyProposedFixes } from "./fixes";
import {
  analyzePageFacts,
  AUDIT_RULE_COUNT,
  extractPageFacts,
} from "./page-facts";
import { AUDIT_RULES_VERSION } from "./types";
import type { FindingDraft, UnmeasurableReasonId } from "./types";

export const IN_BROWSER_MAX_TEXT_SAMPLES = 400;
export const IN_BROWSER_MAX_ELEMENTS_VISITED = 6_000;

export interface InBrowserCoverage {
  /** Which engines produced the findings below. */
  engines: { meta: boolean; contrast: boolean; axe: boolean };
  /** Why axe produced no results, or null when it ran. */
  axeError: string | null;
  /** axe-core version that ran, when it ran. */
  axeVersion: string | null;
  measurable: number;
  unmeasurable: number;
  failing: number;
  unmeasurableReasons: Partial<Record<UnmeasurableReasonId, number>>;
  textSamplesTruncated: boolean;
}

export interface InBrowserAuditResult {
  url: string;
  title: string | null;
  findings: FindingDraft[];
  duplicates: { finding: FindingDraft; groupId: string; keptRuleId: string }[];
  duplicatesGrouped: number;
  coverage: InBrowserCoverage;
  rulesVersion: string;
  durationMs: number;
}

interface AxeModule {
  run: (
    context: Document,
    options: unknown,
  ) => Promise<{ violations: unknown[]; incomplete?: unknown[] } & Record<string, unknown>>;
  version?: string;
}

async function loadAxe(): Promise<AxeModule> {
  const mod = (await import("axe-core")) as unknown as {
    default?: AxeModule;
  } & AxeModule;
  const axe = mod.default ?? mod;
  if (!axe || typeof axe.run !== "function") {
    throw new Error("axe-core did not expose a runnable engine.");
  }
  return axe;
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").trim().slice(0, 300) || "axe failed for an unknown reason";
}

/**
 * Audit the current document. Must be called in a browser tab, in the page's
 * own (or an extension isolated) world with access to its DOM.
 */
export async function runInBrowserAudit(
  doc: Document = document,
): Promise<InBrowserAuditResult> {
  const started = Date.now();
  const url =
    typeof doc.location?.href === "string" && doc.location.href.length > 0
      ? doc.location.href
      : "this page";

  // 1. Structural rules over the rendered markup — the same facts and rules
  // as the server's Stage 1, read from the live DOM serialisation.
  const html = doc.documentElement?.outerHTML ?? "";
  const facts = extractPageFacts(html, url);
  const metaFindings = analyzePageFacts(facts, {
    url,
    statusCode: 200,
    contentType: typeof doc.contentType === "string" ? doc.contentType : "text/html",
    botChallenge: null,
  });

  // 2. Measured contrast from computed styles — the same collector the
  // server serialises into scanned pages, executed here directly.
  const collection = collectTextSamples({
    maxSamples: IN_BROWSER_MAX_TEXT_SAMPLES,
    maxElements: IN_BROWSER_MAX_ELEMENTS_VISITED,
  });
  const summary = measureContrast(collection.samples);
  const contrastFindings = buildContrastFindings(collection.samples);

  // 3. axe-core against the live document. A failure here is recorded, never
  // swallowed: the other two engines' findings still stand, and coverage
  // says axe did not run.
  let axeFindings: FindingDraft[] = [];
  let axeError: string | null = null;
  let axeVersion: string | null = null;
  try {
    const axe = await loadAxe();
    axeVersion = typeof axe.version === "string" ? axe.version : null;
    const raw = await axe.run(doc, {
      runOnly: { type: "tag", values: [...AXE_RUN_TAGS] },
      resultTypes: ["violations", "incomplete"],
    });
    axeFindings = mapAxeViolations(raw as unknown as AxeResults);
  } catch (error) {
    axeError = describeError(error);
  }

  const { kept, duplicates } = dedupeFindings([
    ...metaFindings,
    ...contrastFindings,
    ...axeFindings,
  ]);
  const findings = applyProposedFixes(kept);

  return {
    url,
    title: typeof doc.title === "string" && doc.title.length > 0 ? doc.title : null,
    findings,
    duplicates,
    duplicatesGrouped: duplicates.length,
    coverage: {
      engines: { meta: true, contrast: true, axe: axeError === null },
      axeError,
      axeVersion,
      measurable: summary.measurable,
      unmeasurable: summary.unmeasurable,
      failing: summary.failing,
      unmeasurableReasons: collection.unmeasurableReasons,
      textSamplesTruncated: collection.truncated,
    },
    rulesVersion: AUDIT_RULES_VERSION,
    durationMs: Date.now() - started,
  };
}

/** The structural rule count, for coverage copy ("10 native rules"). */
export { AUDIT_RULE_COUNT };
