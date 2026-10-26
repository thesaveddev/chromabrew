/**
 * Headless browser rendering for the audit scanner.
 *
 * This is the untrusted-input boundary of the whole product: it loads a page
 * written by someone else and runs their JavaScript. Three rules hold it
 * together.
 *
 *   1. Every request is policed. Playwright intercepts *all* traffic, and each
 *      URL must pass the same syntax and DNS checks the submitted URL passed —
 *      so a page cannot use an <img src="http://169.254.169.254/…"> to make the
 *      scanner read cloud metadata on its behalf. Hosts are resolved once per
 *      scan and cached; a denial aborts the request rather than failing open.
 *   2. Nothing outlives the scan. A fresh browser context per page, closed in a
 *      finally block, with downloads, dialogs, popups and service workers
 *      denied.
 *   3. Missing Playwright degrades, it does not break. The caller gets
 *      RendererUnavailableError and the runner falls back to the fetch-only
 *      pipeline, recording that in the scan's renderMode so the report can say
 *      contrast and screenshots were not checked.
 *
 * Playwright is a devDependency on purpose: a production worker host installs
 * it explicitly. See docs/AUDIT_ARCHITECTURE.md.
 */

import type { Page } from "playwright";
import { AXE_RUN_TAGS, type AxeResults } from "./axe";
import {
  SCANNER_ACCEPT_LANGUAGE,
  SCANNER_BROWSER_UA,
  SCANNER_INIT_SCRIPT,
  SCANNER_LAUNCH_ARGS,
} from "./scanner-identity";
import { assertAllowedUrlSyntax, classifyIp, resolveAndAssertPublic, type HostResolver } from "./url-validator";
import type {
  BackgroundSource,
  DiscoveredLink,
  ElementRect,
  LinkInventory,
  TextSample,
  UnmeasurableReasonId,
} from "./types";

export const RENDERER_NAVIGATION_TIMEOUT_MS = 20_000;
export const RENDERER_NETWORK_IDLE_TIMEOUT_MS = 5_000;
export const RENDERER_TOOL_TIMEOUT_MS = 25_000;
export const RENDERER_MAX_REQUESTS = 500;
export const RENDERER_MAX_TEXT_SAMPLES = 400;
export const RENDERER_MAX_ELEMENTS_VISITED = 6_000;
export const RENDERER_MAX_LINKS = 300;
/**
 * How many element boxes the renderer measures per page. Findings reference
 * a subset of selectors; measuring generously here means the report can draw
 * markers without a second browser pass, and the cap keeps the scan record
 * small. Unmatched rects are simply never drawn.
 */
export const RENDERER_MAX_ELEMENT_RECTS = 80;

export class RendererUnavailableError extends Error {
  constructor(message = "No browser renderer is available on this host.") {
    super(message);
    this.name = "RendererUnavailableError";
  }
}

export class RendererError extends Error {
  readonly code: "navigation" | "timeout" | "blocked" | "internal";

  constructor(code: RendererError["code"], message: string) {
    super(message);
    this.name = "RendererError";
    this.code = code;
  }
}

/* ------------------------------------------------------------------ */
/* In-page extraction                                                  */
/* ------------------------------------------------------------------ */

import { collectElementRects, collectPageLinks, collectTextSamples } from "./dom-collect";

export { collectElementRects, collectPageLinks, collectTextSamples };

/* ------------------------------------------------------------------ */

/**
 * The `__name` shim, needed by anything that gets a function into the page.
 *
 * The extraction functions are serialised by `page.evaluate`, which stringifies
 * them and re-evaluates that source inside the page. A transpiler that preserves
 * function names (esbuild with `keepNames`, which the `tsx` loader — and
 * therefore the standalone worker — always enables) wraps every named function
 * declaration in a `__name(...)` call, and that call travels with the source
 * into the page. Next compiles this file with SWC and injects nothing, so the
 * failure is invisible in the app and immediate in the worker: the page throws
 * `ReferenceError: __name is not defined` and the scan dies as "internal".
 *
 * Defining the helper in the page is deliberate, rather than policing how the
 * extraction functions are written: the next named function anyone adds would
 * re-break a style rule, but cannot break this.
 */
const PAGE_TRANSPILE_SHIM =
  "if (typeof globalThis.__name !== 'function') globalThis.__name = function (fn) { return fn; };";

/** Install the shim. Called immediately before every in-page function call. */
async function ensurePageShim(page: Page): Promise<void> {
  try {
    await page.evaluate(PAGE_TRANSPILE_SHIM);
  } catch {
    // A page that refuses a global assignment still gets the extraction attempt;
    // if the shim was genuinely needed, that call reports its own failure.
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new RendererError("timeout", message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

async function loadPlaywright(): Promise<typeof import("playwright")> {
  try {
    return await import("playwright");
  } catch {
    throw new RendererUnavailableError(
      "Playwright is not installed on this host, so the page cannot be rendered.",
    );
  }
}

/** True when this host can render pages. Used by the runner to pick a pipeline. */
export async function isBrowserRendererAvailable(): Promise<boolean> {
  try {
    await loadPlaywright();
    return true;
  } catch {
    return false;
  }
}

async function axeSource(): Promise<{ source: string; version: string }> {
  const imported = (await import("axe-core")) as unknown as {
    default?: { source?: string; version?: string };
    source?: string;
    version?: string;
  };
  // A bundler may hand back the module namespace or the namespace wrapped in
  // `default`; accept either, then require the browser source string itself.
  const candidates = [imported.default, imported];
  const axe = candidates.find((candidate) => typeof candidate?.source === "string");
  if (!axe) {
    throw new RendererUnavailableError("axe-core did not expose its source for injection.");
  }
  return { source: axe.source as string, version: axe.version ?? "unknown" };
}

/** A short, single-line reason suitable for storing on a scan record. */
function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").trim().slice(0, 300) || "axe failed for an unknown reason";
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

export interface RenderedPage {
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  title: string | null;
  /** Rendered DOM (after JavaScript), so injected markup is included. */
  html: string;
  /** Viewport screenshot as PNG bytes, or null when capture failed. */
  screenshot: Uint8Array | null;
  textSamples: TextSample[];
  textSamplesTruncated: boolean;
  unmeasurableSamples: number;
  /** Why the unmeasurable ones could not be measured, by reason. */
  unmeasurableReasons: Partial<Record<UnmeasurableReasonId, number>>;
  /** Deduplicated http(s) links found in the rendered DOM. */
  links: LinkInventory;
  /** URLs the page tried to reach that were refused. */
  blockedRequests: string[];
  requestCount: number;
  axeResults: AxeResults | null;
  /** Measured boxes for finding selectors, CSS px relative to the document. */
  elementRects: ElementRect[];
  axeVersion: string | null;
  /** Why axe produced no results, or null when it ran cleanly. */
  axeError: string | null;
  loadTimeMs: number;
  /** The `server` response header, when present — challenge evidence. */
  server?: string | null;
  /** The `cf-mitigated` header Cloudflare sets on challenged responses. */
  cfMitigated?: string | null;
}

/**
 * The browser context every page is rendered in — exported so tests assert
 * the real configuration rather than a copy of it. The identity choices and
 * their reasoning live in scanner-identity.ts; this is only where they meet
 * Playwright.
 */
export function scannerContextOptions(width: number, height: number) {
  return {
    viewport: { width, height },
    userAgent: SCANNER_BROWSER_UA,
    locale: "en-US",
    extraHTTPHeaders: { "accept-language": SCANNER_ACCEPT_LANGUAGE },
    serviceWorkers: "block" as const,
    acceptDownloads: false,
    ignoreHTTPSErrors: false,
    permissions: [],
    deviceScaleFactor: 1,
  };
}

/**
 * Load axe-core into an already-open page and run it against the document.
 *
 * Split out of `renderPage` so the failure path is directly testable: an engine
 * that cannot run must produce a reason the report can state, never an empty
 * violation list that reads as "nothing wrong here".
 */
export async function runAxeInPage(
  page: Page,
  tags: readonly string[] = AXE_RUN_TAGS,
): Promise<{ results: AxeResults | null; version: string | null; error: string | null }> {
  let version: string | null = null;
  try {
    const axe = await axeSource();
    version = axe.version;
    await injectAxe(page, axe.source);

    await ensurePageShim(page);
    const results = (await withTimeout(
      page.evaluate(async (runTags) => {
        const globalAxe = (window as unknown as {
          axe?: { run: (context: Document, options: unknown) => Promise<unknown> };
        }).axe;
        if (!globalAxe) throw new Error("axe did not load");
        return (await globalAxe.run(document, {
          runOnly: { type: "tag", values: runTags },
          resultTypes: ["violations", "incomplete"],
        })) as unknown;
      }, [...tags]),
      RENDERER_TOOL_TIMEOUT_MS,
      "Running axe-core timed out.",
    )) as AxeResults;

    if (!results || !Array.isArray(results.violations)) {
      return { results: null, version, error: "axe returned a result the adapter could not read" };
    }
    return { results, version, error: null };
  } catch (error) {
    // Without axe the scan still reports everything the contrast engine and the
    // HTML rules measured — and it says so, with this reason attached.
    return { results: null, version, error: describeError(error) };
  }
}

/**
 * Get axe-core into the page.
 *
 * `<script>` injection is the documented route, but a page with a strict
 * Content-Security-Policy can refuse it. Playwright's own evaluation is not
 * subject to the page's CSP, so that is the fallback — a strict CSP must not be
 * the difference between a real audit and a silently empty one.
 */
async function injectAxe(page: Page, source: string): Promise<void> {
  const injected = async (): Promise<boolean> =>
    (await page.evaluate("typeof window.axe !== 'undefined'")) === true;

  try {
    await page.addScriptTag({ content: source });
  } catch {
    // fall through to the CSP-proof path below
  }
  if (await injected()) return;

  await page.evaluate(source);
  if (!(await injected())) {
    throw new RendererError("internal", "axe-core could not be loaded into the page.");
  }
}

export interface RenderOptions {
  width: number;
  height: number;
  /** Injectable for tests; defaults to the system resolver. */
  resolve?: HostResolver;
  onStage?: (stage: "rendering" | "analyzing") => void | Promise<void>;
  /** Skip axe when only layout/colour data is needed. */
  runAxe?: boolean;
  navigationTimeoutMs?: number;
}

/**
 * Render one page under the scanner's guard rails and collect everything
 * Stage 2 measures from it.
 */
export async function renderPage(url: URL, options: RenderOptions): Promise<RenderedPage> {
  const { chromium } = await loadPlaywright();
  const resolve = options.resolve;
  const runAxe = options.runAxe ?? true;

  const allowedHosts = new Map<string, boolean>();
  const blockedRequests: string[] = [];
  let requestCount = 0;

  /** Syntax + DNS check, cached per host so a busy page resolves each once. */
  const assertRequestAllowed = async (raw: string): Promise<boolean> => {
    let parsed: URL;
    try {
      parsed = assertAllowedUrlSyntax(raw);
    } catch {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    const cached = allowedHosts.get(hostname);
    if (cached !== undefined) return cached;
    try {
      const literal = classifyIp(hostname);
      if (literal) {
        allowedHosts.set(hostname, !literal.blocked);
      } else {
        // resolveAndAssertPublic rejects when *any* answer is non-public.
        await resolveAndAssertPublic(parsed, resolve);
        allowedHosts.set(hostname, true);
      }
    } catch {
      allowedHosts.set(hostname, false);
    }
    return allowedHosts.get(hostname) === true;
  };

  const browser = await chromium.launch({
    headless: true,
    args: SCANNER_LAUNCH_ARGS,
  });
  const started = Date.now();

  try {
    const context = await browser.newContext(
      scannerContextOptions(options.width, options.height),
    );
    // Before any site script runs: no navigator.webdriver tell.
    await context.addInitScript({ content: SCANNER_INIT_SCRIPT });

    // Every subresource the page asks for is checked, not just the main URL.
    await context.route("**/*", async (route, request) => {
      requestCount += 1;
      const target = request.url();
      if (/^(data|blob|about):/i.test(target)) {
        await route.continue().catch(() => {});
        return;
      }
      if (requestCount > RENDERER_MAX_REQUESTS) {
        blockedRequests.push(target);
        await route.abort().catch(() => {});
        return;
      }
      if (!(await assertRequestAllowed(target))) {
        blockedRequests.push(target);
        await route.abort().catch(() => {});
        return;
      }
      await route.continue().catch(() => {});
    });

    const page = await context.newPage();
    page.setDefaultTimeout(options.navigationTimeoutMs ?? RENDERER_NAVIGATION_TIMEOUT_MS);
    // A hostile page gets no interactive surface.
    page.on("dialog", (dialog) => void dialog.dismiss().catch(() => {}));
    page.on("download", (download) => void download.cancel().catch(() => {}));
    context.on("page", (popup) => void popup.close().catch(() => {}));

    await options.onStage?.("rendering");

    let statusCode = 0;
    let finalUrl = url.toString();
    let contentType: string | null = null;
    let serverHeader: string | null = null;
    let cfMitigatedHeader: string | null = null;
    try {
      const response = await page.goto(url.toString(), {
        waitUntil: "domcontentloaded",
        timeout: options.navigationTimeoutMs ?? RENDERER_NAVIGATION_TIMEOUT_MS,
      });
      if (response) {
        statusCode = response.status();
        finalUrl = response.url();
        contentType = response.headers()["content-type"] ?? null;
      }
      // Bot-protection evidence, captured for the challenge detector: Cloudflare
      // announces a challenge in `cf-mitigated`, and `server` corroborates it.
      serverHeader = response?.headers()["server"] ?? null;
      cfMitigatedHeader = response?.headers()["cf-mitigated"] ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/timeout/i.test(message)) {
        throw new RendererError("timeout", "The page did not finish loading in time.");
      }
      throw new RendererError("navigation", "The page could not be loaded in a browser.");
    }

    // Let client-side rendering settle, but never wait forever for it.
    await page
      .waitForLoadState("networkidle", { timeout: RENDERER_NETWORK_IDLE_TIMEOUT_MS })
      .catch(() => {});

    await options.onStage?.("analyzing");

    // Passed by reference on purpose: Playwright serialises the function's own
    // source, so a wrapper that closed over it would not exist in the page.
    const extraction = await withTimeout(
      ensurePageShim(page).then(() =>
        page.evaluate(collectTextSamples, {
          maxSamples: RENDERER_MAX_TEXT_SAMPLES,
          maxElements: RENDERER_MAX_ELEMENTS_VISITED,
        }),
      ),
      RENDERER_TOOL_TIMEOUT_MS,
      "Extracting computed styles from the page timed out.",
    );

    let screenshot: Uint8Array | null = null;
    try {
      screenshot = await withTimeout(
        page.screenshot({ type: "png", fullPage: false }),
        RENDERER_TOOL_TIMEOUT_MS,
        "Capturing the screenshot timed out.",
      );
    } catch {
      // A missing screenshot must not fail an otherwise good scan.
      screenshot = null;
    }

    const links = await withTimeout(
      ensurePageShim(page).then(() => page.evaluate(collectPageLinks, { maxLinks: RENDERER_MAX_LINKS })),
      RENDERER_TOOL_TIMEOUT_MS,
      "Collecting the page's links timed out.",
    );

    const html = await page.content().catch(() => "");
    const title = await page.title().catch(() => null);

    const axe = runAxe
      ? await runAxeInPage(page, AXE_RUN_TAGS)
      : { results: null, version: null, error: "axe was disabled for this render" };
    const axeResults = axe.results;
    const axeVersion = axe.version;
    const axeError = axe.error;

    // Boxes for the selectors findings will name, measured while the page is
    // still alive: text-sample selectors plus every axe node target, first
    // match per selector. A missing marker degrades the report, never the scan.
    let elementRects: ElementRect[] = [];
    try {
      const candidates = new Set<string>();
      for (const sample of extraction.samples) {
        if (sample.selector) candidates.add(sample.selector);
      }
      for (const violation of axeResults?.violations ?? []) {
        for (const node of violation.nodes ?? []) {
          if (node.target.length > 0) candidates.add(node.target.join(" "));
        }
      }
      if (candidates.size > 0) {
        elementRects = await withTimeout(
          ensurePageShim(page).then(() =>
            page.evaluate(collectElementRects, {
              selectors: [...candidates],
              cap: RENDERER_MAX_ELEMENT_RECTS,
            }),
          ),
          RENDERER_TOOL_TIMEOUT_MS,
          "Measuring element positions timed out.",
        );
      }
    } catch {
      elementRects = [];
    }

    return {
      finalUrl,
      statusCode,
      contentType,
      title,
      html,
      screenshot,
      textSamples: extraction.samples,
      textSamplesTruncated: extraction.truncated,
      unmeasurableSamples: extraction.unmeasurable,
      unmeasurableReasons: extraction.unmeasurableReasons,
      links,
      blockedRequests,
      requestCount,
      axeResults,
      elementRects,
      axeVersion,
      axeError,
      loadTimeMs: Date.now() - started,
      server: serverHeader,
      cfMitigated: cfMitigatedHeader,
    };
  } finally {
    // Never leave a browser behind: a leaked context keeps the page's timers
    // and network alive for the life of the worker.
    await browser.close().catch(() => {});
  }
}
