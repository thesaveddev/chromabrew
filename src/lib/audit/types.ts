/**
 * Chromabrew Audit — shared vocabulary.
 *
 * Client-safe: this module must not import the Prisma client, node:dns or any
 * other server-only API, because the /audit UI imports the labels from here.
 *
 * The string unions below deliberately mirror the Prisma enums in
 * `prisma/schema.prisma`. `types.server.test-d.ts`-style drift is caught at
 * compile time inside `runner.ts`, which assigns these values to Prisma inputs.
 */

import { contrastRatio } from "@/lib/design-system/colour/contrast";

export const AUDIT_RULES_VERSION = "2.1.0";
export const AUDIT_SCANNER_VERSION = "3.0.0";

/**
 * Metadata length guidance, in one place.
 *
 * The rules that report a length and the fixes that shorten it have to agree:
 * a fix that trims to a target the rule does not accept would be a bug the user
 * pays for. `TARGET` is where the advice points (clear of truncation), `MAX` is
 * the bound the rule refuses to pass.
 */
export const META_TITLE_MIN_LENGTH = 15;
export const META_TITLE_MAX_LENGTH = 65;
export const META_TITLE_TARGET_LENGTH = 60;
export const META_DESCRIPTION_MAX_LENGTH = 165;
export const META_DESCRIPTION_TARGET_LENGTH = 155;

/**
 * How a page was analysed. Surfaced to the report on purpose: a fetch-only
 * result is missing whole categories of measurement, and the user must be able
 * to tell the difference between "nothing found" and "nothing looked for".
 */
export type RenderModeId = "browser" | "fetch";

export const RENDER_MODE_LABELS: Record<RenderModeId, string> = {
  browser: "Rendered in a browser",
  fetch: "Served HTML only",
};

export const RENDER_MODE_NOTES: Record<RenderModeId, string> = {
  browser:
    "The page was rendered in a headless browser: JavaScript ran, computed styles were read, contrast was measured against real background colours, and a screenshot was captured.",
  fetch:
    "Browser rendering was unavailable, so only the HTML the server sent was analysed. Colour contrast, computed styles and the screenshot are missing from this report — treat the absence of those findings as not yet checked, not as a pass.",
};

/**
 * A JSON shape that is structurally assignable to Prisma's `InputJsonValue`
 * without the analyser having to depend on the generated Prisma client.
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

/* ------------------------------------------------------------------ */
/* Scope                                                               */
/* ------------------------------------------------------------------ */

export type ScanScopeId = "single_page" | "homepage_plus_pages" | "selected_pages";

export interface ScanScopeOption {
  id: ScanScopeId;
  label: string;
  description: string;
  /** Maximum pages the worker will visit for this scope in this release. */
  maxPages: number;
}

/**
 * Every listed scope is executable. `selected_pages` scans exactly the URLs
 * the reader enters (the seed plus an explicit list, no crawling) instead of
 * following links, so the API validates the list rather than rejecting the
 * scope.
 */
export const SCAN_SCOPES: readonly ScanScopeOption[] = [
  {
    id: "single_page",
    label: "Single page",
    description: "Analyse just the URL you submit. Fastest, most reliable.",
    maxPages: 1,
  },
  {
    id: "homepage_plus_pages",
    label: "Whole site (up to 5 pages)",
    description:
      "Crawls same-origin links from your URL — shallowest pages first, files skipped.",
    maxPages: 5,
  },
  {
    id: "selected_pages",
    label: "Selected pages (up to 10)",
    description:
      "Audit exactly the URLs you list — the address above plus more, one per line. No crawling; each page passes the same safety checks.",
    maxPages: 10,
  },
] as const;

export const IMPLEMENTED_SCOPES: readonly ScanScopeId[] = [
  "single_page",
  "homepage_plus_pages",
  "selected_pages",
];

export function scopeOption(id: ScanScopeId): ScanScopeOption {
  return SCAN_SCOPES.find((scope) => scope.id === id) ?? SCAN_SCOPES[0];
}

export function isScopeImplemented(id: ScanScopeId): boolean {
  return IMPLEMENTED_SCOPES.includes(id);
}

/* ------------------------------------------------------------------ */
/* Viewport                                                            */
/* ------------------------------------------------------------------ */

export interface ViewportOption {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const VIEWPORTS: readonly ViewportOption[] = [
  { id: "desktop", label: "Desktop 1280 x 720", width: 1280, height: 720 },
  { id: "mobile", label: "Mobile 390 x 844", width: 390, height: 844 },
] as const;

export const DEFAULT_VIEWPORT_ID = "desktop";

export function viewportOption(id: string): ViewportOption {
  return VIEWPORTS.find((viewport) => viewport.id === id) ?? VIEWPORTS[0];
}

/* ------------------------------------------------------------------ */
/* Status, stages and severity                                         */
/* ------------------------------------------------------------------ */

export type ScanStatusId =
  | "queued"
  | "running"
  | "completed"
  | "partially_completed"
  | "failed"
  | "cancelled";

export const TERMINAL_STATUSES: readonly ScanStatusId[] = [
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
];

export function isTerminalStatus(status: ScanStatusId): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Statuses whose findings are final and worth reading — a scan that finished,
 * whether or not every page answered. A failed or cancelled scan is terminal but
 * has no report, so it is deliberately not"ready": the report page shows its
 * error instead, and sharing refuses it.
 */
export function isReportReady(status: ScanStatusId): boolean {
  return status === "completed" || status === "partially_completed";
}

/**
 * Real pipeline stages, in order. The UI renders these as a checklist and
 * highlights `stage` — never a simulated percentage.
 */
export type ScanStageId =
  | "validating"
  | "rendering"
  | "analyzing"
  | "preparing";

export const SCAN_STAGES: readonly { id: ScanStageId; label: string }[] = [
  { id: "validating", label: "Validating URL" },
  { id: "rendering", label: "Fetching website" },
  { id: "analyzing", label: "Analysing page" },
  { id: "preparing", label: "Preparing findings" },
] as const;

export type FindingSeverityId = "critical" | "high" | "medium" | "low" | "informational";

export const SEVERITY_ORDER: readonly FindingSeverityId[] = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
] as const;

export const SEVERITY_LABELS: Record<FindingSeverityId, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  informational: "Informational",
};

/** Tailwind classes for severity pills (light + dark). */
export const SEVERITY_STYLES: Record<FindingSeverityId, string> = {
  critical:
    "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-900",
  medium:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  low: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900",
  informational:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
};

export type FindingCategoryId =
  | "color_contrast"
  | "accessibility"
  | "visual_design"
  | "design_system"
  | "technical"
  | "metadata";

export const CATEGORY_LABELS: Record<FindingCategoryId, string> = {
  color_contrast: "Colour contrast",
  accessibility: "Accessibility",
  visual_design: "Visual design",
  design_system: "Design system",
  technical: "Technical",
  metadata: "Metadata",
};

export type DetectionMethodId = "deterministic" | "ai_assisted" | "hybrid";

export const DETECTION_LABELS: Record<DetectionMethodId, string> = {
  deterministic: "Measured",
  ai_assisted: "AI review",
  hybrid: "Measured + AI",
};

/* ------------------------------------------------------------------ */
/* Findings                                                            */
/* ------------------------------------------------------------------ */

/**
 * A finding before it is persisted. Produced by the HTML rules, the axe-core
 * adapter and the contrast engine, so it is defined here rather than in any one
 * of them — the runner stores all three through the same shape.
 */
export interface FindingDraft {
  ruleId: string;
  category: FindingCategoryId;
  severity: FindingSeverityId;
  title: string;
  description: string;
  whyMatters: string;
  recommendation: string;
  implementation: string;
  elementSelector: string | null;
  originalValues: JsonObject | null;
  suggestedValues: JsonObject | null;
  evidence: JsonObject | null;
  wcagCriterion: string | null;
  detectionMethod: DetectionMethodId;
  /** Measured rules are fully confident; heuristic guidance carries its own label. */
  confidence: number;
}

/** Where the colour behind a run of text came from. */
export type BackgroundSource = "element" | "ancestor" | "assumed-white" | "unmeasurable";

/**
 * One measurable run of text, extracted from the rendered DOM.
 *
 * `background: null` means the effective background could not be reduced to a
 * solid colour (an image, a gradient, or an ancestor with opacity). Such a
 * sample is deliberately *not* reported as a failure — see contrast-rules.ts.
 */
/**
 * Where one finding's element sits in the page, in CSS pixels relative to
 * the document's top-left. Captured by the renderer so the report can draw
 * the finding on the screenshot; absent for fetch-only scans.
 */
export interface ColorCount {
  hex: string;
  count: number;
}

export interface ElementRect {
  /** The selector that was measured (first match wins). */
  selector: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextSample {
  /** Best-effort CSS selector for the element, unique within the page. */
  selector: string;
  /** The element's own text, truncated for storage. */
  text: string;
  /** Resolved foreground colour as #rrggbb. */
  color: string;
  /** The solid colour the text sits on, or null when it is not measurable. */
  background: string | null;
  backgroundSource: BackgroundSource;
  fontSizePx: number;
  fontWeight: number;
}

/**
 * Why a text element could not be measured for contrast.
 *
 * Recorded per scan so the report can say how much of the page was actually
 * measured. "Not measured" must never read as "passed".
 */
export type UnmeasurableReasonId =
  | "background_image"
  | "altered_rendering"
  | "unsupported_colour";

export const UNMEASURABLE_REASON_LABELS: Record<UnmeasurableReasonId, string> = {
  background_image: "sit on an image or gradient",
  altered_rendering: "have a filter or blend mode applied",
  unsupported_colour: "use a colour this scanner could not resolve to sRGB",
};

/**
 * A link discovered in the rendered DOM.
 *
 * Stage 2 records these rather than analysing them: a bounded, deduplicated
 * inventory of what the page actually links to is the input Stage 6's crawler
 * needs, and it is collected while the rendered document is already open.
 */
export interface DiscoveredLink {
  /** Absolute, fragment-stripped http(s) URL. */
  href: string;
  /** Visible link text, collapsed; empty when the anchor has none. */
  text: string;
  /** True when the link stays on the scanned origin. */
  internal: boolean;
  /** True when the anchor carried rel="nofollow". */
  nofollow: boolean;
}

/** What the renderer found while collecting links. */
export interface LinkInventory {
  /** Anchors seen with an http(s) href, before deduplication. */
  anchorsSeen: number;
  /** Distinct hrefs after deduplication. */
  distinct: number;
  internal: number;
  external: number;
  /** Distinct external hosts, capped, for reporting where the page points. */
  externalHosts: string[];
  /** True when the inventory hit its cap and is not the whole page. */
  truncated: boolean;
  /** The links themselves, capped for storage. */
  links: DiscoveredLink[];
}

/* ------------------------------------------------------------------ */
/* DTOs                                                                */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Proposed fixes                                                      */
/* ------------------------------------------------------------------ */

/**
 * One value a proposed fix changes, with what it was and what it becomes.
 *
 * `before` always repeats something the scan actually measured, and `after` is
 * always something the scan then re-measured — never an estimate.
 */
export interface ProposedFixChange {
  /** CSS property or document field: "color", "background", "meta description"… */
  property: string;
  before: string;
  after: string;
}

/** A design token to add or update, named for the role the value plays. */
export interface ProposedFixToken {
  name: string;
  value: string;
}

/**
 * A replacement the audit generated and then checked against the same
 * requirement the finding failed.
 *
 * This is a claim like any other in the report, so it carries its own evidence:
 * `validation` holds the re-measured values, and `passed` is false whenever the
 * proposal did not clear the bar. A fix that cannot be validated is not
 * returned at all — the finding keeps its guidance and no colour is invented
 * for it.
 */
export interface ProposedFixData {
  /** What kind of change this is, so the UI can group and label it. */
  kind: "contrast" | "text_length";
  /** One sentence stating what changes and why. */
  summary: string;
  changes: ProposedFixChange[];
  /** Ready-to-paste CSS, or null when the fix is not a stylesheet change. */
  css: string | null;
  tokens: ProposedFixToken[];
  validation: {
    /** The requirement the proposal was re-measured against. */
    rule: string;
    before: string;
    after: string;
    passed: boolean;
  };
  /** Present for colour fixes: the measured pair a before/after swatch needs. */
  contrast: {
    foregroundBefore: string;
    foregroundAfter: string;
    background: string;
    required: number;
    /** The ratio after the fix, recomputed with the same engine as `before`. */
    ratioAfter: number;
    fontSizePx: number;
    fontWeight: number;
    /**
     * The element's own text, so the before/after can be shown on the words the
     * reader actually sees rather than on a generic stand-in. Null when the scan
     * could not capture it — the sample then still uses the real size, weight and
     * colours, and says so.
     */
    sampleText: string | null;
  } | null;
}

/** The key `ProposedFixData` is stored under inside a finding's `suggestedValues`. */
export const PROPOSED_FIX_KEY = "fix";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A ratio, or null when the colours are not something the maths can resolve. */
function measure(foreground: string, background: string): number | null {
  try {
    const ratio = contrastRatio(foreground, background);
    return Number.isFinite(ratio) ? ratio : null;
  } catch {
    // Stored JSON is not a trusted input: a malformed colour degrades to
    // "cannot verify", never to an exception in the report.
    return null;
  }
}

/**
 * Re-measure a colour fix and let the measurement, not the stored flag, decide.
 *
 * `passed` is a claim about arithmetic, so the report must not be able to assert
 * it on faith. This value comes back from the database, where a row may have
 * been written by an older engine, edited by hand, or corrupted — and the badge
 * sits directly above swatches painted from these very colours, so a stored
 * `true` over a pair that no longer clears the bar would show the reader a
 * failure labelled "Verified".
 *
 * So whenever the fix carries the pair it was measured from, the verdict and the
 * two displayed ratios are recomputed from those colours with the same maths the
 * scan used. A colour fix whose pair cannot be re-measured at all is not called
 * verified either: with no measurement, "Verified" is not a claim that can be
 * made. Only a fix with no colour arithmetic in it — a text-length change —
 * keeps its stored flag.
 */
function revalidateContrast(fix: ProposedFixData): ProposedFixData {
  // Nothing in a text-length fix is measured, so there is nothing to re-check.
  if (fix.kind !== "contrast") return fix;

  const pair = fix.contrast;
  const measured =
    pair && typeof pair.foregroundAfter === "string" && typeof pair.background === "string"
      ? measure(pair.foregroundAfter, pair.background)
      : null;
  const required =
    pair && typeof pair.required === "number" && Number.isFinite(pair.required) && pair.required > 0
      ? pair.required
      : null;

  // Decided on the raw measurement, exactly as the proposal and the finding are.
  const verified = measured !== null && required !== null && measured >= required;

  if (pair === null || measured === null || required === null) {
    return { ...fix, validation: { ...fix.validation, passed: verified } };
  }

  return {
    ...fix,
    validation: {
      ...fix.validation,
      // Rounded for reading only; the verdict above is taken on the raw value.
      after: `${round2(measured)}:1`,
      passed: verified,
    },
    contrast: { ...pair, ratioAfter: round2(measured) },
  };
}

/**
 * The element text a fix carries, narrowed from stored JSON.
 *
 * Trimmed and capped: this is a snippet of a scanned page, not a document, and
 * the card that renders it has one line to spare. Control whitespace is
 * collapsed because the text is drawn as a single run.
 */
export function normalizeSampleText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed) return null;
  return collapsed.length <= SAMPLE_TEXT_MAX_LENGTH
    ? collapsed
    : `${collapsed.slice(0, SAMPLE_TEXT_MAX_LENGTH - 1)}…`;
}

/** Longest element snippet a fix carries. */
export const SAMPLE_TEXT_MAX_LENGTH = 120;

/** Narrow unknown JSON (from the database) to a `ProposedFixData`, or null. */
export function parseProposedFix(value: unknown): ProposedFixData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<ProposedFixData>;
  if (candidate.kind !== "contrast" && candidate.kind !== "text_length") return null;
  if (typeof candidate.summary !== "string") return null;
  if (!Array.isArray(candidate.changes) || candidate.changes.length === 0) return null;
  if (!candidate.validation || typeof candidate.validation !== "object") return null;
  if (typeof candidate.validation.passed !== "boolean") return null;
  return revalidateContrast({
    kind: candidate.kind,
    summary: candidate.summary,
    changes: candidate.changes,
    css: typeof candidate.css === "string" ? candidate.css : null,
    tokens: Array.isArray(candidate.tokens) ? candidate.tokens : [],
    validation: {
      rule: String(candidate.validation.rule ?? ""),
      before: String(candidate.validation.before ?? ""),
      after: String(candidate.validation.after ?? ""),
      passed: candidate.validation.passed,
    },
    contrast: candidate.contrast
      ? { ...candidate.contrast, sampleText: normalizeSampleText(candidate.contrast.sampleText) }
      : null,
  });
}

export interface FindingDto {
  id: string;
  ruleId: string;
  category: FindingCategoryId;
  severity: FindingSeverityId;
  title: string;
  description: string;
  whyMatters: string | null;
  recommendation: string | null;
  implementation: string | null;
  elementSelector: string | null;
  wcagCriterion: string | null;
  detectionMethod: DetectionMethodId;
  confidence: number | null;
  /** Which page this finding was observed on. */
  pageUrl: string | null;
  createdAt: string;
  /**
   * A validated replacement for this finding, when one could be generated.
   * Null means no fix was produced — never that the finding is unfixable.
   */
  fix: ProposedFixData | null;
}

export interface ScannedPageDto {
  id: string;
  url: string;
  title: string | null;
  statusCode: number | null;
  loadTimeMs: number | null;
  errorMessage: string | null;
  /** True when the page was executed in a browser rather than merely fetched. */
  rendered: boolean;
  /** Same-origin path to the stored screenshot, or null when none was captured. */
  screenshotUrl: string | null;
  /** Measured boxes for finding selectors, in CSS px relative to the document. */
  elementRects: ElementRect[];
  /**
   * Aggregated colour measurements (hex plus how many samples used it),
   * most used first. The raw text samples stay in the worker; the report
   * only needs the histogram to name the site's dominant colours.
   */
  colorHistogram: ColorCount[];
}

export interface ScanStatusDto {
  id: string;
  url: string;
  normalizedUrl: string;
  status: ScanStatusId;
  stage: ScanStageId;
  scope: ScanScopeId;
  viewportWidth: number;
  viewportHeight: number;
  pagesScanned: number;
  pagesTotal: number;
  pagesFailed: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  ruleCount: number;
  /** Null until the scan reaches a terminal state and the mode is known. */
  renderMode: RenderModeId | null;
}

export interface ScanResultsDto {
  scan: ScanStatusDto;
  counts: Record<FindingSeverityId, number> & { total: number };
  categories: Partial<Record<FindingCategoryId, number>>;
  pages: ScannedPageDto[];
  /** The findings to show. Grouped duplicates are deliberately not included. */
  findings: FindingDto[];
  /**
   * How many findings two engines reported for the same problem and were
   * collapsed into one. Stored, grouped, and excluded from the counts above.
   */
  duplicatesGrouped: number;
  /**
   * What actually ran on this page. The report states its own coverage so an
   * engine that failed, or a measurement that was impossible, is visible
   * instead of looking like a page with nothing wrong with it.
   */
  coverage: ScanCoverageDto;
}

/**
 * The analysis engines' own account of what they did.
 *
 * Every field here is a measurement or a fact, never an inference: an engine
 * either ran or it did not, and the reason is carried rather than the state
 * being guessed at from an empty findings list.
 */
export interface ScanCoverageDto {
  /** How the page was analysed, or null for scans written before it was known. */
  renderMode: RenderModeId | null;
  /** Why the pipeline fell back to a fetch when it did. */
  renderFallbackReason: string | null;
  /** Rules in the native catalogue, as recorded when the scan ran. */
  rulesRun: number;
  /** axe-core's state: it ran, or it did not and this says why. */
  axeRan: boolean;
  axeVersion: string | null;
  axeError: string | null;
  /** Findings that came out of axe-core (rule ids prefixed `axe:`). */
  axeFindings: number;
  /** Findings from the native HTML rules. */
  nativeFindings: number;
  /** Text samples the contrast engine measured. */
  textSamplesMeasured: number;
  /** Text elements whose colour could not be measured, by reason. */
  textElementsUnmeasurable: number;
  unmeasurableReasons: Partial<Record<UnmeasurableReasonId, number>>;
  /**
   * Links discovered on the page, for the crawler that comes later. Null when
   * the page was fetched rather than rendered — link discovery needs a DOM.
   */
  linksFound: number | null;
  linksExternal: number | null;
  /** Subresource requests the SSRF guard refused. */
  blockedRequests: number;
  /**
   * Host-level AI-discovery facts from /robots.txt and /llms.txt, or null
   * when the scan predates them, never measured them, or was blocked before
   * it could. The files describe the host, so absence here means "not
   * measured" — never a pass.
   */
  aiDiscovery: AiDiscoveryCoverage | null;
}

/** What the scan recorded about AI crawler access and discovery files. */
export interface AiDiscoveryCoverage {
  robots: "present" | "absent" | "unavailable";
  llms: "present" | "absent" | "unavailable";
  /** AI agents the site's robots.txt tells off the root. */
  blockedBots: string[];
}

/* ------------------------------------------------------------------ */
/* Limits (shared so the UI can explain them before a user submits)     */
/* ------------------------------------------------------------------ */

export const ANONYMOUS_SCANS_PER_IP_PER_HOUR = 3;
export const ANONYMOUS_SCANS_PER_IP_PER_DAY = 10;
export const MAX_CONCURRENT_SCANS = 2;
/**
 * Whole-site crawls cost a full browser render per page, so they carry their
 * own daily allowance on top of the general scan limits. Everyone may run
 * them rate-limited; Pro pays for the compute with a higher allowance.
 */
export const ANONYMOUS_CRAWL_SCANS_PER_DAY = 1;
export const FREE_CRAWL_SCANS_PER_DAY = 2;
export const PRO_CRAWL_SCANS_PER_DAY = 20;
export const SCAN_FETCH_TIMEOUT_MS = 20_000;
export const SCAN_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
export const SCAN_MAX_REDIRECTS = 5;

/**
 * How long a scan may sit `queued` before the interface stops implying it is
 * about to start.
 *
 * The worker polls at most fifteen seconds apart, so a scan that is genuinely
 * next in line is claimed well inside this window. Past it, "in progress" is a
 * claim the client cannot support, and the progress view says what is actually
 * happening instead: the audit is waiting for a scanner.
 */
export const SCAN_QUEUE_NOTICE_MS = 20_000;

/**
 * How long a scan may sit `queued` before the queue gives up on it.
 *
 * Deliberately the same ten minutes as a scan left `running` (`STALE_SCAN_MS`
 * in `runner.ts`): that is this system's existing definition of "nobody is
 * coming back for this". The two cases differ in cause but not in consequence —
 * no worker will ever finish either — and both have to end, because a `queued`
 * row occupies a scanner slot and would otherwise hold one forever.
 */
export const SCAN_QUEUE_ABANDON_MS = 10 * 60 * 1000;

/**
 * Where a scan stands with respect to the queue.
 *
 * `pending` covers everything that is not queued at all — running, finished,
 * failed — and a queued scan still inside the notice window. `abandoned` is the
 * server's business: it is the age at which the row may be closed. Both
 * progress views branch on `awaiting_scanner`, which is the state a reader can
 * actually be told about.
 */
export type ScanQueueState = "pending" | "awaiting_scanner" | "abandoned";

/**
 * Classify a scan's time in the queue.
 *
 * `createdAt` is a date string on the wire and a `Date` straight from the
 * database, so both are accepted rather than making every caller convert. A
 * timestamp that cannot be read is treated as pending: an unreadable clock is
 * not evidence that a scan was abandoned, and guessing either way would be
 * worse than doing nothing.
 */
export function scanQueueState(
  status: ScanStatusId,
  createdAt: string | Date,
  now: number = Date.now(),
): ScanQueueState {
  if (status !== "queued") return "pending";
  const created = createdAt instanceof Date ? createdAt.getTime() : Date.parse(createdAt);
  if (!Number.isFinite(created)) return "pending";
  const waited = now - created;
  if (waited >= SCAN_QUEUE_ABANDON_MS) return "abandoned";
  if (waited >= SCAN_QUEUE_NOTICE_MS) return "awaiting_scanner";
  return "pending";
}

/** A short, readable wait for the queue panel: "8s", "1m 05s". */
export function formatQueueWait(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  if (minutes === 0) return `${total}s`;
  return `${minutes}m ${String(total % 60).padStart(2, "0")}s`;
}

/* ------------------------------------------------------------------ */
/* Worker liveness                                                     */
/* ------------------------------------------------------------------ */

/**
 * How often a live worker refreshes its heartbeat.
 *
 * The worker writes this on a timer rather than from its poll loop, because a
 * worker in the middle of a slow render is exactly as alive as an idle one and
 * the loop cannot say so while it is inside `runClaimedScan`.
 */
export const WORKER_HEARTBEAT_MS = 30_000;

/**
 * A heartbeat older than this means there is no scanner.
 *
 * Four missed beats, so one failed write or a pause between polls is not
 * mistaken for a dead host. The two ways of being wrong are not symmetrical and
 * the window leans the safe way: believing a stale row would put a reader back
 * where this whole mechanism came from — a form that accepts an audit no worker
 * will ever claim, and ten minutes of waiting to find out
 * (`SCAN_QUEUE_ABANDON_MS`) — while disbelieving a live one costs a retry.
 */
export const WORKER_HEARTBEAT_STALE_MS = 4 * WORKER_HEARTBEAT_MS;

/**
 * What the web tier can say about the scanner right now.
 *
 * There is deliberately no "unknown". A scanner either checked in recently
 * enough to accept work or it did not, and a third state would only move the
 * guess into a different place — a form still has to decide whether to accept
 * a URL. `lastSeenAt` is what lets the copy distinguish "has never run" from
 * "last seen three minutes ago".
 */
export interface ScannerAvailability {
  online: boolean;
  /** ISO timestamp of the most recent beat, or null when none ever arrived. */
  lastSeenAt: string | null;
  /** How long ago that beat was; null when there is no beat at all. */
  ageMs: number | null;
  /** Which worker wrote it, when there is one. */
  workerId: string | null;
  /**
   * The scanner version that beat announced, or null when it never said.
   *
   * Capability rides on this: a worker running older code cannot crawl, and
   * the only way to know that is what it reported about itself. The web tier
   * never guesses from the beat's age.
   */
  version: string | null;
}

/** No scanner has ever checked in. */
export const NO_SCANNER: ScannerAvailability = {
  online: false,
  lastSeenAt: null,
  ageMs: null,
  workerId: null,
  version: null,
};

/**
 * Classify a heartbeat against the clock.
 *
 * `lastSeenAt` is a date string over the wire and a `Date` straight from the
 * database, so both are accepted, as `scanQueueState` does. A timestamp that
 * cannot be read is treated as *offline* — the opposite of the choice
 * `scanQueueState` makes for an unreadable queue age, and deliberately: there,
 * guessing "abandoned" would close a scan that might be fine, while here
 * guessing "online" would accept one that cannot be run. An unreadable clock is
 * no evidence that a scanner exists.
 */
export function scannerAvailability(
  lastSeenAt: string | Date | null | undefined,
  workerId: string | null = null,
  now: number = Date.now(),
  version: string | null = null,
): ScannerAvailability {
  if (lastSeenAt === null || lastSeenAt === undefined) return NO_SCANNER;

  const seen = lastSeenAt instanceof Date ? lastSeenAt.getTime() : Date.parse(lastSeenAt);
  if (!Number.isFinite(seen)) return NO_SCANNER;

  const ageMs = now - seen;
  return {
    online: ageMs < WORKER_HEARTBEAT_STALE_MS,
    lastSeenAt: new Date(seen).toISOString(),
    ageMs,
    workerId,
    version,
  };
}

/** The machine-readable reason `POST /api/audit/scan` refuses while offline. */
export const SCANNER_OFFLINE_CODE = "scanner_offline";

/**
 * The scanner version that introduced crawling (`homepage_plus_pages`).
 *
 * The worker is a separately deployed process, so a web tier that offers the
 * whole-site scope can easily be talking to a worker that predates it. Without
 * this gate such a scan is *accepted* and then quietly scanned as one page —
 * the reader asked for their site and got a single URL with no explanation.
 * Refusing at the form, naming the version, is the honest failure.
 */
export const MIN_CRAWLER_VERSION = "3.0.0";

/**
 * Whether a worker reporting this version can run the crawl scope.
 *
 * A numeric comparison of the first two semver segments; an absent or
 * unparseable version counts as older than the minimum, because a worker that
 * does not report its version is one whose capabilities cannot be confirmed.
 */
export function scannerCanCrawl(version: string | null | undefined): boolean {
  if (!version) return false;
  const [major = NaN, minor = NaN] = version.split(".").map(Number);
  const [minMajor, minMinor] = MIN_CRAWLER_VERSION.split(".").map(Number);
  if (!Number.isFinite(major) || !Number.isFinite(minor)) return false;
  return major > minMajor || (major === minMajor && minor >= minMinor);
}

/**
 * What a reader is told when there is no scanner to run their audit.
 *
 * One string because both ends of the exchange say it — the API refuses with it
 * and the form prints it — and the two drifting apart is how the same moment
 * ends up reading "try again shortly" in one place and "the scanner is offline"
 * in another. It states the queue as well as the refusal: the fear it answers is
 * not "I cannot scan" but "did I just queue a scan that will fail in ten
 * minutes".
 */
export const SCANNER_OFFLINE_MESSAGE =
  "The scanner is offline right now, so audits cannot start. Nothing was queued — try again once the scanner is back.";
