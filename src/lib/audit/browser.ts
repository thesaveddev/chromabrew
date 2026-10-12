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
import { assertAllowedUrlSyntax, classifyIp, resolveAndAssertPublic, type HostResolver } from "./url-validator";
import type {
  BackgroundSource,
  DiscoveredLink,
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

/**
 * Runs inside the rendered page. Must be self-contained: Playwright serialises
 * this function, so it cannot close over anything from this module.
 *
 * It returns raw measurements and makes no WCAG judgements — the thresholds
 * live in contrast-rules.ts, which is pure and unit-tested.
 *
 * Exported so browser.test.ts can drive it against real computed styles in a
 * real browser, which is the only way to test this logic honestly.
 */
export function collectTextSamples(options: { maxSamples: number; maxElements: number }): {
  samples: TextSample[];
  truncated: boolean;
  elementsVisited: number;
  unmeasurable: number;
  unmeasurableReasons: Partial<Record<UnmeasurableReasonId, number>>;
} {
  const { maxSamples, maxElements } = options;
  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEMPLATE",
    "HEAD",
    "TITLE",
    "META",
    "LINK",
    "IFRAME",
    "CANVAS",
    "OPTION",
  ]);

  interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  /** Legacy sRGB syntax, parsed exactly so the common case never touches a canvas. */
  function parseLegacyRgb(value: string): Rgba | null {
    const match = /^rgba?\(([^)]+)\)$/i.exec(value.trim());
    if (!match) return null;
    const parts = match[1]
      .split(/[,/\s]+/)
      .filter((part) => part.length > 0)
      .map(Number);
    if (parts.length < 3 || parts.slice(0, 3).some((part) => !Number.isFinite(part))) return null;
    const alpha = parts.length > 3 && Number.isFinite(parts[3]) ? parts[3] : 1;
    return { r: parts[0], g: parts[1], b: parts[2], a: alpha };
  }

  /**
   * sRGB equivalent of any colour the browser understands.
   *
   * Modern CSS colour spaces are the reason this exists. Chrome reports a
   * Tailwind v4 `bg-zinc-900` as `lab(8.30603 0.618205 -2.16572)`, and a
   * `parseColour` that only understood `rgb()` used to treat that unreadable
   * layer as if it were not there — so the walk continued to the white page
   * behind it and the report accused the page of white-on-white text at 1:1.
   * The colour is resolved by *painting* it: a 1x1 canvas converts any colour
   * space to sRGB, and reading the pixel over an opaque black backdrop and
   * again over an opaque white one separates the colour from its alpha
   * (difference = (1 - a) * 255).
   *
   * Returns null only when the value is genuinely unparsable. Callers must
   * treat null as "cannot measure" rather than as "no colour here".
   */
  const colourCache = new Map<string, Rgba | null>();
  let paintContext: CanvasRenderingContext2D | null | undefined;

  function getPaintContext(): CanvasRenderingContext2D | null {
    if (paintContext !== undefined) return paintContext;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      paintContext = canvas.getContext("2d", { willReadFrequently: true });
    } catch {
      paintContext = null;
    }
    return paintContext;
  }

  function paintPixel(context: CanvasRenderingContext2D): Rgba {
    const data = context.getImageData(0, 0, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: 1 };
  }

  function resolveByPainting(value: string): Rgba | null {
    const context = getPaintContext();
    if (!context) return null;

    // The setter ignores an invalid value, so a sentinel that survives the
    // assignment is how an unparsable colour is detected — no throwing needed.
    context.fillStyle = "#010203";
    context.fillStyle = value;
    if (context.fillStyle === "#010203" && value.replace(/\s+/g, "").toLowerCase() !== "#010203") {
      return null;
    }

    context.fillStyle = "#000000";
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const onBlack = paintPixel(context);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const onWhite = paintPixel(context);

    const delta = ((onWhite.r - onBlack.r) + (onWhite.g - onBlack.g) + (onWhite.b - onBlack.b)) / 3;
    const alpha = Math.max(0, Math.min(1, 1 - delta / 255));
    if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: onBlack.r / alpha,
      g: onBlack.g / alpha,
      b: onBlack.b / alpha,
      a: alpha,
    };
  }

  function parseColour(value: string): Rgba | null {
    const raw = value.trim();
    if (raw === "" || raw === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

    const cached = colourCache.get(raw);
    if (cached !== undefined) return cached;

    const resolved = parseLegacyRgb(raw) ?? resolveByPainting(raw);
    colourCache.set(raw, resolved);
    return resolved;
  }

  function clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  function toHex(colour: Rgba): string {
    const hex = (value: number) => clamp(value).toString(16).padStart(2, "0");
    return `#${hex(colour.r)}${hex(colour.g)}${hex(colour.b)}`;
  }

  /** Source-over compositing: `top` painted on `bottom`, alpha included. */
  function over(top: Rgba, bottom: Rgba): Rgba {
    const alpha = top.a + bottom.a * (1 - top.a);
    if (!(alpha > 0)) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
      g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
      b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
      a: alpha,
    };
  }

  /** A layer with no transparency behind it. */
  const CANVAS: Rgba = { r: 255, g: 255, b: 255, a: 1 };

  function selectorFor(element: Element): string {
    if (element.id && /^[A-Za-z][\w-]*$/.test(element.id)) return `#${element.id}`;
    const parts: string[] = [];
    let node: Element | null = element;
    while (node && node.nodeType === 1 && parts.length < 5 && node !== document.documentElement) {
      let part = node.tagName.toLowerCase();
      if (node.classList && node.classList.length > 0) {
        part += `.${Array.from(node.classList).slice(0, 2).join(".")}`;
      }
      const parent: Element | null = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter(
          (child) => child.tagName === (node as Element).tagName,
        );
        if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ") || element.tagName.toLowerCase();
  }

  /**
   * The colour the text actually sits on, and the opacity that applies to the
   * text itself.
   *
   * Stacking translucency is linear, so a chain of layers over the page canvas
   * still reduces to one colour. CSS `opacity` applies to a whole subtree, so a
   * layer's alpha is scaled by the opacities of its own element and of that
   * element's ancestors — never by its descendants. Walking the chain deepest
   * first gives every node the right product in one pass.
   *
   * Returns null when the stack is *not* reducible to solid colours: an image or
   * gradient in the chain, or a filter or blend mode that repaints it. Those are
   * reported as not measured rather than guessed at, because a guess here becomes
   * a false accusation.
   */
  function resolveBackground(element: Element): {
    background: string | null;
    source: BackgroundSource;
    reason: UnmeasurableReasonId | null;
    /** Opacity applied to the text: the product of its group opacities. */
    textAlpha: number;
  } {
    const chain: Element[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) {
      chain.push(node);
    }
    const styles = chain.map((node) => window.getComputedStyle(node));

    // opacityFrom[i] is the opacity of chain[i] multiplied by every ancestor's,
    // which is what applies to anything painted inside chain[i].
    const opacityFrom: number[] = new Array(chain.length);
    let product = 1;
    for (let index = chain.length - 1; index >= 0; index--) {
      const raw = Number(styles[index].opacity);
      product *= Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 1;
      opacityFrom[index] = product;
    }

    let stack: Rgba | null = null;
    for (let index = 0; index < chain.length; index++) {
      const style = styles[index];
      if (style.backgroundImage && style.backgroundImage !== "none") {
        return { background: null, source: "unmeasurable", reason: "background_image", textAlpha: opacityFrom[0] };
      }
      if (
        (style.filter && style.filter !== "none") ||
        (style.mixBlendMode && style.mixBlendMode !== "normal")
      ) {
        return { background: null, source: "unmeasurable", reason: "altered_rendering", textAlpha: opacityFrom[0] };
      }

      const colour = parseColour(style.backgroundColor);
      if (colour === null) {
        // An unreadable layer cannot be skipped: walking past it would report
        // whatever is behind it as the colour the text sits on, which is how a
        // dark card becomes an accusation of white-on-white. Refusing to
        // measure is the honest answer.
        return {
          background: null,
          source: "unmeasurable",
          reason: "unsupported_colour",
          textAlpha: opacityFrom[0],
        };
      }
      if (colour.a > 0) {
        const layer: Rgba = { ...colour, a: colour.a * opacityFrom[index] };
        stack = stack ? over(stack, layer) : layer;
        if (stack.a >= 1) {
          // Opaque: nothing beneath it can show through, so the stack is decided.
          return {
            background: toHex(stack),
            source: chain[index] === element ? "element" : "ancestor",
            reason: null,
            textAlpha: opacityFrom[0],
          };
        }
      }
    }

    // Nothing in the chain is opaque, so the text sits on the page canvas,
    // which is white by spec. That is a measurement, not a guess.
    const backdrop = stack ? over(stack, CANVAS) : CANVAS;
    return {
      background: toHex(backdrop),
      source: "assumed-white",
      reason: null,
      textAlpha: opacityFrom[0],
    };
  }

  /**
   * Text that is not painted for anyone.
   *
   * `sr-only` / `.visually-hidden` labels are real text and real accessible
   * names, but they are clipped to a one-pixel box, so no one reads them
   * visually — and WCAG 1.4.3 only constrains text a reader can see. Measuring
   * them anyway is how an audit invents a failure: a screen-reader label sits on
   * whatever its container is, so it reported as dark-on-dark 1:1 while nothing
   * on the page was wrong. axe excludes these too.
   */
  function isVisuallyHidden(style: CSSStyleDeclaration, rect: DOMRect): boolean {
    if (style.clipPath && style.clipPath !== "none") return true;
    if (style.clip && style.clip !== "auto") return true;
    // A sub-2px box cannot show text to anyone, whatever the clipping technique.
    if (rect.width <= 2 && rect.height <= 2) return true;
    return false;
  }

  /**
   * Text inside an inactive control.
   *
   * WCAG 1.4.3 exempts "text or images of text that are part of an inactive
   * user interface component": a disabled button's own label carries no
   * contrast requirement. Counted as inapplicable rather than unmeasurable, so
   * it does not inflate the coverage gap either.
   */
  function isInactiveControl(element: Element): boolean {
    try {
      if (element.closest(":disabled, [aria-disabled='true']")) return true;
    } catch {
      // `:disabled` is universally supported; if a future selector is not, the
      // sample is simply measured as before.
    }
    return false;
  }

  function ownText(element: Element): string {
    let text = "";
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 3) text += child.nodeValue ?? "";
    }
    return text.replace(/\s+/g, " ").trim();
  }

  const samples: TextSample[] = [];
  const unmeasurableReasons: Partial<Record<UnmeasurableReasonId, number>> = {};
  let elementsVisited = 0;
  let unmeasurable = 0;
  let truncated = false;

  const root = document.body ?? document.documentElement;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

  const visit = (element: Element): void => {
    const text = ownText(element);
    if (text.length === 0) return;
    if (SKIP_TAGS.has(element.tagName)) return;

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return;
    const opacity = Number(style.opacity);
    if (Number.isFinite(opacity) && opacity === 0) return;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    if (isVisuallyHidden(style, rect)) return;
    if (isInactiveControl(element)) return;

    const fontSizePx = Number.parseFloat(style.fontSize);
    const fontWeightRaw = Number.parseInt(style.fontWeight, 10);
    const fontWeight = Number.isFinite(fontWeightRaw) ? fontWeightRaw : style.fontWeight === "bold" ? 700 : 400;
    if (!Number.isFinite(fontSizePx) || fontSizePx <= 0) return;

    const foreground = parseColour(style.color);
    if (!foreground) {
      // Same rule as the background: a foreground that cannot be resolved is a
      // gap in coverage, and it is counted as one instead of vanishing.
      unmeasurable += 1;
      unmeasurableReasons.unsupported_colour =
        (unmeasurableReasons.unsupported_colour ?? 0) + 1;
      return;
    }

    const resolved = resolveBackground(element);
    if (resolved.background === null) {
      unmeasurable += 1;
      if (resolved.reason) {
        unmeasurableReasons[resolved.reason] = (unmeasurableReasons[resolved.reason] ?? 0) + 1;
      }
      return;
    }

    // Fully transparent text paints nothing, so there is no contrast to judge —
    // and it is not a measurement gap either.
    const textAlpha = foreground.a * resolved.textAlpha;
    if (!(textAlpha > 0)) return;

    // Translucent text, or text inside a translucent group, is measured by
    // compositing exactly what the eye ends up seeing; this is where muted copy
    // fails. A fully opaque sample keeps its authored colour untouched.
    const backdrop = parseColour(resolved.background) ?? CANVAS;
    const opaqueForeground =
      textAlpha < 1 ? toHex(over({ ...foreground, a: textAlpha }, backdrop)) : toHex(foreground);

    samples.push({
      selector: selectorFor(element),
      text: text.slice(0, 120),
      color: opaqueForeground,
      background: resolved.background,
      backgroundSource: resolved.source as TextSample["backgroundSource"],
      fontSizePx,
      fontWeight,
    });
  };

  visit(root);
  while (walker.nextNode()) {
    elementsVisited += 1;
    if (elementsVisited > maxElements || samples.length >= maxSamples) {
      truncated = true;
      break;
    }
    visit(walker.currentNode as Element);
  }

  return { samples, truncated, elementsVisited, unmeasurable, unmeasurableReasons };
}

/* ------------------------------------------------------------------ */
/* In-page link inventory                                              */
/* ------------------------------------------------------------------ */

/**
 * Runs inside the rendered page. Like `collectTextSamples` it must be
 * self-contained, because Playwright serialises this function rather than
 * closing over the module.
 *
 * Only http(s) anchors are kept: `mailto:`, `tel:`, `javascript:` and in-page
 * fragments are not destinations a crawler can follow. URLs are resolved
 * against the document base and hashed-stripped, so `#section` and the page
 * itself collapse into one entry rather than inflating the inventory.
 */
export function collectPageLinks(options: { maxLinks: number }): LinkInventory {
  const { maxLinks } = options;
  const seen = new Set<string>();
  const externalHosts = new Set<string>();
  const links: DiscoveredLink[] = [];
  let anchorsSeen = 0;
  let internal = 0;
  let external = 0;
  let truncated = false;

  for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
    const raw = anchor.getAttribute("href");
    if (!raw) continue;

    let resolved: URL;
    try {
      resolved = new URL(raw, document.baseURI);
    } catch {
      continue;
    }
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;

    resolved.hash = "";
    const href = resolved.toString();
    anchorsSeen += 1;
    if (seen.has(href)) continue;
    seen.add(href);

    const isInternal = resolved.origin === window.location.origin;
    if (isInternal) {
      internal += 1;
    } else {
      external += 1;
      externalHosts.add(resolved.host);
    }

    if (links.length >= maxLinks) {
      truncated = true;
      continue;
    }

    links.push({
      href,
      text: (anchor.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
      internal: isInternal,
      nofollow: (anchor.getAttribute("rel") ?? "").split(/\s+/).includes("nofollow"),
    });
  }

  return {
    anchorsSeen,
    distinct: seen.size,
    internal,
    external,
    externalHosts: Array.from(externalHosts).sort().slice(0, 25),
    truncated,
    links,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
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
  axeVersion: string | null;
  /** Why axe produced no results, or null when it ran cleanly. */
  axeError: string | null;
  loadTimeMs: number;
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
    args: ["--disable-dev-shm-usage", "--disable-gpu"],
  });
  const started = Date.now();

  try {
    const context = await browser.newContext({
      viewport: { width: options.width, height: options.height },
      serviceWorkers: "block",
      acceptDownloads: false,
      ignoreHTTPSErrors: false,
      permissions: [],
      deviceScaleFactor: 1,
    });

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
      axeVersion,
      axeError,
      loadTimeMs: Date.now() - started,
    };
  } finally {
    // Never leave a browser behind: a leaked context keeps the page's timers
    // and network alive for the life of the worker.
    await browser.close().catch(() => {});
  }
}
