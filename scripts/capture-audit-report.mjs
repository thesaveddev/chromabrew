#!/usr/bin/env node
/**
 * Capture a real audit report for the website's own marketing.
 *
 *   node --import tsx scripts/capture-audit-report.mjs https://example.com/page
 *
 * Why this exists: the homepage shows a screenshot of a real report, and a
 * screenshot of a real report has to come from a real run. Everything in the
 * capture — the browser render, axe-core, the contrast measurements, the native
 * rules, the link inventory and the suggested fixes — comes from the shipping
 * pipeline in `src/lib/audit/`. Only the ids and the surrounding status object
 * are synthesised, because there is no `Scan` row behind this; the page under
 * the audit and every finding in it are measurements, not illustrations.
 *
 * It writes two things:
 *
 *   public/audit-media/scanned-page.png  the viewport the scanner rendered
 *   .audit-capture-report.json           the report DTO, for the step below
 *
 * The image on the homepage is `public/audit-media/audit-report.png`, and it is
 * taken from *that JSON rendered through the real report component* — see
 * `scripts/shoot-report-capture.mjs`, which also explains the temporary page it
 * needs. Re-capturing therefore means re-taking the image too, and the caption
 * on the homepage describes the run in the image, so update it as well.
 *
 * Set `CAPTURE_DRY=1` to measure without writing anything — useful for checking
 * what a candidate page would report before capturing it.
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";

const { analyzePage } = await import("../src/lib/audit/pipeline.ts");
const { buildScanCoverage } = await import("../src/lib/audit/coverage.ts");
const { AUDIT_RULE_COUNT } = await import("../src/lib/audit/analyzer.ts");
const { PROPOSED_FIX_KEY, SEVERITY_ORDER, parseProposedFix } = await import(
  "../src/lib/audit/types.ts"
);

const target = process.argv[2];
if (!target) {
  process.stderr.write("usage: node --import tsx scripts/capture-audit-report.mjs <url>\n");
  process.exit(2);
}

/** The desktop viewport the report is captured at, matching the scan default. */
const WIDTH = 1280;
const HEIGHT = 720;
const DTO_PATH = ".audit-capture-report.json";
const PAGE_IMAGE = "public/audit-media/scanned-page.png";

const dry = process.env.CAPTURE_DRY === "1";
const startedAt = new Date();
const outcome = await analyzePage(new URL(target), {}, WIDTH, HEIGHT);
const durationMs = Date.now() - startedAt.getTime();

await mkdir("public/audit-media", { recursive: true });
let screenshotUrl = null;
if (outcome.screenshot) {
  if (!dry) await writeFile(PAGE_IMAGE, outcome.screenshot);
  screenshotUrl = "/audit-media/scanned-page.png";
}

const findings = outcome.findings.map((finding, index) => ({
  id: `capture-${index + 1}`,
  ruleId: finding.ruleId,
  category: finding.category,
  severity: finding.severity,
  title: finding.title,
  description: finding.description,
  whyMatters: finding.whyMatters || null,
  recommendation: finding.recommendation || null,
  implementation: finding.implementation || null,
  elementSelector: finding.elementSelector,
  wcagCriterion: finding.wcagCriterion,
  detectionMethod: finding.detectionMethod,
  confidence: finding.confidence,
  pageUrl: outcome.finalUrl,
  createdAt: startedAt.toISOString(),
  fix: parseProposedFix(finding.suggestedValues?.[PROPOSED_FIX_KEY] ?? null),
}));

const counts = { total: findings.length };
for (const severity of SEVERITY_ORDER) {
  counts[severity] = findings.filter((finding) => finding.severity === severity).length;
}
const categories = {};
for (const finding of findings) {
  categories[finding.category] = (categories[finding.category] ?? 0) + 1;
}

// The same metadata the runner writes, so the coverage panel in the capture is
// built from recorded facts rather than assembled for the screenshot.
const metadata = {
  ...outcome.renderMeta,
  renderMode: outcome.renderMode,
  ...(outcome.renderFallbackReason ? { renderFallbackReason: outcome.renderFallbackReason } : {}),
  ruleCount: AUDIT_RULE_COUNT,
  stage: "preparing",
  findingCount: findings.length,
  duplicatesGrouped: outcome.duplicatesGrouped,
};

const failed = outcome.statusCode >= 400;
const dto = {
  scan: {
    id: "capture",
    url: target,
    normalizedUrl: outcome.finalUrl,
    status: failed ? "partially_completed" : "completed",
    stage: "preparing",
    scope: "single_page",
    viewportWidth: WIDTH,
    viewportHeight: HEIGHT,
    pagesScanned: 1,
    pagesTotal: 1,
    pagesFailed: failed ? 1 : 0,
    errorMessage: failed ? `The page responded with HTTP ${outcome.statusCode}.` : null,
    createdAt: startedAt.toISOString(),
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    durationMs,
    ruleCount: AUDIT_RULE_COUNT,
    renderMode: outcome.renderMode,
  },
  counts,
  categories,
  pages: [
    {
      id: "capture-page",
      url: outcome.finalUrl,
      title: outcome.title,
      statusCode: outcome.statusCode,
      loadTimeMs: outcome.loadTimeMs,
      errorMessage: null,
      rendered: outcome.renderMode === "browser",
      screenshotUrl,
    },
  ],
  findings,
  duplicatesGrouped: outcome.duplicatesGrouped,
  coverage: buildScanCoverage(metadata, AUDIT_RULE_COUNT),
};

if (!dry) await writeFile(DTO_PATH, JSON.stringify(dto, null, 2));

console.log(
  JSON.stringify(
    {
      target,
      renderMode: outcome.renderMode,
      fallbackReason: outcome.renderFallbackReason,
      statusCode: outcome.statusCode,
      title: outcome.title,
      durationMs,
      findings: findings.length,
      counts,
      withFix: findings.filter((finding) => finding.fix).length,
      firstRuleIds: findings.slice(0, 12).map((finding) => `${finding.severity}:${finding.ruleId}`),
      coverage: dto.coverage,
      screenshotBytes: outcome.screenshot?.byteLength ?? 0,
      duplicatesGrouped: outcome.duplicatesGrouped,
      dto: dry ? "(not written — CAPTURE_DRY=1)" : DTO_PATH,
    },
    null,
    2,
  ),
);
