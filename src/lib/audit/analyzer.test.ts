import { describe, expect, it, vi } from "vitest";
import {
  analyzePageFacts,
  analyzeUrl,
  extractPageFacts,
  FetchError,
  fetchPageSafely,
  parseAttributes,
} from "./analyzer";
import { UrlValidationError, type HostResolver } from "./url-validator";

const PUBLIC_RESOLVER: HostResolver = async () => ["93.184.216.34"];

function htmlResponse(body: string, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(body, {
    status: init.status ?? 200,
    headers: { "content-type": "text/html; charset=utf-8", ...init.headers },
  });
}

/** A page that passes every Stage 1 rule, used as the baseline. */
const CLEAN_PAGE = `<!doctype html>
<html lang="en">
<head>
  <title>A clean and fully-described example page</title>
  <meta name="description" content="A short description that fits comfortably inside the snippet limit for search results.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Only one heading</h1>
  <img src="/hero.png" alt="A dashboard showing a colour scale">
  <img src="/rule.png" alt="">
</body>
</html>`;

/* ------------------------------------------------------------------ */
/* Fact extraction                                                     */
/* ------------------------------------------------------------------ */

describe("extractPageFacts", () => {
  it("reads the facts Stage 1 rules depend on", () => {
    const facts = extractPageFacts(CLEAN_PAGE, "https://example.com/");
    expect(facts.title).toBe("A clean and fully-described example page");
    expect(facts.htmlLang).toBe("en");
    expect(facts.viewportMeta).toBe("width=device-width, initial-scale=1");
    expect(facts.metaDescription).toContain("A short description");
    expect(facts.h1Count).toBe(1);
    expect(facts.imageCount).toBe(2);
    expect(facts.imagesMissingAlt).toBe(0);
    expect(facts.imagesWithEmptyAlt).toBe(1);
    expect(facts.hasDoctype).toBe(true);
    expect(facts.hasNoIndex).toBe(false);
  });

  it("does not treat markup inside script, style or template as page markup", () => {
    const facts = extractPageFacts(
      `<html lang="en"><head><title>Real page title here for testing</title>
      <script>const tpl = '<img src="x.png">'; const h = '<h1>fake</h1>';</script>
      <style>/* <img src="y.png"> */</style>
      <template><img src="z.png"></template>
      </head><body><h1>Real</h1></body></html>`,
    );
    expect(facts.imageCount).toBe(0);
    expect(facts.h1Count).toBe(1);
  });

  it("ignores commented-out markup", () => {
    const facts = extractPageFacts("<html><!-- <img src='a.png'> <h1>x</h1> --><body></body></html>");
    expect(facts.imageCount).toBe(0);
    expect(facts.h1Count).toBe(0);
  });

  it("distinguishes a missing alt attribute from a deliberate empty one", () => {
    const facts = extractPageFacts(
      `<body>
        <img src="a.png">
        <img src="b.png" alt="">
        <img src="c.png" ALT="Uppercase attribute">
        <img src='d.png' alt='Single quoted'>
        <img src="e.png" alt=Unquoted>
      </body>`,
    );
    expect(facts.imageCount).toBe(5);
    expect(facts.imagesMissingAlt).toBe(1);
    expect(facts.imagesWithEmptyAlt).toBe(1);
    expect(facts.imageSampleSelectors).toHaveLength(1);
  });

  it("accepts either name or property for the description and decodes entities", () => {
    const facts = extractPageFacts(
      `<head><title>Title &amp; more</title>
       <meta property="description" content="A &quot;quoted&quot; summary">
       <meta name="ROBOTS" content="NOINDEX, nofollow"></head>`,
    );
    expect(facts.title).toBe("Title & more");
    expect(facts.metaDescription).toBe('A "quoted" summary');
    expect(facts.hasNoIndex).toBe(true);
  });

  it("counts internal and external links against the scanned host", () => {
    const facts = extractPageFacts(
      `<body>
        <a href="/pricing">Internal</a>
        <a href="https://example.com/about">Same host, absolute</a>
        <a href="https://other.test/x">External</a>
        <a href="#anchor">Same page</a>
      </body>`,
      "https://example.com/",
    );
    expect(facts.anchorCount).toBe(4);
    expect(facts.internalLinkCount).toBe(2);
    expect(facts.externalLinkCount).toBe(1);
  });

  it("counts every heading level present", () => {
    const facts = extractPageFacts("<body><h1>a</h1><h2>b</h2><h2>c</h2><h3>d</h3></body>");
    expect(facts.headingCounts).toEqual({ h1: 1, h2: 2, h3: 1 });
    expect(facts.h1Count).toBe(1);
  });
});

describe("parseAttributes", () => {
  it("handles bare, single, double and unquoted values", () => {
    expect(parseAttributes('<img src="a.png" alt="" hidden>')).toEqual({
      src: "a.png",
      alt: "",
      hidden: "",
    });
    expect(parseAttributes("<meta name='viewport' content=width=device-width>")).toEqual({
      name: "viewport",
      content: "width=device-width",
    });
  });

  it("keeps the first occurrence of a duplicated attribute", () => {
    expect(parseAttributes('<img alt="first" alt="second">')).toEqual({ alt: "first" });
  });
});

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

const OK_CONTEXT = { url: "https://example.com/", statusCode: 200, contentType: "text/html" };

describe("analyzePageFacts", () => {
  it("reports nothing for a page that satisfies every rule", () => {
    const facts = extractPageFacts(CLEAN_PAGE, OK_CONTEXT.url);
    expect(analyzePageFacts(facts, OK_CONTEXT)).toEqual([]);
  });

  it("is deterministic — the same page produces the same findings", () => {
    const facts = extractPageFacts("<html><body><img src='a.png'></body></html>");
    expect(analyzePageFacts(facts, OK_CONTEXT)).toEqual(analyzePageFacts(facts, OK_CONTEXT));
  });

  it("flags the missing page title as a WCAG failure", () => {
    const facts = extractPageFacts("<html lang='en'><head></head><body><h1>x</h1></body></html>");
    const finding = analyzePageFacts(facts, OK_CONTEXT).find((f) => f.ruleId === "meta-title");
    expect(finding?.severity).toBe("high");
    expect(finding?.wcagCriterion).toContain("2.4.2");
  });

  it("treats title length as guidance, not a failure", () => {
    const facts = extractPageFacts("<head><title>Short</title></head>");
    const finding = analyzePageFacts(facts, OK_CONTEXT).find(
      (f) => f.ruleId === "meta-title-length",
    );
    expect(finding?.severity).toBe("low");
    expect(finding?.wcagCriterion).toBeNull();
    expect(finding?.confidence).toBeLessThan(1);
  });

  it("flags a missing language attribute against SC 3.1.1", () => {
    const facts = extractPageFacts("<html><head><title>A sufficiently long title here</title></head></html>");
    const finding = analyzePageFacts(facts, OK_CONTEXT).find((f) => f.ruleId === "html-lang");
    expect(finding?.wcagCriterion).toContain("3.1.1");
    expect(finding?.severity).toBe("high");
  });

  it("flags missing alt text as critical and reports the measured counts", () => {
    const facts = extractPageFacts(
      "<body><img src='a.png'><img src='b.png'><img src='c.png' alt='ok'></body>",
    );
    const finding = analyzePageFacts(facts, OK_CONTEXT).find((f) => f.ruleId === "img-alt");
    expect(finding?.severity).toBe("critical");
    expect(finding?.evidence).toMatchObject({ imagesMissingAlt: 2, imageCount: 3 });
    expect(finding?.wcagCriterion).toContain("1.1.1");
  });

  it("flags a missing viewport", () => {
    const facts = extractPageFacts("<head><title>A sufficiently long title here</title></head>");
    expect(
      analyzePageFacts(facts, OK_CONTEXT).find((f) => f.ruleId === "meta-viewport")?.severity,
    ).toBe("high");
  });

  it("flags a missing h1 as medium and multiple h1s as low", () => {
    const none = extractPageFacts("<body><h2>only a subhead</h2></body>");
    expect(analyzePageFacts(none, OK_CONTEXT).find((f) => f.ruleId === "heading-h1")?.severity).toBe(
      "medium",
    );
    const many = extractPageFacts("<body><h1>one</h1><h1>two</h1></body>");
    const finding = analyzePageFacts(many, OK_CONTEXT).find((f) => f.ruleId === "heading-h1");
    expect(finding?.severity).toBe("low");
    expect(finding?.originalValues).toMatchObject({ h1Count: 2 });
  });

  it("notes an intentional noindex directive without calling it a failure", () => {
    const facts = extractPageFacts('<head><meta name="robots" content="noindex"></head>');
    const finding = analyzePageFacts(facts, OK_CONTEXT).find((f) => f.ruleId === "robots-noindex");
    expect(finding?.severity).toBe("informational");
  });

  it("stops at the status finding when the page errored", () => {
    const facts = extractPageFacts("<html>Not found</html>");
    const findings = analyzePageFacts(facts, { ...OK_CONTEXT, statusCode: 404 });
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("http-status");
    expect(findings[0].severity).toBe("high");
  });

  it("stops when the response is not HTML", () => {
    const facts = extractPageFacts("{}");
    const findings = analyzePageFacts(facts, { ...OK_CONTEXT, contentType: "application/json" });
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("content-type");
  });

  it("labels every finding as measured", () => {
    const facts = extractPageFacts("<html><body><img src='a.png'></body></html>");
    for (const finding of analyzePageFacts(facts, OK_CONTEXT)) {
      expect(finding.detectionMethod).toBe("deterministic");
      expect(finding.title).not.toHaveLength(0);
      expect(finding.description).not.toHaveLength(0);
      expect(finding.recommendation).not.toHaveLength(0);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Fetch guard rails                                                   */
/* ------------------------------------------------------------------ */

describe("fetchPageSafely", () => {
  it("returns the page on a 200 response", async () => {
    const page = await fetchPageSafely(new URL("https://example.com/"), {
      resolve: PUBLIC_RESOLVER,
      fetchImpl: async () => htmlResponse(CLEAN_PAGE),
    });
    expect(page.statusCode).toBe(200);
    expect(page.html).toContain("Only one heading");
    expect(page.bytes).toBeGreaterThan(0);
    expect(page.redirects).toEqual([]);
  });

  it("refuses to request a host that resolves into the private network", async () => {
    const spy = vi.fn(async () => htmlResponse("should not be called"));
    await expect(
      fetchPageSafely(new URL("https://rebind.example.org/"), {
        resolve: async () => ["169.254.169.254"],
        fetchImpl: spy,
      }),
    ).rejects.toBeInstanceOf(UrlValidationError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("follows a public redirect", async () => {
    const page = await fetchPageSafely(new URL("https://example.com/"), {
      resolve: PUBLIC_RESOLVER,
      fetchImpl: async (input) =>
        String(input).endsWith("/final")
          ? htmlResponse(CLEAN_PAGE)
          : new Response(null, { status: 301, headers: { location: "/final" } }),
    });
    expect(page.finalUrl).toBe("https://example.com/final");
    expect(page.redirects).toEqual(["https://example.com/final"]);
  });

  it("blocks a redirect that leaves the public internet", async () => {
    await expect(
      fetchPageSafely(new URL("https://example.com/"), {
        resolve: PUBLIC_RESOLVER,
        fetchImpl: async () =>
          new Response(null, { status: 302, headers: { location: "http://169.254.169.254/" } }),
      }),
    ).rejects.toBeInstanceOf(UrlValidationError);
  });

  it("stops after the redirect limit", async () => {
    await expect(
      fetchPageSafely(new URL("https://example.com/"), {
        resolve: PUBLIC_RESOLVER,
        maxRedirects: 2,
        fetchImpl: async () =>
          new Response(null, { status: 302, headers: { location: "/again" } }),
      }),
    ).rejects.toMatchObject({ code: "too_many_redirects" });
  });

  it("rejects an oversized response before reading it", async () => {
    await expect(
      fetchPageSafely(new URL("https://example.com/"), {
        resolve: PUBLIC_RESOLVER,
        maxBytes: 1024,
        fetchImpl: async () =>
          htmlResponse("x", { headers: { "content-length": "99999999" } }),
      }),
    ).rejects.toMatchObject({ code: "too_large" });
  });

  it("truncates a streaming response that exceeds the cap", async () => {
    const page = await fetchPageSafely(new URL("https://example.com/"), {
      resolve: PUBLIC_RESOLVER,
      maxBytes: 64,
      fetchImpl: async () => htmlResponse("y".repeat(4096)),
    });
    expect(page.truncated).toBe(true);
    expect(page.bytes).toBeGreaterThan(64);
    expect(page.html.length).toBeLessThanOrEqual(64);
  });

  it("gives up on a hanging server", async () => {
    const hanging: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    await expect(
      fetchPageSafely(new URL("https://example.com/"), {
        resolve: PUBLIC_RESOLVER,
        timeoutMs: 30,
        fetchImpl: hanging,
      }),
    ).rejects.toMatchObject({ code: "timeout" });
  });

  it("reports an unreachable host as a network error", async () => {
    await expect(
      fetchPageSafely(new URL("https://example.com/"), {
        resolve: PUBLIC_RESOLVER,
        fetchImpl: async () => {
          throw new Error("ECONNREFUSED");
        },
      }),
    ).rejects.toBeInstanceOf(FetchError);
  });
});

/* ------------------------------------------------------------------ */
/* End to end                                                          */
/* ------------------------------------------------------------------ */

describe("analyzeUrl", () => {
  it("produces findings from a real fetch without touching the network", async () => {
    const outcome = await analyzeUrl(new URL("https://example.com/"), {
      resolve: PUBLIC_RESOLVER,
      fetchImpl: async () =>
        htmlResponse(
          "<html><head><title>Broken example page</title></head><body><img src='a.png'><img src='b.png'></body></html>",
        ),
    });
    const ruleIds = outcome.findings.map((finding) => finding.ruleId);
    expect(ruleIds).toContain("img-alt");
    expect(ruleIds).toContain("html-lang");
    expect(outcome.page.statusCode).toBe(200);
    expect(outcome.rulesVersion).toBeTruthy();
  });
});
