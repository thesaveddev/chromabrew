import { describe, expect, it, vi } from "vitest";
import { RendererError } from "./browser";
import { analyzePage, type PageRenderer } from "./pipeline";
import type { RenderedPage } from "./browser";
import type { TextSample } from "./types";

/**
 * The pipeline's own tests: no database, no network, no browser.
 *
 * The decision under test is which pipeline runs and what the outcome says
 * about itself, because that is what stops a degraded scan from reading as a
 * clean one.
 */

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Pipeline fixture page</title>
    <meta name="description" content="A fixture used by the pipeline tests.">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <h1>Fixture</h1>
    <p style="color:#777777">Text with a real contrast failure</p>
    <img src="/logo.png" alt="">
  </body>
</html>`;

/** DNS stub: every host resolves to a public address, so no lookup happens. */
const resolve = async () => ["93.184.216.34"];

/** Fetch stub: one canned HTML document, so nothing touches the network. */
const fetchImpl = (async () =>
  new Response(HTML, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  })) as unknown as typeof fetch;

/** A rendered page that reports one failing contrast sample. */
function renderedPage(overrides: Partial<RenderedPage> = {}): RenderedPage {
  const samples: TextSample[] = [
    {
      selector: "#lede",
      text: "Text with a real contrast failure",
      color: "#777777",
      background: "#ffffff",
      backgroundSource: "ancestor",
      fontSizePx: 16,
      fontWeight: 400,
    },
  ];
  return {
    finalUrl: "https://example.com/",
    statusCode: 200,
    contentType: "text/html",
    title: "Rendered fixture",
    html: HTML,
    screenshot: new Uint8Array([1, 2, 3]),
    textSamples: samples,
    textSamplesTruncated: false,
    unmeasurableSamples: 4,
    unmeasurableReasons: { background_image: 4 },
    links: {
      anchorsSeen: 2,
      distinct: 1,
      internal: 1,
      external: 0,
      externalHosts: [],
      truncated: false,
      links: [{ href: "https://example.com/about", text: "About", internal: true, nofollow: false }],
    },
    blockedRequests: [],
    requestCount: 3,
    axeResults: {
      violations: [
        {
          id: "color-contrast",
          impact: "serious",
          help: "Elements must meet minimum color contrast ratio thresholds",
          description: "Ensures the contrast between foreground and background is sufficient.",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.13/color-contrast",
          tags: ["cat.color", "wcag2aa", "wcag143"],
          nodes: [{ html: '<p style="color:#777">…</p>', target: ["#lede"], impact: "serious" }],
        },
        {
          id: "landmark-one-main",
          impact: "moderate",
          help: "Document should have one main landmark",
          description: "Ensures the document has a main landmark.",
          tags: ["best-practice"],
          nodes: [{ html: "<body>…</body>", target: ["html"], impact: "moderate" }],
        },
      ],
      incomplete: [],
    },
    axeVersion: "4.13.0",
    axeError: null,
    elementRects: [],
    loadTimeMs: 1200,
    ...overrides,
  };
}

function rendererFor(render: PageRenderer["render"], available = true): PageRenderer {
  return { available: async () => available, render };
}

const run = (renderer: PageRenderer | null) =>
  analyzePage(new URL("https://example.com/"), { resolve, fetchImpl, renderer }, 1280, 720);

describe("analyzePage — the browser pipeline", () => {
  it("reports what each engine found and what it could not measure", async () => {
    const outcome = await run(rendererFor(async () => renderedPage()));

    expect(outcome.renderMode).toBe("browser");
    expect(outcome.renderFallbackReason).toBeNull();
    expect(outcome.screenshot?.byteLength).toBe(3);
    // Every fact the coverage panel shows has to come from here.
    expect(outcome.renderMeta).toMatchObject({
      axeRan: true,
      axeVersion: "4.13.0",
      axeError: null,
      textSampleCount: 1,
      unmeasurableSamples: 4,
      unmeasurableReasons: { background_image: 4 },
      linksFound: 1,
      linksExternal: 0,
      blockedRequestCount: 0,
    });
    expect(outcome.links?.distinct).toBe(1);
    // The brand-fit section eats from this histogram, not from raw samples.
    expect(outcome.colorHistogram).toEqual([
      { hex: "#777777", count: 1 },
      { hex: "#ffffff", count: 1 },
    ]);
  });

  it("counts engines before deduplication and groups the overlap", async () => {
    const outcome = await run(rendererFor(async () => renderedPage()));

    // The native contrast rule and axe's color-contrast describe one defect;
    // the report must count it once.
    expect(outcome.duplicatesGrouped).toBe(1);
    expect(outcome.findings.map((finding) => finding.ruleId)).not.toContain("axe:color-contrast");
    expect(outcome.renderMeta.nativeFindingCount).toBe(1);
    expect(outcome.renderMeta.axeFindingCount).toBe(2);
    // The surviving finding carries the measured ratio, which is the shape the
    // report and the later fix stage consume.
    const contrast = outcome.findings.find((finding) => finding.ruleId === "contrast-text");
    expect(contrast?.originalValues).toMatchObject({ ratio: 4.48, required: 4.5 });
  });

  it("keeps an engine failure visible instead of reporting a pass", async () => {
    const outcome = await run(
      rendererFor(async () =>
        renderedPage({
          axeResults: null,
          axeError: "ReferenceError: t is not defined",
        }),
      ),
    );

    expect(outcome.renderMeta.axeRan).toBe(false);
    expect(outcome.renderMeta.axeError).toBe("ReferenceError: t is not defined");
    expect(outcome.renderMeta.axeFindingCount).toBe(0);
    // The rest of the pipeline still produced measured findings.
    expect(outcome.findings.length).toBeGreaterThan(0);
  });
});

describe("analyzePage — degradation", () => {
  it("labels a fetch-only run as a fallback and leaves render facts unrecorded", async () => {
    const outcome = await run(rendererFor(async () => renderedPage(), false));

    expect(outcome.renderMode).toBe("fetch");
    expect(outcome.renderFallbackReason).toMatch(/not installed/i);
    // Absent, not zero: the report can then say "not measured".
    expect(outcome.links).toBeNull();
    expect(outcome.renderMeta.linksFound).toBeUndefined();
    expect(outcome.renderMeta.axeRan).toBeUndefined();
    expect(outcome.renderMeta.textSampleCount).toBeUndefined();
    expect(outcome.screenshot).toBeNull();
  });

  it("explains a disabled renderer rather than leaving the reason blank", async () => {
    const outcome = await run(null);

    expect(outcome.renderMode).toBe("fetch");
    expect(outcome.renderFallbackReason).toMatch(/disabled/i);
  });

  it("falls back with the renderer's own message when a real page cannot be loaded", async () => {
    const outcome = await run(
      rendererFor(async () => {
        throw new RendererError("timeout", "The page did not finish loading in time.");
      }),
    );

    expect(outcome.renderMode).toBe("fetch");
    expect(outcome.renderFallbackReason).toBe("The page did not finish loading in time.");
    // The served HTML was still analysed: this fixture is rule-clean, so the
    // proof is that the fetch pipeline read it, not that it found something.
    expect(outcome.facts.title).toBe("Pipeline fixture page");
    expect(outcome.statusCode).toBe(200);
    expect(outcome.links).toBeNull();
  });

  it("reports a bot-protection interstitial as a block, not as a page", async () => {
    const interstitial = `<!doctype html><html><head><title>Just a moment…</title>
      <script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script>
      </head><body></body></html>`;
    const outcome = await run(
      rendererFor(async () =>
        renderedPage({
          statusCode: 403,
          server: "cloudflare",
          cfMitigated: "challenge",
          title: "Just a moment…",
          html: interstitial,
        }),
      ),
    );

    // One finding, and it is about the block — never a verdict on the site
    // drawn from the provider's challenge screen.
    expect(outcome.findings.map((f) => f.ruleId)).toEqual(["bot-challenge"]);
    expect(outcome.renderMeta).toEqual({ botChallenge: "Cloudflare" });
    // The interstitial's links belong to the provider, so no inventory is
    // claimed; the screenshot is kept as the evidence of what happened.
    expect(outcome.links).toBeNull();
    expect(outcome.screenshot?.byteLength).toBe(3);
  });

  it("carries a challenge through the fetch fallback with the same finding", async () => {
    const cfFetch = async () =>
      new Response('<html><head><title>Just a moment…</title></head><body></body></html>', {
        status: 403,
        headers: {
          "content-type": "text/html; charset=utf-8",
          server: "cloudflare",
          "cf-mitigated": "challenge",
        },
      });
    const outcome = await analyzePage(
      new URL("https://example.com/"),
      { resolve, fetchImpl: cfFetch, renderer: null },
      1280,
      720,
    );

    expect(outcome.renderMode).toBe("fetch");
    expect(outcome.findings.map((f) => f.ruleId)).toEqual(["bot-challenge"]);
  });

  it("fails the scan instead of degrading when the error is not a renderer problem", async () => {
    const boom = new Error("the analysis itself broke");
    await expect(
      run(
        rendererFor(async () => {
          throw boom;
        }),
      ),
    ).rejects.toBe(boom);
  });

  it("hands the stage transitions to the caller as they happen", async () => {
    const onStage = vi.fn();
    await analyzePage(
      new URL("https://example.com/"),
      { resolve, fetchImpl, renderer: rendererFor(async () => renderedPage()), onStage },
      1280,
      720,
    );
    expect(onStage).not.toHaveBeenCalled(); // fetch fallback reports no stage; the browser path does

    const renderStages = vi.fn();
    await analyzePage(
      new URL("https://example.com/"),
      {
        resolve,
        fetchImpl,
        onStage: renderStages,
        renderer: rendererFor(async (_url, options) => {
          await options.onStage?.("rendering");
          await options.onStage?.("analyzing");
          return renderedPage();
        }),
      },
      1280,
      720,
    );
    expect(renderStages.mock.calls.map(([stage]) => stage)).toEqual(["rendering", "analyzing"]);
  });

  it("appends AI-readiness findings and host facts without touching engine counts", async () => {
    const aiFetch = (async (input: string | URL | Request) => {
      const path = new URL(String(input)).pathname;
      if (path === "/robots.txt") {
        return new Response("User-agent: *\nDisallow:\n", {
          status: 200,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      if (path === "/llms.txt") return new Response("missing", { status: 404 });
      return new Response(HTML, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }) as unknown as typeof fetch;

    const outcome = await analyzePage(
      new URL("https://example.com/"),
      { resolve, fetchImpl: aiFetch, renderer: rendererFor(async () => renderedPage()) },
      1280,
      720,
    );

    // Host facts for the scan metadata, from the seed page.
    expect(outcome.aiReadiness).toEqual({ robots: "present", llms: "absent", blockedBots: [] });
    // The missing llms.txt reports alongside the engine findings — and the
    // engine counts the coverage panel quotes are exactly where they were.
    expect(outcome.findings.map((finding) => finding.ruleId)).toContain("ai-llms-txt");
    expect(outcome.renderMeta.nativeFindingCount).toBe(1);
    expect(outcome.duplicatesGrouped).toBe(1);
  });
});
