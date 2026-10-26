import { describe, expect, it } from "vitest";

import { analyzePageFacts, analyzeUrl, extractPageFacts } from "./analyzer";
import { scannerContextOptions } from "./browser";
import { detectBotChallenge } from "./challenge";
import {
  SCANNER_ACCEPT_LANGUAGE,
  SCANNER_BROWSER_UA,
  SCANNER_LAUNCH_ARGS,
} from "./scanner-identity";
import { SCANNER_USER_AGENT } from "./analyzer";

/**
 * Bot-protection challenge detection.
 *
 * The decision under test is which responses count as a wall rather than a
 * page — and, just as important, which do not: a site that merely *mentions*
 * Cloudflare, or a plain 404, must never be reported as "you were blocked",
 * because that finding tells the reader to go change their firewall.
 *
 * The scanner identity is asserted here too, because the two halves of the
 * anti-false-challenge story have to stay in step: requests look like the
 * browser the scanner genuinely is, while the honest product UA stays what
 * gets stored as provenance.
 */

const PUBLIC_RESOLVER = async () => ["93.184.216.34"];

const INTERSTITIAL = `<!doctype html>
<html lang="en">
  <head>
    <title>Just a moment…</title>
    <script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script>
  </head>
  <body></body>
</html>`;

function htmlResponse(body: string, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(body, {
    status: init.status ?? 200,
    headers: { "content-type": "text/html; charset=utf-8", ...init.headers },
  });
}

describe("detectBotChallenge", () => {
  it("trusts Cloudflare's own cf-mitigated header, whatever the body says", () => {
    const detection = detectBotChallenge({
      statusCode: 403,
      cfMitigated: "challenge",
      server: "cloudflare",
      html: "<html><body>nothing to see</body></html>",
    });
    expect(detection?.provider).toBe("Cloudflare");
    expect(detection?.evidence.join(" ")).toContain("cf-mitigated");
  });

  it("recognises the managed-challenge page from server + interstitial body", () => {
    const detection = detectBotChallenge({
      statusCode: 403,
      server: "cloudflare",
      html: INTERSTITIAL,
    });
    expect(detection?.provider).toBe("Cloudflare");
    expect(detection?.evidence.length).toBeGreaterThan(0);
  });

  it("recognises the interstitial even when a proxy rewrote the server header", () => {
    const detection = detectBotChallenge({ statusCode: 503, html: INTERSTITIAL });
    expect(detection?.provider).toBe("Cloudflare");
  });

  it("does not mistake a page that merely mentions Cloudflare for a wall", () => {
    const mention = `<!doctype html><html><head><title>Our stack</title></head>
      <body><h1>We use Cloudflare</h1><p>CDN notes live here.</p></body></html>`;
    expect(detectBotChallenge({ statusCode: 200, server: "cloudflare", html: mention })).toBeNull();
  });

  it("does not call a plain error page a challenge", () => {
    const notFound = `<!doctype html><html><head><title>Not found</title></head>
      <body><h1>404</h1></body></html>`;
    expect(detectBotChallenge({ statusCode: 404, html: notFound })).toBeNull();
  });

  it("does not infer a challenge from a cloudflare server header alone", () => {
    // A Cloudflare-hosted page that 500s is a broken page, not a block —
    // telling the reader to allowlist the scanner would send them to change
    // a firewall that never fired.
    const serverError = `<!doctype html><html><head><title>Oops</title></head><body>boom</body></html>`;
    expect(
      detectBotChallenge({ statusCode: 500, server: "cloudflare", html: serverError }),
    ).toBeNull();
  });
});

describe("analyzePageFacts — bot challenge", () => {
  it("replaces the generic status finding with the block finding", () => {
    const facts = extractPageFacts(INTERSTITIAL, "https://example.com/");
    const findings = analyzePageFacts(facts, {
      url: "https://example.com/",
      statusCode: 403,
      contentType: "text/html",
      botChallenge: detectBotChallenge({ statusCode: 403, cfMitigated: "challenge", html: INTERSTITIAL }),
    });

    expect(findings.map((f) => f.ruleId)).toEqual(["bot-challenge"]);
    expect(findings[0].title).toContain("Cloudflare");
    // The guidance is the point of the finding, so it must name the guide.
    expect(findings[0].recommendation).toContain("/audit/scanner");
    // ...and the escape hatch for blocks the reader cannot allowlist through:
    // the same checks running in the reader's own tab.
    expect(findings[0].recommendation).toContain("/audit/this-page");
    // A block is not a verdict: no suggested value can fix it.
    expect(findings[0].suggestedValues).toBeNull();
  });

  it("still reports the plain status when no challenge was detected", () => {
    const facts = extractPageFacts("<html><body>boom</body></html>", "https://example.com/");
    const findings = analyzePageFacts(facts, {
      url: "https://example.com/",
      statusCode: 500,
      contentType: "text/html",
    });
    expect(findings.map((f) => f.ruleId)).toEqual(["http-status"]);
  });
});

describe("analyzeUrl — challenge wiring", () => {
  it("carries response headers into the finding through a real fetch", async () => {
    const outcome = await analyzeUrl(new URL("https://example.com/"), {
      resolve: PUBLIC_RESOLVER,
      fetchImpl: async () =>
        htmlResponse(INTERSTITIAL, {
          status: 403,
          headers: { server: "cloudflare", "cf-mitigated": "challenge" },
        }),
    });

    expect(outcome.findings.map((f) => f.ruleId)).toEqual(["bot-challenge"]);
    expect(outcome.page.cfMitigated).toBe("challenge");
    expect(outcome.page.server).toBe("cloudflare");
  });
});

describe("scanner identity", () => {
  it("looks like a regular browser on the wire", () => {
    expect(SCANNER_BROWSER_UA).toContain("Chrome/");
    expect(SCANNER_BROWSER_UA).not.toContain("Headless");
    // The honest identity is for provenance records, never for page requests.
    expect(SCANNER_BROWSER_UA).not.toContain("ChromaBrew");
    expect(SCANNER_USER_AGENT).toContain("ChromaBrew");
  });

  it("removes the webdriver tell and sets a language header", () => {
    expect(SCANNER_LAUNCH_ARGS).toContain("--disable-blink-features=AutomationControlled");
    const options = scannerContextOptions(1280, 720);
    expect(options.userAgent).toBe(SCANNER_BROWSER_UA);
    expect(options.extraHTTPHeaders["accept-language"]).toBe(SCANNER_ACCEPT_LANGUAGE);
    expect(options.viewport).toEqual({ width: 1280, height: 720 });
  });
});
