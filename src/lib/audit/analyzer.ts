/**
 * Stage 1 deterministic single-page analyser.
 *
 * Two halves, deliberately separated so the interesting half is testable:
 *
 *   extractPageFacts()  — pure, dependency-free HTML fact extraction
 *   analyzePageFacts()  — pure, maps facts to findings
 *   fetchPageSafely()   — the I/O half: timeouts, size caps, redirect revalidation
 *
 * Scope note: this release analyses one fetched document. It does not execute
 * JavaScript, so findings are limited to what is present in the served HTML —
 * a real DOM pass (Stage 2) supersedes it. Every rule here reports what it
 * measured, and nothing is reported as a WCAG failure unless the criterion is
 * actually checkable from the document alone.
 */

import {
  assertSafeRedirect,
  resolveAndAssertPublic,
  type HostResolver,
  systemResolver,
  UrlValidationError,
} from "./url-validator";
import {
  AUDIT_RULES_VERSION,
  AUDIT_SCANNER_VERSION,
  META_DESCRIPTION_MAX_LENGTH,
  META_TITLE_MAX_LENGTH,
  META_TITLE_MIN_LENGTH,
  SCAN_FETCH_TIMEOUT_MS,
  SCAN_MAX_RESPONSE_BYTES,
  SCAN_MAX_REDIRECTS,
  type FindingDraft,
  type ScanStageId,
} from "./types";

// Re-exported for callers that already import the finding shape from here.
export type { FindingDraft } from "./types";

export const SCANNER_USER_AGENT =
  "ChromaBrew-Audit/1.0 (+https://chromabrew.app/audit; design and accessibility audit)";

/* ------------------------------------------------------------------ */
/* Findings                                                            */
/* ------------------------------------------------------------------ */

/**
 * The catalogue of rules this release actually runs. It is exported so the
 * report can state its own coverage instead of implying a complete audit.
 */
export const AUDIT_RULES: readonly { ruleId: string; label: string }[] = [
  { ruleId: "http-status", label: "Response status" },
  { ruleId: "content-type", label: "Document content type" },
  { ruleId: "meta-title", label: "Page title" },
  { ruleId: "meta-title-length", label: "Title length (guidance)" },
  { ruleId: "meta-description", label: "Meta description" },
  { ruleId: "meta-viewport", label: "Mobile viewport" },
  { ruleId: "html-lang", label: "Document language" },
  { ruleId: "img-alt", label: "Image alternative text" },
  { ruleId: "heading-h1", label: "Primary heading" },
  { ruleId: "robots-noindex", label: "Indexability" },
] as const;

export const AUDIT_RULE_COUNT = AUDIT_RULES.length;

/* ------------------------------------------------------------------ */
/* HTML fact extraction                                                */
/* ------------------------------------------------------------------ */

export interface PageFacts {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  htmlLang: string | null;
  viewportMeta: string | null;
  hasNoIndex: boolean;
  canonical: string | null;
  h1Count: number;
  headingCounts: Record<string, number>;
  imageCount: number;
  imagesMissingAlt: number;
  imagesWithEmptyAlt: number;
  imageSampleSelectors: string[];
  anchorCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  hasDoctype: boolean;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .trim();
}

/** Parse the attributes of a single tag. Handles quoted and bare values. */
export function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const body = tag.replace(/^<\s*[a-zA-Z0-9-]+/, "").replace(/\/?>$/, "");
  // Unquoted values follow the HTML5 spec: whitespace, both quote styles, "<"
  // and ">" end the value, but "=" and "`" are kept (with a parse error in a
  // browser), so `content=width=device-width` yields the whole string.
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (!(name in attributes)) attributes[name] = decodeEntities(value);
  }
  return attributes;
}

function collectTags(html: string, tagName: string): string[] {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return html.match(pattern) ?? [];
}

function isSameSite(candidate: string, baseUrl: string | undefined): boolean {
  if (!baseUrl) return false;
  try {
    return new URL(candidate, baseUrl).hostname === new URL(baseUrl).hostname;
  } catch {
    return false;
  }
}

/**
 * Extract the facts Stage 1 rules depend on. Content inside `<script>` and
 * `<style>` is removed first so inline templates never masquerade as markup.
 */
export function extractPageFacts(html: string, baseUrl?: string): PageFacts {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, " ");
  const markup = withoutComments
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ");

  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(markup);
  const title = titleMatch ? decodeEntities(titleMatch[1].replace(/\s+/g, " ")) : null;

  let metaDescription: string | null = null;
  let viewportMeta: string | null = null;
  let hasNoIndex = false;
  for (const tag of collectTags(markup, "meta")) {
    const attributes = parseAttributes(tag);
    const name = (attributes.name ?? attributes.property ?? "").toLowerCase();
    const content = attributes.content ?? "";
    if (name === "description" && metaDescription === null) metaDescription = content || null;
    if (name === "viewport" && viewportMeta === null) viewportMeta = content || null;
    if (name === "robots" && /noindex/i.test(content)) hasNoIndex = true;
  }

  const htmlTag = collectTags(markup, "html")[0];
  const htmlLang = htmlTag ? (parseAttributes(htmlTag).lang ?? null) : null;

  const linkTags = collectTags(markup, "link");
  let canonical: string | null = null;
  for (const tag of linkTags) {
    const attributes = parseAttributes(tag);
    if ((attributes.rel ?? "").toLowerCase() === "canonical") {
      canonical = attributes.href ?? null;
      break;
    }
  }

  const headingCounts: Record<string, number> = {};
  for (let level = 1; level <= 6; level++) {
    const count = (markup.match(new RegExp(`<h${level}\\b`, "gi")) ?? []).length;
    if (count > 0) headingCounts[`h${level}`] = count;
  }

  const imageTags = collectTags(markup, "img");
  let imagesMissingAlt = 0;
  let imagesWithEmptyAlt = 0;
  const imageSampleSelectors: string[] = [];
  for (const [index, tag] of imageTags.entries()) {
    const attributes = parseAttributes(tag);
    const identifier = attributes.id
      ? `#${attributes.id}`
      : attributes.src
        ? `img[src="${attributes.src.slice(0, 80)}"]`
        : `img:nth-of-type(${index + 1})`;
    if (!("alt" in attributes)) {
      imagesMissingAlt += 1;
      if (imageSampleSelectors.length < 5) imageSampleSelectors.push(identifier);
    } else if (attributes.alt === "") {
      imagesWithEmptyAlt += 1;
    }
  }

  const anchorTags = collectTags(markup, "a");
  let internalLinkCount = 0;
  let externalLinkCount = 0;
  for (const tag of anchorTags) {
    const href = parseAttributes(tag).href;
    if (!href || href.startsWith("#")) continue;
    if (/^https?:\/\//i.test(href)) {
      if (isSameSite(href, baseUrl)) internalLinkCount += 1;
      else externalLinkCount += 1;
    } else if (href.startsWith("/")) {
      internalLinkCount += 1;
    }
  }

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    htmlLang,
    viewportMeta,
    hasNoIndex,
    canonical,
    h1Count: headingCounts.h1 ?? 0,
    headingCounts,
    imageCount: imageTags.length,
    imagesMissingAlt,
    imagesWithEmptyAlt,
    imageSampleSelectors,
    anchorCount: anchorTags.length,
    internalLinkCount,
    externalLinkCount,
    hasDoctype: /<!doctype\s+html/i.test(markup),
  };
}

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

export interface AnalyzeContext {
  url: string;
  statusCode: number;
  contentType: string | null;
}

function isHtmlContentType(contentType: string | null): boolean {
  if (!contentType) return true; // servers often omit it; try to parse anyway
  return /text\/html|application\/xhtml\+xml/i.test(contentType);
}

/** Pure: facts in, findings out. No I/O, no clock, no randomness. */
export function analyzePageFacts(facts: PageFacts, context: AnalyzeContext): FindingDraft[] {
  const findings: FindingDraft[] = [];

  if (context.statusCode >= 400) {
    findings.push({
      ruleId: "http-status",
      category: "technical",
      severity: "high",
      title: `Page returned HTTP ${context.statusCode}`,
      description: `The server responded to ${context.url} with status ${context.statusCode}, so the page could not be rendered for analysis.`,
      whyMatters:
        "Error responses hide the real page from users, search engines and this audit — every other check result would be drawn from the error document instead.",
      recommendation: "Confirm the URL is public and returns 200, then run the scan again.",
      implementation: "Fix the route or submit a URL that a signed-out visitor can open.",
      elementSelector: null,
      originalValues: { statusCode: context.statusCode },
      suggestedValues: { statusCode: 200 },
      evidence: null,
      wcagCriterion: null,
      detectionMethod: "deterministic",
      confidence: 1,
    });
    return findings;
  }

  if (!isHtmlContentType(context.contentType)) {
    findings.push({
      ruleId: "content-type",
      category: "technical",
      severity: "informational",
      title: "Response is not HTML",
      description: `The URL returned "${context.contentType}", which is not an HTML document, so no page checks were run.`,
      whyMatters:
        "Only HTML documents carry the metadata, headings and images this release can measure. A binary or API response is not a page.",
      recommendation: "Submit a URL that serves an HTML page.",
      implementation: "Point the audit at a rendered page rather than a file or API endpoint.",
      elementSelector: null,
      originalValues: { contentType: context.contentType },
      suggestedValues: null,
      evidence: null,
      wcagCriterion: null,
      detectionMethod: "deterministic",
      confidence: 1,
    });
    return findings;
  }

  /* --- Title --- */
  if (!facts.title) {
    findings.push({
      ruleId: "meta-title",
      category: "metadata",
      severity: "high",
      title: "Page has no title",
      description: "The document contains no non-empty <title> element.",
      whyMatters:
        "The title is the page's name everywhere outside the page: browser tabs, search results and screen-reader page announcements. Without it, users and assistive technology get no reliable way to tell pages apart. WCAG 2.4.2 requires pages to be titled.",
      recommendation: "Add a unique, descriptive <title> that states what the page is.",
      implementation: `Add <title>Your page name — Site name</title> inside <head>.`,
      elementSelector: "head > title",
      originalValues: { title: facts.title },
      suggestedValues: { title: "A unique, descriptive page title (about 50-60 characters)" },
      evidence: null,
      wcagCriterion: "WCAG 2.2 SC 2.4.2 (Level A)",
      detectionMethod: "deterministic",
      confidence: 1,
    });
  } else if (
    facts.titleLength < META_TITLE_MIN_LENGTH ||
    facts.titleLength > META_TITLE_MAX_LENGTH
  ) {
    findings.push({
      ruleId: "meta-title-length",
      category: "metadata",
      severity: "low",
      title: `Title length is ${facts.titleLength} characters`,
      description: `The title "${facts.title}" is ${facts.titleLength} characters long. Around 50-60 characters is the usual guidance before search results truncate it.`,
      whyMatters:
        "This is craft guidance rather than a failure: an over-long title gets cut off in search results, and a very short one leaves room to say more. It does not affect accessibility.",
      recommendation: "Aim for roughly 50-60 characters, front-loading the distinctive words.",
      implementation: "Rewrite the <title> text; keep the primary phrase first and the brand last.",
      elementSelector: "head > title",
      originalValues: { title: facts.title, length: facts.titleLength },
      suggestedValues: { length: "50-60 characters" },
      evidence: { length: facts.titleLength },
      wcagCriterion: null,
      detectionMethod: "deterministic",
      confidence: 0.5,
    });
  }

  /* --- Description --- */
  if (!facts.metaDescription) {
    findings.push({
      ruleId: "meta-description",
      category: "metadata",
      severity: "medium",
      title: "Page has no meta description",
      description: "No <meta name=\"description\"> element with content was found.",
      whyMatters:
        "Search engines use the description as the snippet under your title. Without one, they improvise from page text, which is usually less accurate. It is not an accessibility requirement.",
      recommendation: "Add a one- or two-sentence summary of the page, around 120-155 characters.",
      implementation:
        'Add <meta name="description" content="What this page offers, in one sentence."> inside <head>.',
      elementSelector: 'head > meta[name="description"]',
      originalValues: null,
      suggestedValues: { length: "120-155 characters" },
      evidence: null,
      wcagCriterion: null,
      detectionMethod: "deterministic",
      confidence: 1,
    });
  } else if (facts.metaDescriptionLength > META_DESCRIPTION_MAX_LENGTH) {
    findings.push({
      ruleId: "meta-description-length",
      category: "metadata",
      severity: "informational",
      title: `Meta description is ${facts.metaDescriptionLength} characters`,
      description:
        "The description is longer than roughly 155-160 characters, so search engines are likely to truncate it.",
      whyMatters:
        "The end of an over-long description is not shown, so any call to action placed there is wasted.",
      recommendation: "Trim the description so its most important sentence fits in the first 155 characters.",
      implementation: "Shorten the content attribute of the meta description.",
      elementSelector: 'head > meta[name="description"]',
      // The description text itself is recorded, not just its length: the fix
      // generator can shorten a string it was given, but it cannot shorten one
      // it never saw — and it will not write a new one.
      originalValues: {
        length: facts.metaDescriptionLength,
        description: facts.metaDescription,
      },
      suggestedValues: { length: "120-155 characters" },
      evidence: { length: facts.metaDescriptionLength },
      wcagCriterion: null,
      detectionMethod: "deterministic",
      confidence: 0.7,
    });
  }

  /* --- Viewport --- */
  if (!facts.viewportMeta) {
    findings.push({
      ruleId: "meta-viewport",
      category: "technical",
      severity: "high",
      title: "No mobile viewport is declared",
      description: 'The document has no <meta name="viewport"> element.',
      whyMatters:
        "Without a viewport declaration, mobile browsers render the page at desktop width and zoom out, which makes text tiny and forces horizontal scrolling. It is one of the most common causes of a page feeling broken on a phone.",
      recommendation: "Declare a responsive viewport.",
      implementation:
        'Add <meta name="viewport" content="width=device-width, initial-scale=1"> inside <head>.',
      elementSelector: 'head > meta[name="viewport"]',
      originalValues: null,
      suggestedValues: { content: "width=device-width, initial-scale=1" },
      evidence: null,
      wcagCriterion: "WCAG 2.2 SC 1.4.10 Reflow (Level AA) is affected by this",
      detectionMethod: "deterministic",
      confidence: 1,
    });
  }

  /* --- Language --- */
  if (!facts.htmlLang) {
    findings.push({
      ruleId: "html-lang",
      category: "accessibility",
      severity: "high",
      title: "Document language is not set",
      description: "The <html> element has no lang attribute.",
      whyMatters:
        "Screen readers choose pronunciation rules from the document language. Without it the page may be read with the wrong accent or, for some languages, be unintelligible. WCAG 2.2 SC 3.1.1 requires it.",
      recommendation: "Set the language on the <html> element.",
      implementation: 'Add lang="en" (or the page\'s actual language) to the opening <html> tag.',
      elementSelector: "html",
      originalValues: { lang: null },
      suggestedValues: { lang: "en" },
      evidence: null,
      wcagCriterion: "WCAG 2.2 SC 3.1.1 (Level A)",
      detectionMethod: "deterministic",
      confidence: 1,
    });
  }

  /* --- Images --- */
  if (facts.imagesMissingAlt > 0) {
    const plural = facts.imagesMissingAlt === 1 ? "image has" : "images have";
    findings.push({
      ruleId: "img-alt",
      category: "accessibility",
      severity: "critical",
      title: `${facts.imagesMissingAlt} ${plural} no alt attribute`,
      description: `Of ${facts.imageCount} images in the document, ${facts.imagesMissingAlt} carry no alt attribute at all. (${facts.imagesWithEmptyAlt} declare alt="" and were treated as intentionally decorative.)`,
      whyMatters:
        "An image with no alt attribute is announced by screen readers as its file name — often a meaningless string like \"hero-2-final.png\" — and gives no information when images fail to load. WCAG 2.2 SC 1.1.1 requires a text alternative for every non-text element.",
      recommendation:
        "Add alt text that conveys the image's purpose. Use alt=\"\" deliberately for images that add nothing for a screen-reader user.",
      implementation:
        '<img src="chart.png" alt="Revenue grew from $1.2M to $4.8M between 2023 and 2026">',
      elementSelector: facts.imageSampleSelectors[0] ?? "img",
      originalValues: {
        imagesMissingAlt: facts.imagesMissingAlt,
        sampleSelectors: facts.imageSampleSelectors,
      },
      suggestedValues: { alt: "Descriptive text, or an empty alt for decorative images" },
      evidence: {
        imageCount: facts.imageCount,
        imagesMissingAlt: facts.imagesMissingAlt,
        imagesWithEmptyAlt: facts.imagesWithEmptyAlt,
      },
      wcagCriterion: "WCAG 2.2 SC 1.1.1 (Level A)",
      detectionMethod: "deterministic",
      confidence: 1,
    });
  }

  /* --- Headings --- */
  if (facts.h1Count === 0) {
    findings.push({
      ruleId: "heading-h1",
      category: "accessibility",
      severity: "medium",
      title: "Page has no primary heading",
      description: "No <h1> element was found in the served HTML.",
      whyMatters:
        "A single top-level heading gives the page a name in outline views and lets screen-reader users jump straight to the main content. Its absence usually means structure is being expressed with styling rather than markup.",
      recommendation: "Mark the page's main heading up as an <h1>, once.",
      implementation: "<h1>What this page is about</h1>",
      elementSelector: "h1",
      originalValues: { h1Count: 0, headingCounts: facts.headingCounts },
      suggestedValues: { h1Count: 1 },
      evidence: { headingCounts: facts.headingCounts },
      wcagCriterion: null,
      detectionMethod: "deterministic",
      confidence: 0.9,
    });
  } else if (facts.h1Count > 1) {
    findings.push({
      ruleId: "heading-h1",
      category: "accessibility",
      severity: "low",
      title: `Page has ${facts.h1Count} h1 headings`,
      description: `The document contains ${facts.h1Count} <h1> elements, so the page outline has more than one top-level entry.`,
      whyMatters:
        "Multiple h1s dilute the page outline used by assistive technology and by search engines. It is valid HTML, which is why this is flagged as low severity rather than a failure.",
      recommendation: "Keep one h1 for the page, and demote the others to h2 or lower.",
      implementation: "Change the secondary headings from <h1> to <h2> (adjusting styles to match).",
      elementSelector: "h1",
      originalValues: { h1Count: facts.h1Count },
      suggestedValues: { h1Count: 1 },
      evidence: { headingCounts: facts.headingCounts },
      wcagCriterion: null,
      detectionMethod: "deterministic",
      confidence: 0.6,
    });
  }

  /* --- Indexability --- */
  if (facts.hasNoIndex) {
    findings.push({
      ruleId: "robots-noindex",
      category: "technical",
      severity: "informational",
      title: "Page opts out of search indexing",
      description: 'The document sets <meta name="robots" content="noindex">.',
      whyMatters:
        "This is correct for staging pages and intentional for some screens, but it means the page will not appear in search results no matter how good its metadata is. Worth confirming it is deliberate.",
      recommendation: "If the page should be findable, remove the noindex directive.",
      implementation: 'Remove <meta name="robots" content="noindex"> from <head>.',
      elementSelector: 'head > meta[name="robots"]',
      originalValues: { robots: "noindex" },
      suggestedValues: null,
      evidence: null,
      wcagCriterion: null,
      detectionMethod: "deterministic",
      confidence: 1,
    });
  }

  return findings;
}

/* ------------------------------------------------------------------ */
/* Fetching                                                            */
/* ------------------------------------------------------------------ */

export interface FetchedPage {
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  html: string;
  loadTimeMs: number;
  bytes: number;
  redirects: string[];
  truncated: boolean;
}

export class FetchError extends Error {
  readonly code: "timeout" | "too_large" | "network" | "too_many_redirects" | "blocked";

  constructor(code: FetchError["code"], message: string) {
    super(message);
    this.name = "FetchError";
    this.code = code;
  }
}

async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<{ body: string; bytes: number; truncated: boolean }> {
  const declared = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new FetchError("too_large", `The page is larger than ${maxBytes} bytes.`);
  }
  if (!response.body) return { body: "", bytes: 0, truncated: false };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(Math.min(bytes, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    if (offset >= merged.length) break;
    const slice = chunk.subarray(0, Math.min(chunk.length, merged.length - offset));
    merged.set(slice, offset);
    offset += slice.length;
  }
  return { body: new TextDecoder("utf-8").decode(merged), bytes, truncated };
}

/**
 * Fetch a page with the scanner's guard rails: per-hop redirect revalidation,
 * a hard timeout, a response size cap and a manual redirect loop.
 *
 * `resolve` is injectable so tests can drive block/allow decisions without
 * touching the network.
 */
export async function fetchPageSafely(
  startUrl: URL,
  options: {
    timeoutMs?: number;
    maxBytes?: number;
    maxRedirects?: number;
    resolve?: HostResolver;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<FetchedPage> {
  const timeoutMs = options.timeoutMs ?? SCAN_FETCH_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? SCAN_MAX_RESPONSE_BYTES;
  const maxRedirects = options.maxRedirects ?? SCAN_MAX_REDIRECTS;
  const resolve = options.resolve ?? systemResolver;
  const doFetch = options.fetchImpl ?? fetch;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const redirects: string[] = [];
  const started = Date.now();

  try {
    let current = startUrl;
    // Re-validate the starting host immediately before the request.
    await resolveAndAssertPublic(current, resolve);

    for (let hop = 0; hop <= maxRedirects; hop++) {
      const response = await doFetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "user-agent": SCANNER_USER_AGENT,
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new FetchError("network", "The site sent a redirect without a destination.");
        }
        if (hop === maxRedirects) {
          throw new FetchError(
            "too_many_redirects",
            `The site redirected more than ${maxRedirects} times.`,
          );
        }
        // Every hop is validated, not just the first URL.
        current = await assertSafeRedirect(current, location, resolve);
        redirects.push(current.toString());
        continue;
      }

      const { body, bytes, truncated } = await readCapped(response, maxBytes);
      return {
        finalUrl: current.toString(),
        statusCode: response.status,
        contentType: response.headers.get("content-type"),
        html: body,
        loadTimeMs: Date.now() - started,
        bytes,
        redirects,
        truncated,
      };
    }

    throw new FetchError("too_many_redirects", "Too many redirects.");
  } catch (error) {
    if (error instanceof FetchError) throw error;
    if (error instanceof UrlValidationError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchError("timeout", `The site did not respond within ${timeoutMs / 1000}s.`);
    }
    throw new FetchError("network", "Could not reach the site.");
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Orchestration                                                       */
/* ------------------------------------------------------------------ */

export interface AnalysisOutcome {
  page: FetchedPage;
  facts: PageFacts;
  findings: FindingDraft[];
  rulesVersion: string;
  scannerVersion: string;
}

/**
 * Fetch one page and run every Stage 1 rule against it.
 *
 * `onStage` lets the scan runner publish the real pipeline stage the moment it
 * changes, so the progress UI reflects the job rather than a timer.
 */
export async function analyzeUrl(
  url: URL,
  options: {
    resolve?: HostResolver;
    fetchImpl?: typeof fetch;
    onStage?: (stage: ScanStageId) => void | Promise<void>;
  } = {},
): Promise<AnalysisOutcome> {
  await options.onStage?.("rendering");
  const page = await fetchPageSafely(url, options);
  await options.onStage?.("analyzing");
  const facts = extractPageFacts(page.html, page.finalUrl);
  const findings = analyzePageFacts(facts, {
    url: page.finalUrl,
    statusCode: page.statusCode,
    contentType: page.contentType,
  });
  return {
    page,
    facts,
    findings,
    rulesVersion: AUDIT_RULES_VERSION,
    scannerVersion: AUDIT_SCANNER_VERSION,
  };
}
