/**
 * DOM text-sample + link collection that runs inside a real page.
 *
 * Client-safe by construction: only `./types` (types) — no Playwright, no
 * DNS, no Node APIs — so the in-browser audit bundle and the Chrome extension
 * content script can import it directly. `browser.ts` re-exports both
 * functions, so the server pipeline keeps calling the exact same code.
 *
 * Both functions must stay self-contained (no closures over module state):
 * the server pipeline serialises them into the scanned page via
 * `page.evaluate`.
 */

import type {
  BackgroundSource,
  DiscoveredLink,
  ElementRect,
  LinkInventory,
  TextSample,
  UnmeasurableReasonId,
} from "./types";

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

/**
 * Measure where selectors sit in the rendered page, so the report can draw
 * findings on the screenshot. Runs inside the page like the other
 * collectors and must stay self-contained.
 *
 * Coordinates are CSS pixels relative to the document's top-left. Selectors
 * that match nothing, match something with no box, or throw are skipped — a
 * missing marker is better than a failed scan. First match wins, matching
 * how the report attributes a finding to one element.
 */
export function collectElementRects(options: { selectors: string[]; cap: number }): ElementRect[] {
  const { selectors, cap } = options;
  const rects: ElementRect[] = [];
  const seen = new Set<string>();
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;
  for (const selector of selectors) {
    if (rects.length >= cap) break;
    if (!selector || seen.has(selector)) continue;
    seen.add(selector);
    let element: Element | null = null;
    try {
      element = document.querySelector(selector);
    } catch {
      continue;
    }
    if (!element) continue;
    const box =
      typeof element.getBoundingClientRect === "function"
        ? element.getBoundingClientRect()
        : null;
    if (!box || box.width <= 0 || box.height <= 0) continue;
    rects.push({
      selector,
      x: Math.round((box.left + scrollX) * 10) / 10,
      y: Math.round((box.top + scrollY) * 10) / 10,
      width: Math.round(box.width * 10) / 10,
      height: Math.round(box.height * 10) / 10,
    });
  }
  return rects;
}

/* ------------------------------------------------------------------ */
