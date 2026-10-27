/**
 * AI-readiness: the "next SEO" half of the audit.
 *
 * Four native rules that ask whether AI crawlers and citation engines can
 * find, fetch and attribute the site: a robots.txt that guides them, no root
 * block aimed at (or catching) AI agents, an llms.txt discovery file, and
 * machine-readable trust signals (a contact link, Organization schema).
 *
 * Pure and client-safe by construction: only `./types` — no fetching, no
 * DNS, no Node APIs. The pipeline fetches the two discovery documents with
 * the scanner's guard rails; everything here turns bytes into findings, so
 * the rules stay unit-testable without touching the network.
 */

import type { FindingDraft } from "./types";

export const AI_READINESS_RULES: readonly { ruleId: string; label: string }[] = [
  { ruleId: "ai-robots-txt", label: "AI crawler guidance (robots.txt)" },
  { ruleId: "ai-bot-blocked", label: "AI crawler blocks" },
  { ruleId: "ai-llms-txt", label: "AI discovery file (llms.txt)" },
  { ruleId: "ai-trust-signals", label: "Machine-readable trust signals" },
] as const;

export const AI_READINESS_RULE_COUNT = AI_READINESS_RULES.length;

/** AI crawlers whose access the audit reasons about. Canonical casing. */
export const AI_BOT_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Bytespider",
] as const;

/** Whether a discovery document exists, from the pipeline's fetch of it. */
export type DiscoveryState = "present" | "absent" | "unavailable";

/**
 * One fetched discovery document (/robots.txt or /llms.txt), or null when the
 * fetch itself failed (DNS refusal, timeout, connection error). A document
 * the server answered for — even with an error status — is data, not a
 * failure: 404 means absent, anything else unexpected means unavailable.
 */
export interface DiscoveryDoc {
  status: number | null;
  contentType: string | null;
  body: string;
}

/** Host-level facts the report quotes in its coverage panel. */
export interface AiReadinessFacts {
  robots: DiscoveryState;
  llms: DiscoveryState;
  /** AI agents the site's robots.txt tells off the root, canonical casing. */
  blockedBots: string[];
}

export interface AiReadinessInput {
  robots: DiscoveryDoc | null;
  llms: DiscoveryDoc | null;
  hasContactLink: boolean;
  hasOrganizationSchema: boolean;
}

/* ------------------------------------------------------------------ */
/* robots.txt parsing                                                  */
/* ------------------------------------------------------------------ */

export interface RobotsGroup {
  /** Lower-cased user-agent values, one entry per User-agent line. */
  agents: string[];
  /** Raw Disallow values in source order (empty string = explicit allow). */
  disallows: string[];
}

/**
 * Parse a robots.txt body into user-agent groups. Comments are stripped,
 * directive names are case-insensitive, and consecutive User-agent lines form
 * one group — the shape the block check needs. Rules before any User-agent
 * line apply to nobody and are ignored, per the spec. Allow lines do not
 * affect the block check: a root Disallow blocks the crawl subject to narrow
 * exceptions, and the finding says so rather than modelling every crawler's
 * precedence rules.
 */
export function parseRobotsTxt(body: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let group: RobotsGroup | null = null;
  let lastWasUserAgent = false;

  for (const rawLine of body.split("\n")) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const match = /^(user-agent|disallow)\s*:\s*(.*)$/i.exec(line);
    if (!match) {
      lastWasUserAgent = false;
      continue;
    }
    const [, directive, value] = match;
    if (directive.toLowerCase() === "user-agent") {
      if (!lastWasUserAgent || !group) {
        group = { agents: [], disallows: [] };
        groups.push(group);
      }
      group.agents.push(value.trim().toLowerCase());
      lastWasUserAgent = true;
    } else if (group) {
      group.disallows.push(value.trim());
      lastWasUserAgent = false;
    }
  }
  return groups;
}

/**
 * AI agents told off the whole site: a group naming the agent (or the `*`
 * wildcard, which catches every crawler including AI ones) with a root
 * Disallow. An empty Disallow is an explicit allow and never blocks.
 */
export function blockedAiBots(groups: readonly RobotsGroup[]): string[] {
  return AI_BOT_AGENTS.filter((bot) => {
    const name = bot.toLowerCase();
    return groups.some(
      (group) =>
        (group.agents.includes(name) || group.agents.includes("*")) &&
        group.disallows.some((disallow) => disallow === "/"),
    );
  });
}

/**
 * Classify one fetched discovery document. A 404/410 means the file is not
 * there; any other non-2xx (a block page, a 500) means the audit could not
 * tell, so no finding is drawn from it. A 2xx with an HTML body is a
 * soft-404 — the host's error page wearing the file's URL — and counts as
 * absent. An empty body counts as absent too: an empty robots.txt allows
 * everything but guides nothing, and an empty llms.txt describes nothing.
 */
export function classifyDiscoveryDoc(doc: DiscoveryDoc | null): DiscoveryState {
  if (!doc || doc.status === null) return "unavailable";
  if (doc.status === 404 || doc.status === 410) return "absent";
  if (doc.status < 200 || doc.status >= 300) return "unavailable";
  if (doc.body.trim().length === 0) return "absent";
  const contentType = (doc.contentType ?? "").toLowerCase();
  if (contentType.includes("text/html") && /<\s*(!doctype|html)/i.test(doc.body.slice(0, 512))) {
    return "absent";
  }
  return "present";
}

/* ------------------------------------------------------------------ */
/* Trust signals                                                       */
/* ------------------------------------------------------------------ */

/**
 * The two machine-readable trust signals, scanned from the page HTML.
 * Contact links are markup, so scripts, styles, templates and comments are
 * stripped first (the same hygiene as the fact extractor); Organization
 * schema lives inside JSON-LD script blocks, so it is scanned from the raw
 * HTML instead.
 */
export function extractAiTrustSignals(html: string): {
  hasContactLink: boolean;
  hasOrganizationSchema: boolean;
} {
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ");

  let hasContactLink = false;
  const hrefPattern = /<a\b[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'<>]+))/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefPattern.exec(markup)) !== null) {
    const href = (match[2] ?? match[3] ?? match[4] ?? "").toLowerCase();
    if (
      href.startsWith("mailto:") ||
      /(contact|support|help|impressum|get-in-touch)/.test(href)
    ) {
      hasContactLink = true;
      break;
    }
  }

  return {
    hasContactLink,
    hasOrganizationSchema: /"@type"\s*:\s*"Organization"/.test(html),
  };
}

/* ------------------------------------------------------------------ */
/* The four rules                                                      */
/* ------------------------------------------------------------------ */

function baseDraft(ruleId: string): Omit<
  FindingDraft,
  "title" | "description" | "whyMatters" | "recommendation" | "implementation" | "evidence"
> {
  return {
    ruleId,
    category: "technical",
    severity: "informational",
    elementSelector: null,
    originalValues: null,
    suggestedValues: null,
    wcagCriterion: null,
    detectionMethod: "deterministic",
    confidence: 1,
  };
}

/**
 * Run the four AI-readiness rules. Documents the pipeline could not fetch
 * stay silent — an unreachable robots.txt is a network fact, not a verdict
 * on the site. Error pages (status >= 400) never reach here: the caller skips
 * the whole section, because findings drawn from an error document would
 * audit the wrong thing.
 */
export function analyzeAiReadiness(input: AiReadinessInput): {
  findings: FindingDraft[];
  facts: AiReadinessFacts;
} {
  const robots = classifyDiscoveryDoc(input.robots);
  const llms = classifyDiscoveryDoc(input.llms);
  const blockedBots =
    robots === "present" && input.robots
      ? blockedAiBots(parseRobotsTxt(input.robots.body))
      : [];
  const findings: FindingDraft[] = [];

  if (robots === "absent") {
    findings.push({
      ...baseDraft("ai-robots-txt"),
      title: "No robots.txt for AI crawlers to read",
      description:
        "The site serves no robots.txt at its root, so AI crawlers receive no crawl guidance for this host.",
      whyMatters:
        "AI search tools and assistants decide what they may cite from robots.txt and discovery files. Without one, each crawler falls back to its own defaults, and the site's AI visibility is left to chance.",
      recommendation:
        "Add a robots.txt at the site root that explicitly allows the crawlers you want, and keep it permissive by default.",
      implementation:
        "Serve a plain-text /robots.txt such as:\n\nUser-agent: *\nAllow: /\n\nAdd narrower Disallow lines only for paths crawlers should avoid.",
      evidence: { status: input.robots?.status ?? null },
    });
  }

  if (blockedBots.length > 0) {
    const names = blockedBots.join(", ");
    findings.push({
      ...baseDraft("ai-bot-blocked"),
      severity: "low",
      title:
        blockedBots.length === 1
          ? `robots.txt blocks an AI crawler: ${names}`
          : `robots.txt blocks ${blockedBots.length} AI crawlers: ${names}`,
      description: `robots.txt disallows the site root for ${names}. Those crawlers are told not to fetch any page, so AI tools built on them cannot cite this content.`,
      whyMatters:
        "A root Disallow written for rogue scrapers usually catches legitimate AI crawlers in the same net. Unlike a noindex, it also starves those crawlers of the discovery files that describe the site.",
      recommendation:
        "Allow the AI crawlers you want cited — GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, CCBot — or narrow the Disallow to the paths that truly must stay out.",
      implementation:
        "Add explicit allow entries above the wildcard block, for example:\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /",
      evidence: { blockedBots },
    });
  }

  if (llms === "absent") {
    findings.push({
      ...baseDraft("ai-llms-txt"),
      title: "No llms.txt AI discovery file",
      description:
        "The site serves no /llms.txt, the markdown discovery file AI assistants prefer when summarising or citing a site.",
      whyMatters:
        "HTML pages carry navigation, scripts and styling that cost crawlers context. A short markdown summary with links to key pages is cheaper to ingest and easier to cite accurately.",
      recommendation:
        "Generate an llms.txt for the site and point to it from robots.txt. The free llms.txt generator drafts one from a site's name, description and key pages: /tools/llms-txt-generator.",
      implementation:
        "Serve a plain-text /llms.txt starting with an H1 site name, a blockquote summary, then a markdown list of the key pages. Add a pointer line to robots.txt so crawlers find it.",
      evidence: { status: input.llms?.status ?? null },
    });
  }

  if (!input.hasContactLink && !input.hasOrganizationSchema) {
    findings.push({
      ...baseDraft("ai-trust-signals"),
      title: "No machine-readable trust signals",
      description:
        "The page has neither a contact link (a contact or support page, or a mailto: address) nor Organization structured data — the two signals AI citation engines use to attribute content to a real publisher.",
      whyMatters:
        "AI answers that cite sources prefer content attributable to a verifiable organisation with a way to reach it. Pages with neither are summarised less and cited less.",
      recommendation:
        "Link to a contact or support page from the header or footer, and add Organization JSON-LD with the site name, URL and contact point.",
      implementation:
        'Add <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"…","url":"…"}</script> to the page head.',
      evidence: {
        hasContactLink: input.hasContactLink,
        hasOrganizationSchema: input.hasOrganizationSchema,
      },
    });
  }

  return { findings, facts: { robots, llms, blockedBots } };
}
