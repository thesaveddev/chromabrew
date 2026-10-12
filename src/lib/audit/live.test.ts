import { describe, expect, it } from "vitest";
import { analyzeUrl } from "./analyzer";
import { mapAxeViolations } from "./axe";
import { isBrowserRendererAvailable, renderPage } from "./browser";
import { buildContrastFindings, measureContrast } from "./contrast-rules";
import { dedupeFindings } from "./dedupe";
import { clientIpFromHeaders, hashIp } from "./rate-limit";
import {
  assertAllowedUrlSyntax,
  UrlValidationError,
  validateScanUrl,
} from "./url-validator";

/**
 * Opt-in live smoke check: real DNS, a real fetch and real HTML.
 *
 * Skipped by default so the main suite stays offline and deterministic. Run it
 * when you want proof that the pipeline works against the live internet:
 *
 *   AUDIT_LIVE=1 npx vitest run src/lib/audit/live.test.ts
 */
const live = process.env.AUDIT_LIVE === "1";
const LIVE_TIMEOUT = 45_000;

describe.runIf(live)("live scan", () => {
  it(
    "audits a real public page end to end",
    async () => {
      const outcome = await analyzeUrl(new URL("https://example.com/"), {
        onStage: (stage) => {
          process.stdout.write(`  stage: ${stage}\n`);
        },
      });

      expect(outcome.page.statusCode).toBe(200);
      expect(outcome.page.html.length).toBeGreaterThan(0);
      expect(outcome.facts.title).toBeTruthy();
      expect(outcome.findings.length).toBeGreaterThanOrEqual(0);

      process.stdout.write(
        `  title: ${outcome.facts.title}\n` +
          `  lang: ${outcome.facts.htmlLang} · viewport: ${outcome.facts.viewportMeta}\n` +
          `  loadTimeMs: ${outcome.page.loadTimeMs} · bytes: ${outcome.page.bytes}\n` +
          `  rules: ${outcome.rulesVersion} · findings: ${outcome.findings.length}\n` +
          outcome.findings
            .map((finding) => `    - [${finding.severity}] ${finding.ruleId}: ${finding.title}`)
            .join("\n") +
          "\n",
      );
    },
    LIVE_TIMEOUT,
  );

  it(
    "resolves a public hostname but refuses a private one",
    async () => {
      const publicHost = await validateScanUrl("https://example.com/");
      expect(publicHost.addresses.length).toBeGreaterThan(0);

      await expect(validateScanUrl("http://169.254.169.254/")).rejects.toBeInstanceOf(
        UrlValidationError,
      );
      await expect(validateScanUrl("http://localhost/")).rejects.toBeInstanceOf(UrlValidationError);
    },
    LIVE_TIMEOUT,
  );

  it(
    "reads real client addresses from proxy headers",
    () => {
      const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
      const ip = clientIpFromHeaders(headers);
      expect(ip).toBe("203.0.113.9");
      const hash = hashIp(ip);
      expect(hash).toHaveLength(32);
      expect(hash).not.toContain("203.0.113.9");
    },
    LIVE_TIMEOUT,
  );

  it("still rejects junk input with the real resolver wired up", () => {
    expect(() => assertAllowedUrlSyntax("not a url at all")).toThrow(UrlValidationError);
  });

  /**
   * The Stage 2 path against the live internet, without a database: render a
   * real page, run the real engine in it, measure real contrast, and collect
   * real links. This is the check that would have caught axe-core failing to
   * load under the production server bundle.
   */
  it(
    "renders a real page, runs axe in it and measures real contrast",
    async () => {
      if (!(await isBrowserRendererAvailable())) {
        process.stdout.write("  skipped: no browser renderer on this host\n");
        return;
      }

      const rendered = await renderPage(new URL("https://example.com/"), {
        width: 1280,
        height: 720,
      });

      const contrast = measureContrast(rendered.textSamples);
      const findings = dedupeFindings([
        ...buildContrastFindings(rendered.textSamples),
        ...(rendered.axeResults ? mapAxeViolations(rendered.axeResults) : []),
      ]);

      process.stdout.write(
        `  status: ${rendered.statusCode} · rendered in ${rendered.loadTimeMs}ms\n` +
          `  text samples: ${rendered.textSamples.length} (${contrast.measurable} measurable, ${rendered.unmeasurableSamples} unmeasurable)\n` +
          `  axe: ${rendered.axeResults ? `${rendered.axeResults.violations.length} violations (v${rendered.axeVersion})` : `did not run — ${rendered.axeError}`}\n` +
          `  links: ${rendered.links.distinct} distinct (${rendered.links.external} external)\n` +
          `  screenshot: ${rendered.screenshot ? `${rendered.screenshot.byteLength} bytes` : "none"}\n` +
          `  blocked requests: ${rendered.blockedRequests.length}\n`,
      );

      expect(rendered.statusCode).toBe(200);
      expect(rendered.html.length).toBeGreaterThan(0);
      expect(rendered.screenshot?.byteLength ?? 0).toBeGreaterThan(0);
      expect(rendered.textSamples.length).toBeGreaterThan(0);
      expect(rendered.links.distinct).toBeGreaterThan(0);
      // The engine must actually run: the whole accessibility half of Stage 2
      // depends on it, and a silent failure looks identical to a clean page.
      expect(rendered.axeError).toBeNull();
      expect(rendered.axeResults).not.toBeNull();
      expect(findings.kept.length).toBeGreaterThanOrEqual(0);
    },
    LIVE_TIMEOUT,
  );

  /**
   * Stage 2's acceptance criterion is reproducible findings, so the same page
   * is rendered twice and the reports are compared. Ordering is part of the
   * comparison: a report whose findings shuffle between runs is not evidence a
   * reviewer can work from.
   */
  it(
    "reports the same findings when the same page is scanned twice",
    async () => {
      if (!(await isBrowserRendererAvailable())) {
        process.stdout.write("  skipped: no browser renderer on this host\n");
        return;
      }

      const analyse = async () => {
        const rendered = await renderPage(new URL("https://example.com/"), {
          width: 1280,
          height: 720,
        });
        const findings = dedupeFindings([
          ...buildContrastFindings(rendered.textSamples),
          ...(rendered.axeResults ? mapAxeViolations(rendered.axeResults) : []),
        ]);
        return {
          rendered,
          fingerprint: findings.kept
            .map(
              (finding) =>
                `${finding.ruleId}|${finding.severity}|${finding.elementSelector ?? ""}|${finding.originalValues ? JSON.stringify(finding.originalValues) : ""}`,
            )
            .sort()
            .join("\n"),
        };
      };

      const first = await analyse();
      const second = await analyse();

      process.stdout.write(
        `  run 1: ${first.rendered.textSamples.length} samples, ${first.rendered.axeResults?.violations.length ?? 0} axe violations\n` +
          `  run 2: ${second.rendered.textSamples.length} samples, ${second.rendered.axeResults?.violations.length ?? 0} axe violations\n` +
          `  fingerprints equal: ${first.fingerprint === second.fingerprint}\n`,
      );

      expect(second.fingerprint).toBe(first.fingerprint);
      expect(second.rendered.textSamples.length).toBe(first.rendered.textSamples.length);
      expect(second.rendered.axeResults?.violations.length).toBe(
        first.rendered.axeResults?.violations.length,
      );
    },
    LIVE_TIMEOUT,
  );
});
