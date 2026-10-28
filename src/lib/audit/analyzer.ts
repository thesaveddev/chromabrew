/**
 * Stage 1 deterministic single-page analyser.
 *
 * Two halves, deliberately separated so the interesting half is testable:
 *
 *   extractPageFacts()  — pure, dependency-free HTML fact extraction
 *   analyzePageFacts()  — pure, maps facts to findings
 *   fetchPageSafely()   — the I/O half: timeouts, size caps, redirect revalidation
 *
 * Scope note: this release analyses one fetched document. It does not execute
 * JavaScript, so findings are limited to what is present in the served HTML —
 * a real DOM pass (Stage 2) supersedes it. Every rule here reports what it
 * measured, and nothing is reported as a WCAG failure unless the criterion is
 * actually checkable from the document alone.
 */

import {
  assertSafeRedirect,
  resolveAndAssertPublic,
  type HostResolver,
  systemResolver,
  UrlValidationError,
} from "./url-validator";
import {
  AUDIT_RULES_VERSION,
  AUDIT_SCANNER_VERSION,
  META_DESCRIPTION_MAX_LENGTH,
  META_TITLE_MAX_LENGTH,
  META_TITLE_MIN_LENGTH,
  SCAN_FETCH_TIMEOUT_MS,
  SCAN_MAX_RESPONSE_BYTES,
  SCAN_MAX_REDIRECTS,
  type FindingDraft,
  type ScanStageId,
} from "./types";

// Re-exported for callers that already import the finding shape from here.
export type { FindingDraft } from "./types";

import { detectBotChallenge, type BotChallengeDetection } from "./challenge";
import { SCANNER_ACCEPT_LANGUAGE, SCANNER_BROWSER_UA } from "./scanner-identity";

/**
 * The honest scanner identity: written to the scan row as provenance and
 * quoted to site owners who ask who was scanning them. Page requests
 * themselves carry `SCANNER_BROWSER_UA` (scanner-identity.ts) so the real
 * browser the scanner drives is not announced as a bot to bot protections.
 */
export const SCANNER_USER_AGENT =
  "ChromaBrew-Audit/1.0 (+https://chromabrew.app/audit; design and accessibility audit)";

/* ------------------------------------------------------------------ */
/* Findings                                                            */
/* ------------------------------------------------------------------ */

/**
 * The catalogue of rules this release actually runs. It is exported so the
 * report can state its own coverage instead of implying a complete audit.
 */
import {
  analyzePageFacts,
  extractPageFacts,
  type PageFacts,
} from "./page-facts";

export {
  analyzePageFacts,
  AUDIT_RULE_COUNT,
  AUDIT_RULES,
  extractPageFacts,
  parseAttributes,
  type AnalyzeContext,
  type PageFacts,
} from "./page-facts";

/* ------------------------------------------------------------------ */
/* Fetching                                                            */
/* ------------------------------------------------------------------ */

export interface FetchedPage {
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  html: string;
  loadTimeMs: number;
  bytes: number;
  redirects: string[];
  truncated: boolean;
  /** The `server` response header, when present — challenge evidence. */
  server?: string | null;
  /** The `cf-mitigated` header Cloudflare sets on challenged responses. */
  cfMitigated?: string | null;
}

export class FetchError extends Error {
  readonly code: "timeout" | "too_large" | "network" | "too_many_redirects" | "blocked" | "http";

  constructor(code: FetchError["code"], message: string) {
    super(message);
    this.name = "FetchError";
    this.code = code;
  }
}

async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<{ body: string; bytes: number; truncated: boolean }> {
  const declared = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new FetchError("too_large", `The page is larger than ${maxBytes} bytes.`);
  }
  if (!response.body) return { body: "", bytes: 0, truncated: false };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(Math.min(bytes, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    if (offset >= merged.length) break;
    const slice = chunk.subarray(0, Math.min(chunk.length, merged.length - offset));
    merged.set(slice, offset);
    offset += slice.length;
  }
  return { body: new TextDecoder("utf-8").decode(merged), bytes, truncated };
}

/**
 * Fetch a page with the scanner's guard rails: per-hop redirect revalidation,
 * a hard timeout, a response size cap and a manual redirect loop.
 *
 * `resolve` is injectable so tests can drive block/allow decisions without
 * touching the network.
 */
export async function fetchPageSafely(
  startUrl: URL,
  options: {
    timeoutMs?: number;
    maxBytes?: number;
    maxRedirects?: number;
    resolve?: HostResolver;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<FetchedPage> {
  const timeoutMs = options.timeoutMs ?? SCAN_FETCH_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? SCAN_MAX_RESPONSE_BYTES;
  const maxRedirects = options.maxRedirects ?? SCAN_MAX_REDIRECTS;
  const resolve = options.resolve ?? systemResolver;
  const doFetch = options.fetchImpl ?? fetch;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const redirects: string[] = [];
  const started = Date.now();

  try {
    let current = startUrl;
    // Re-validate the starting host immediately before the request.
    await resolveAndAssertPublic(current, resolve);

    for (let hop = 0; hop <= maxRedirects; hop++) {
      const response = await doFetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          // Browser-consistent identity for page loads (scanner-identity.ts);
          // the honest audit UA is what gets *stored*, not what gets challenged.
          "user-agent": SCANNER_BROWSER_UA,
          "accept-language": SCANNER_ACCEPT_LANGUAGE,
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new FetchError("network", "The site sent a redirect without a destination.");
        }
        if (hop === maxRedirects) {
          throw new FetchError(
            "too_many_redirects",
            `The site redirected more than ${maxRedirects} times.`,
          );
        }
        // Every hop is validated, not just the first URL.
        current = await assertSafeRedirect(current, location, resolve);
        redirects.push(current.toString());
        continue;
      }

      const { body, bytes, truncated } = await readCapped(response, maxBytes);
      return {
        finalUrl: current.toString(),
        statusCode: response.status,
        contentType: response.headers.get("content-type"),
        html: body,
        loadTimeMs: Date.now() - started,
        bytes,
        redirects,
        truncated,
        server: response.headers.get("server"),
        cfMitigated: response.headers.get("cf-mitigated"),
      };
    }

    throw new FetchError("too_many_redirects", "Too many redirects.");
  } catch (error) {
    if (error instanceof FetchError) throw error;
    if (error instanceof UrlValidationError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchError("timeout", `The site did not respond within ${timeoutMs / 1000}s.`);
    }
    throw new FetchError("network", "Could not reach the site.");
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Orchestration                                                       */
/* ------------------------------------------------------------------ */

export interface AnalysisOutcome {
  page: FetchedPage;
  facts: PageFacts;
  findings: FindingDraft[];
  rulesVersion: string;
  scannerVersion: string;
}

/**
 * Fetch one page and run every Stage 1 rule against it.
 *
 * `onStage` lets the scan runner publish the real pipeline stage the moment it
 * changes, so the progress UI reflects the job rather than a timer.
 */
export async function analyzeUrl(
  url: URL,
  options: {
    resolve?: HostResolver;
    fetchImpl?: typeof fetch;
    onStage?: (stage: ScanStageId) => void | Promise<void>;
  } = {},
): Promise<AnalysisOutcome> {
  await options.onStage?.("rendering");
  const page = await fetchPageSafely(url, options);
  await options.onStage?.("analyzing");
  const facts = extractPageFacts(page.html, page.finalUrl);
  const findings = analyzePageFacts(facts, {
    url: page.finalUrl,
    statusCode: page.statusCode,
    contentType: page.contentType,
    botChallenge: detectBotChallenge({
      statusCode: page.statusCode,
      server: page.server,
      cfMitigated: page.cfMitigated,
      html: page.html,
    }),
  });
  return {
    page,
    facts,
    findings,
    rulesVersion: AUDIT_RULES_VERSION,
    scannerVersion: AUDIT_SCANNER_VERSION,
  };
}
