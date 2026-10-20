import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import {
  collectPageLinks,
  collectTextSamples,
  isBrowserRendererAvailable,
  renderPage,
  RendererError,
  runAxeInPage,
  scannerContextOptions,
} from "./browser";
import {
  SCANNER_BROWSER_UA,
  SCANNER_INIT_SCRIPT,
  SCANNER_LAUNCH_ARGS,
} from "./scanner-identity";
import { buildContrastFindings } from "./contrast-rules";
import type { TextSample } from "./types";

/**
 * These tests drive a real browser, because the code under test only exists
 * inside one: computed styles, the effective-background stack and the selector
 * builder cannot be exercised any other way.
 *
 * They use `page.setContent`, so no network is involved. When Playwright's
 * browsers are missing the suite reports as **skipped**, never as passing —
 * `npm run test:e2e` is what requires the browsers.
 */
const browserAvailable = await (async () => {
  try {
    const probe = await chromium.launch({ headless: true });
    await probe.close();
    return true;
  } catch {
    return false;
  }
})();

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

function requireBrowser(): Browser {
  if (!browser) throw new Error("No browser: this suite should have been skipped.");
  return browser;
}

const FIXTURE_ORIGIN = "https://audit-fixture.test";

/**
 * Open a real page at a real origin without touching the network: the context
 * fulfils every request with the supplied document. A real origin matters for
 * link classification, which compares against `window.location.origin`.
 */
async function openFixture(html: string): Promise<Page> {
  const context = await requireBrowser().newContext();
  await context.route("**/*", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: html }),
  );
  const page = await context.newPage();
  await page.goto(`${FIXTURE_ORIGIN}/`, { waitUntil: "domcontentloaded" });
  return page;
}

const FIXTURE_LIMITS = { maxSamples: 50, maxElements: 500 };

describe.skipIf(!browserAvailable)("collectTextSamples in a real browser", () => {
  it("measures a plain colour pair", async () => {
    const page = await requireBrowser().newPage();
    await page.setContent(
      `<body style="background:#ffffff"><p id="lede" style="color:#777777;font-size:16px;font-weight:400">Hello world</p></body>`,
    );
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    const sample = result.samples.find((entry) => entry.selector === "#lede");
    expect(sample).toBeDefined();
    expect(sample?.color).toBe("#777777");
    expect(sample?.background).toBe("#ffffff");
    expect(sample?.backgroundSource).toBe("ancestor");
    expect(sample?.fontSizePx).toBe(16);
    expect(sample?.fontWeight).toBe(400);
  }, 60_000);

  it("feeds the contrast engine a real failure and a real pass", async () => {
    const page = await requireBrowser().newPage();
    await page.setContent(
      `<body style="background:#ffffff">
         <p id="fail" style="color:#777777;font-size:16px">This one fails</p>
         <p id="pass" style="color:#767676;font-size:16px">This one passes</p>
       </body>`,
    );
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    const findings = buildContrastFindings(result.samples as TextSample[]);
    const selectors = findings.map((finding) => finding.elementSelector);
    expect(selectors).toContain("#fail");
    expect(selectors).not.toContain("#pass");
    expect(findings[0].originalValues).toMatchObject({ required: 4.5 });
  }, 60_000);

  it("refuses to measure text sitting on an image", async () => {
    const page = await requireBrowser().newPage();
    await page.setContent(
      `<body>
         <div style="background-image:url(data:image/gif;base64,R0lGODlhAQABAAAAACw=);width:200px;height:60px">
           <p id="on-image" style="color:#777777;font-size:16px">Over an image</p>
         </div>
       </body>`,
    );
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    // "Not measured" is the honest answer: a guess here becomes a false failure.
    expect(result.samples.find((entry) => entry.selector === "#on-image")).toBeUndefined();
    expect(result.unmeasurable).toBeGreaterThan(0);
    expect(buildContrastFindings(result.samples as TextSample[])).toHaveLength(0);
  }, 60_000);

  it("composites translucent text over its background before measuring", async () => {
    const page = await requireBrowser().newPage();
    await page.setContent(
      `<body style="background:#ffffff">
         <p id="muted" style="color:rgba(0,0,0,0.35);font-size:16px">Muted copy</p>
       </body>`,
    );
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    const sample = result.samples.find((entry) => entry.selector === "#muted");
    expect(sample).toBeDefined();
    // 35% black composited over white lands near #a6a6a6, not the rgba() literal.
    expect(sample?.color).toBe("#a6a6a6");
    const findings = buildContrastFindings(result.samples as TextSample[]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("critical");
  }, 60_000);

  it("resolves a modern colour space instead of falling through to the page canvas", async () => {
    const page = await requireBrowser().newPage();
    // Tailwind v4 emits `oklch()`/`lab()` for its palette, and Chrome reports
    // the computed colour in that space. White text on a dark `bg-zinc-900` card
    // used to be measured as white-on-white at 1:1 — a critical accusation
    // against a page that was fine — because an unreadable layer was skipped
    // and the walk continued to the white canvas behind it.
    await page.setContent(
      `<body style="background:#ffffff">
         <div style="background-color:lab(8.30603 0.618205 -2.16572);padding:16px">
           <p id="on-dark" style="color:#ffffff;font-size:16px">White on zinc-900</p>
         </div>
         <div style="background-color:oklch(0.21 0.006 285.885);padding:16px">
           <p id="on-oklch" style="color:#ffffff;font-size:16px">White on oklch zinc-900</p>
         </div>
       </body>`,
    );
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    const onDark = result.samples.find((entry) => entry.selector === "#on-dark");
    expect(onDark).toBeDefined();
    // The lab() layer resolves to sRGB #18181b, not to the page behind it.
    expect(onDark?.background).toBe("#18181b");
    expect(onDark?.backgroundSource).toBe("ancestor");

    const onOklch = result.samples.find((entry) => entry.selector === "#on-oklch");
    expect(onOklch?.background).toBe("#18181b");

    // And the page is reported clean, because it is clean.
    expect(buildContrastFindings(result.samples as TextSample[])).toHaveLength(0);
  }, 60_000);

  it("refuses to measure when a colour cannot be resolved, rather than skipping the layer", async () => {
    const page = await requireBrowser().newPage();
    await page.setContent(
      `<body style="background:#ffffff">
         <div style="background-color:lab(8.30603 0.618205 -2.16572);padding:16px">
           <p id="unresolvable" style="color:#ffffff;font-size:16px">Dark card, no canvas</p>
         </div>
       </body>`,
    );
    // The canvas is how a non-sRGB colour is resolved. Break it before the
    // extraction runs, and the honest answer becomes "not measured" — never the
    // colour underneath, which would turn an unreadable layer into a confident
    // false failure. (`setContent` does not navigate, so this is installed after
    // the document exists rather than through an init script.)
    await page.evaluate(() => {
      HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
    });
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    expect(result.samples.find((entry) => entry.selector === "#unresolvable")).toBeUndefined();
    expect(result.unmeasurableReasons.unsupported_colour).toBeGreaterThan(0);
    expect(buildContrastFindings(result.samples as TextSample[])).toHaveLength(0);
  }, 60_000);

  it("ignores text that is not painted, and text in an inactive control", async () => {
    const page = await requireBrowser().newPage();
    // Both classes are exempt from WCAG 1.4.3: `sr-only` labels are clipped to a
    // pixel and inactive controls carry no contrast requirement. Measuring them
    // reported a screen-reader label as dark-on-dark 1:1 on a page with nothing
    // wrong with it.
    await page.setContent(
      `<body style="background:#ffffff">
         <label id="sr-only-label" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);color:#18181b;font-size:16px">Starting color</label>
         <button id="disabled" disabled style="color:#52525c;background:#18181b;font-size:12px">Copy</button>
         <button id="enabled" style="color:#52525c;background:#18181b;font-size:12px">Copy</button>
       </body>`,
    );
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    const selectors = result.samples.map((entry) => entry.selector);
    expect(selectors).not.toContain("#sr-only-label");
    // The enabled button with the same colours is still measured, so the skip is
    // about the control's state and not about the colour.
    expect(selectors).toContain("#enabled");
    expect(buildContrastFindings(result.samples as TextSample[])).toHaveLength(1);
  }, 60_000);

  it("builds usable selectors and skips hidden or empty elements", async () => {
    const page = await requireBrowser().newPage();
    await page.setContent(
      `<body style="background:#fff">
         <div class="card"><p>First</p><p>Second</p></div>
         <p style="display:none;color:#777">Hidden</p>
         <p style="visibility:hidden;color:#777">Invisible</p>
         <p style="color:#777"></p>
         <p id="named" style="color:#777">Named</p>
       </body>`,
    );
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    const selectors = result.samples.map((entry) => entry.selector);
    // The path keeps the `body >` prefix on purpose: `p:nth-of-type(1)` alone
    // would match the first paragraph of every parent, which is not evidence.
    expect(selectors).toContain("body > div.card > p:nth-of-type(1)");
    expect(selectors).toContain("body > div.card > p:nth-of-type(2)");
    expect(selectors).toContain("#named");
    expect(selectors).toHaveLength(3); // the two hidden and the empty one are gone
    expect(result.samples.every((entry) => entry.text.length > 0)).toBe(true);
  }, 60_000);

  it("honours the sample cap and reports truncation", async () => {
    const page = await requireBrowser().newPage();
    const paragraphs = Array.from({ length: 30 }, (_, index) => `<p>Row ${index}</p>`).join("");
    await page.setContent(`<body style="background:#fff;color:#111">${paragraphs}</body>`);
    const result = await page.evaluate(collectTextSamples, { maxSamples: 5, maxElements: 500 });
    await page.close();

    expect(result.samples.length).toBe(5);
    expect(result.truncated).toBe(true);
  }, 60_000);
});

describe.skipIf(!browserAvailable)("collectPageLinks in a real browser", () => {
  it("deduplicates hrefs, strips fragments and classifies same-origin links", async () => {
    const page = await openFixture(`<body>
      <a href="/about">About</a>
      <a href="/about">About, linked twice by mistake</a>
      <a href="/about#team">Team, same destination</a>
      <a href="https://elsewhere.test/docs" rel="nofollow">Docs</a>
      <a href="mailto:hi@elsewhere.test">Mail</a>
      <a href="javascript:void(0)">Void</a>
      <a href="#top">Back to top</a>
      <a href="/icon-only"><svg width="8" height="8"></svg></a>
    </body>`);
    const inventory = await page.evaluate(collectPageLinks, { maxLinks: 100 });
    await page.context().close();

    // Four destinations from eight anchors: the three /about anchors collapse,
    // #top resolves to the page itself, and /icon-only is its own destination.
    expect(inventory.distinct).toBe(4);
    expect(inventory.internal).toBe(3);
    expect(inventory.external).toBe(1);
    expect(inventory.externalHosts).toEqual(["elsewhere.test"]);
    // The two non-http schemes are dropped: a crawler cannot follow them.
    expect(inventory.anchorsSeen).toBe(6);

    const about = inventory.links.find((link) => link.href === `${FIXTURE_ORIGIN}/about`);
    expect(about).toMatchObject({ internal: true, nofollow: false, text: "About" });

    const external = inventory.links.find((link) => link.href === "https://elsewhere.test/docs");
    expect(external).toMatchObject({ internal: false, nofollow: true });

    // An icon-only link has no name; the empty string is recorded as observed.
    const iconOnly = inventory.links.find((link) => link.href === `${FIXTURE_ORIGIN}/icon-only`);
    expect(iconOnly?.text).toBe("");
  }, 60_000);

  it("caps the inventory and admits the cap was hit", async () => {
    const links = Array.from({ length: 6 }, (_, index) => `<a href="/page-${index}">Page ${index}</a>`).join("");
    const page = await openFixture(`<body>${links}</body>`);
    const inventory = await page.evaluate(collectPageLinks, { maxLinks: 2 });
    await page.context().close();

    expect(inventory.links).toHaveLength(2);
    // The counts still describe the whole page; only the stored sample is capped.
    expect(inventory.distinct).toBe(6);
    expect(inventory.truncated).toBe(true);
  }, 60_000);

  it("records why text could not be measured, by reason", async () => {
    const page = await requireBrowser().newPage();
    await page.setContent(
      `<body>
         <div style="background-image:url(data:image/gif;base64,R0lGODlhAQABAAAAACw=)">
           <p style="color:#777;font-size:16px">Over an image</p>
         </div>
         <div style="filter:invert(1)">
           <p style="color:#777;font-size:16px">Behind a filter</p>
         </div>
       </body>`,
    );
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    // "Not measured" is only useful if the report can say why. Both reasons here
    // are real: the colours a filter produces cannot be read from computed
    // styles, and an image behind text can be any colour at all.
    expect(result.unmeasurableReasons.background_image).toBeGreaterThan(0);
    expect(result.unmeasurableReasons.altered_rendering).toBeGreaterThan(0);
    expect(result.unmeasurable).toBe(
      (result.unmeasurableReasons.background_image ?? 0) +
        (result.unmeasurableReasons.altered_rendering ?? 0),
    );
  }, 60_000);

  it("composites a translucent group instead of giving up on it", async () => {
    const page = await requireBrowser().newPage();
    await page.setContent(
      `<body style="background:#ffffff">
         <p id="muted-group" style="color:#000000;font-size:16px;opacity:0.6">Muted group</p>
         <div style="opacity:0.5">
           <p id="nested" style="color:#000000;font-size:16px;opacity:0.5">Nested translucency</p>
         </div>
         <p id="invisible" style="color:#000000;font-size:16px;opacity:0">Not painted at all</p>
       </body>`,
    );
    const result = await page.evaluate(collectTextSamples, FIXTURE_LIMITS);
    await page.close();

    // 60% black over white is #666666 — a measurement, not a refusal.
    const group = result.samples.find((entry) => entry.selector === "#muted-group");
    expect(group).toBeDefined();
    expect(group?.color).toBe("#666666");
    expect(group?.background).toBe("#ffffff");

    // Group opacity multiplies: 0.5 on the element inside 0.5 on its parent is
    // 25% black over white, and a quietly wrong answer here would be a real
    // false failure or a real missed one.
    const nested = result.samples.find((entry) => entry.selector === "#nested");
    expect(nested?.color).toBe("#bfbfbf");
    expect(nested?.background).toBe("#ffffff");

    // Text that paints nothing is neither measurable nor a gap in coverage.
    expect(result.samples.find((entry) => entry.selector === "#invisible")).toBeUndefined();
    expect(result.unmeasurableReasons.altered_rendering ?? 0).toBe(0);

    const findings = buildContrastFindings(result.samples as TextSample[]);
    // #666666 on white passes AA; #bfbfbf on white does not come close.
    expect(findings.map((finding) => finding.elementSelector)).toEqual(["#nested"]);
  }, 60_000);
});

describe.skipIf(!browserAvailable)("runAxeInPage", () => {
  it("runs the real engine against the rendered document", async () => {
    const page = await openFixture("<html><body><h1>A heading with no document language</h1></body></html>");
    const outcome = await runAxeInPage(page);
    await page.context().close();

    expect(outcome.error).toBeNull();
    expect(outcome.results).not.toBeNull();
    expect(outcome.version).toMatch(/^\d+\.\d+/);
    expect(Array.isArray(outcome.results?.violations)).toBe(true);
    // The fixture declares no lang attribute, which axe reports as a Level A failure.
    expect(outcome.results?.violations.some((violation) => violation.id === "html-has-lang")).toBe(
      true,
    );
  }, 60_000);

  it("reports an engine failure instead of an empty pass", async () => {
    const page = await requireBrowser().newPage();
    // A page that makes the global axe binding unusable: the engine cannot be
    // loaded, so the honest result is a stated failure, not zero violations.
    await page.setContent("<body></body>");
    await page.evaluate(() => {
      Object.defineProperty(window, "axe", {
        configurable: true,
        get() {
          throw new Error("this page refuses the axe global");
        },
      });
    });

    const outcome = await runAxeInPage(page);
    await page.close();

    expect(outcome.results).toBeNull();
    expect(outcome.error).toBeTruthy();
    // Single-line and bounded, so it can be stored on the scan record.
    expect(outcome.error?.includes("\n")).toBe(false);
    expect((outcome.error ?? "").length).toBeLessThanOrEqual(300);
  }, 60_000);

  it("reports a failure when the page is already gone", async () => {
    const page = await requireBrowser().newPage();
    await page.setContent("<body></body>");
    await page.close();

    const outcome = await runAxeInPage(page);
    expect(outcome.results).toBeNull();
    expect(outcome.error).toBeTruthy();
  }, 60_000);
});

describe.skipIf(!browserAvailable)("renderPage guard rails", () => {
  it("refuses to navigate to a blocked destination", async () => {
    // Interception aborts the main request, so navigation fails rather than
    // reaching a host the guard already refused.
    await expect(
      renderPage(new URL("http://127.0.0.1:9/"), { width: 800, height: 600 }),
    ).rejects.toBeInstanceOf(RendererError);
  }, 60_000);

  it("reports its own availability as a boolean", async () => {
    await expect(isBrowserRendererAvailable()).resolves.toBeTypeOf("boolean");
  }, 60_000);
});

describe.skipIf(!browserAvailable)("scanner identity in a real browser", () => {
  it("presents as a regular browser to page scripts", async () => {
    // The exact configuration renderPage uses: same launch args, same context
    // options, same init script. If bot protections can tell this apart from a
    // desktop browser here, false challenges come back.
    const scannerBrowser = await chromium.launch({
      headless: true,
      args: SCANNER_LAUNCH_ARGS,
    });
    try {
      const context = await scannerBrowser.newContext(scannerContextOptions(1280, 720));
      await context.addInitScript({ content: SCANNER_INIT_SCRIPT });
      const page = await context.newPage();
      await page.setContent("<p>identity probe</p>");

      const probe = await page.evaluate(() => ({
        ua: navigator.userAgent,
        webdriver: (navigator as unknown as { webdriver?: boolean }).webdriver,
        language: (navigator as unknown as { languages?: string[] }).languages?.[0],
      }));

      expect(probe.ua).toBe(SCANNER_BROWSER_UA);
      expect(probe.ua).not.toContain("Headless");
      expect(probe.webdriver).toBeUndefined();
      expect(probe.language).toBe("en-US");
      await context.close();
    } finally {
      await scannerBrowser.close();
    }
  }, 60_000);
});
