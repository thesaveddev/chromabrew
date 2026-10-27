import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "playwright";

/**
 * The in-browser bundle, exercised the way it ships: the exact committed
 * file a bookmarklet loads (and the extension injects) runs against a real
 * page in a real browser, and the overlay it draws is asserted from the
 * outside — through the shadow root, the way a reader's eyes (and not the
 * page's own scripts) would meet it.
 *
 * If the bundle file is missing, the build step was skipped: run
 * `node scripts/build-in-browser-bundle.mjs` (or `npm run audit:bundle`).
 * The failure message says exactly that instead of a bare ENOENT.
 */
const BUNDLE_PATH = path.resolve(
  process.cwd(),
  "public/in-browser/in-browser-audit.js",
);

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

const FIXTURE_ORIGIN = "https://audit-fixture.test";

async function openFixture(html: string): Promise<Page> {
  const context = await browser.newContext();
  // Discovery files are served for real: the in-browser audit fetches
  // /robots.txt and /llms.txt same-origin, so a fixture claiming a clean
  // page must be clean for the AI section too — an allow-all robots file
  // and a present llms.txt keep the new rules passing with zero findings.
  await context.route("**/*", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/robots.txt") {
      return route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "User-agent: *\nDisallow:\n",
      });
    }
    if (pathname === "/llms.txt") {
      return route.fulfill({
        status: 200,
        contentType: "text/markdown",
        body: "# Fixture\n\nA fixture site.\n",
      });
    }
    return route.fulfill({ status: 200, contentType: "text/html", body: html });
  });
  const page = await context.newPage();
  await page.goto(`${FIXTURE_ORIGIN}/`, { waitUntil: "domcontentloaded" });
  return page;
}

function shadowText(page: Page, selector: string): Promise<string | null> {
  return page.evaluate((sel) => {
    const host = document.querySelector("#chromabrew-audit-overlay");
    const found = host?.shadowRoot?.querySelector(sel);
    return found?.textContent ?? null;
  }, selector);
}

describe.skipIf(!browserAvailable)("in-browser audit bundle", () => {
  it("finds meta, contrast and axe issues on a broken page", async () => {
    expect(
      existsSync(BUNDLE_PATH),
      "bundle missing: run `npm run audit:bundle` to build public/in-browser/in-browser-audit.js",
    ).toBe(true);
    const bundle = readFileSync(BUNDLE_PATH, "utf8");

    const page = await openFixture(
      `<!doctype html><html><head><title>Hi</title></head>` +
        `<body><h1>Fixture</h1>` +
        `<p style="color: #999999; background: #ffffff;">faint grey text on white</p>` +
        `<img src="/x.png">` +
        `</body></html>`,
    );
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.addScriptTag({ content: bundle });
    await page.waitForFunction(
      () =>
        document
          .querySelector("#chromabrew-audit-overlay")
          ?.shadowRoot?.querySelector("h2")
          ?.textContent?.includes("issue"),
      { timeout: 60_000 },
    );

    // All three engines fired: a structural rule, the measured contrast pair
    // (#999 on white is 2.85:1 — the same number the server engine reports),
    // and an axe rule.
    const heading = await shadowText(page, "h2");
    expect(heading).toMatch(/This page: \d+ issues/);
    const cards = await page.evaluate(
      () =>
        [...(document.querySelector("#chromabrew-audit-overlay")?.shadowRoot?.querySelectorAll(".cb-finding h3") ?? [])].map(
          (node) => node.textContent ?? "",
        ),
    );
    expect(cards.some((title) => /meta description/i.test(title))).toBe(true);
    expect(cards.some((title) => /2\.85:1/.test(title))).toBe(true);
    expect(cards.some((title) => /alternative text|lang attribute/i.test(title))).toBe(true);

    // Coverage is stated, including what was measured — never "0 of 0".
    const coverage = await shadowText(page, ".cb-body > .cb-meta");
    expect(coverage).toMatch(/axe-core/);
    expect(coverage).toMatch(/Contrast measured on [1-9]\d* text runs/);

    // The bundle never throws into the host page.
    expect(pageErrors).toEqual([]);

    await page.context().close();
  });

  it("reports a clean page as passed, not as empty", async () => {
    const bundle = readFileSync(BUNDLE_PATH, "utf8");
    const page = await openFixture(
      `<!doctype html><html lang="en"><head>` +
        `<title>A complete and descriptive page title here</title>` +
        `<meta name="description" content="A full sentence describing this page for search results.">` +
        `<meta name="viewport" content="width=device-width, initial-scale=1"></head>` +
        `<body><main><h1>Clean</h1>` +
        `<p style="color: #1a1a1a; background: #ffffff;">Dark text on white, comfortably above the minimum.</p>` +
        `<img src="/x.png" alt="A descriptive alternative">` +
        // The AI trust-signals rule needs one of these to pass.
        `<a href="/contact">Contact</a>` +
        `</main></body></html>`,
    );

    await page.addScriptTag({ content: bundle });
    await page.waitForFunction(
      () =>
        document
          .querySelector("#chromabrew-audit-overlay")
          ?.shadowRoot?.querySelector("h2")
          ?.textContent?.includes("issue"),
      { timeout: 60_000 },
    );

    // Zero findings still render a verdict, and it refuses the conformance claim.
    const heading = await shadowText(page, "h2");
    expect(heading).toMatch(/0 issues/);
    const verdict = await shadowText(page, ".cb-empty");
    expect(verdict).toMatch(/not a WCAG conformance statement/);

    await page.context().close();
  });

  it("does not run twice when injected twice", async () => {
    const bundle = readFileSync(BUNDLE_PATH, "utf8");
    const page = await openFixture(
      `<!doctype html><html lang="en"><head><title>Double injection fixture page title</title></head>` +
        `<body><main><h1>Twice</h1></main></body></html>`,
    );

    await page.addScriptTag({ content: bundle });
    await page.addScriptTag({ content: bundle });
    await page.waitForFunction(
      () =>
        document
          .querySelector("#chromabrew-audit-overlay")
          ?.shadowRoot?.querySelector("h2")
          ?.textContent?.includes("issue"),
      { timeout: 60_000 },
    );
    const hosts = await page.evaluate(
      () => document.querySelectorAll("#chromabrew-audit-overlay").length,
    );
    expect(hosts).toBe(1);

    await page.context().close();
  });
});
