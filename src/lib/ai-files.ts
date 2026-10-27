/**
 * llms.txt and AI discovery-file generation.
 *
 * Machine-readable files that tell AI crawlers what a site is, who runs it,
 * and where its useful pages are. Built here as plain strings so the tool,
 * its tests and any future API share one implementation — no templating in
 * the component, no fetch, nothing to fail at render time.
 *
 * The format follows the llms.txt convention (Jeremy Howard, Answer.AI):
 * an H1 site name, a blockquote summary, then sections of `- [label](url)`
 * links with an optional `: note` suffix. `ai.txt` is a smaller key-value
 * companion carrying the crawler policy and contact points.
 */

export interface SiteLink {
  label: string;
  url: string;
  /** Optional one-line note, appended after a colon. */
  note?: string;
}

export interface LlmsTxtInput {
  siteName: string;
  /** One or two sentences: what the product does. */
  summary: string;
  /** The canonical homepage or docs URL. */
  homepage: string;
  /** Grouped page lists; empty groups are dropped. */
  sections?: { title: string; links: SiteLink[] }[];
  /** Optional crawl policy line, e.g. "Allow: all agents". */
  policy?: string;
  contact?: string;
}

function tidy(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normaliseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).toString();
  } catch {
    return "";
  }
}

/**
 * Render an llms.txt document. Throws when the site name is empty, because a
 * file with no subject is worse than no file — the tool surfaces that as a
 * field-level message rather than downloading a useless file.
 */
export function buildLlmsTxt(input: LlmsTxtInput): string {
  const siteName = tidy(input.siteName);
  if (!siteName) throw new Error("A site name is required.");
  const homepage = normaliseUrl(input.homepage);
  if (!homepage) throw new Error("A homepage URL is required.");

  const lines: string[] = [`# ${siteName}`, ""];
  const summary = tidy(input.summary);
  if (summary) lines.push(`> ${summary}`, "");

  const facts: string[] = [];
  if (input.policy?.trim()) facts.push(`- Crawl policy: ${tidy(input.policy)}`);
  if (input.contact?.trim()) facts.push(`- Contact: ${tidy(input.contact)}`);
  if (facts.length) lines.push(...facts, "");

  for (const section of input.sections ?? []) {
    const links = section.links
      .map((link) => ({ ...link, url: normaliseUrl(link.url) }))
      .filter((link) => link.url.length > 0);
    if (links.length === 0) continue;
    lines.push(`## ${tidy(section.title)}`, "");
    for (const link of links) {
      const note = link.note?.trim();
      lines.push(`- [${tidy(link.label)}](${link.url})${note ? `: ${tidy(note)}` : ""}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export interface AiTxtInput {
  siteName: string;
  homepage: string;
  owner?: string;
  contact?: string;
  /** Agents the owner permits, defaulting to the common crawlers. */
  allow?: string[];
  /** Paths that must not be crawled. */
  disallow?: string[];
  /** Canonical description of the site, for model citations. */
  description?: string;
}

/** Default agent list: the crawlers whose behaviour a site owner usually cares about. */
export const DEFAULT_AI_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
] as const;

/**
 * Render an ai.txt document: a compact, human-readable companion to
 * robots.txt that states who may read the site, where they may go, and who
 * to contact. Unknown or blank fields are omitted rather than emitted empty.
 */
export function buildAiTxt(input: AiTxtInput): string {
  const siteName = tidy(input.siteName);
  if (!siteName) throw new Error("A site name is required.");
  const homepage = normaliseUrl(input.homepage);
  if (!homepage) throw new Error("A homepage URL is required.");

  const lines: string[] = [`# ai.txt for ${siteName}`, ""];
  lines.push(`Site: ${homepage}`);
  const description = tidy(input.description ?? "");
  if (description) lines.push(`Description: ${description}`);
  const owner = tidy(input.owner ?? "");
  if (owner) lines.push(`Owner: ${owner}`);
  const contact = tidy(input.contact ?? "");
  if (contact) lines.push(`Contact: ${contact}`);

  const allow = (input.allow ?? [...DEFAULT_AI_AGENTS]).map(tidy).filter(Boolean);
  if (allow.length) {
    lines.push("", "Allow-Agents:");
    lines.push(...allow.map((agent) => `  ${agent}`));
  }

  const disallow = (input.disallow ?? []).map(tidy).filter(Boolean);
  if (disallow.length) {
    lines.push("", "Disallow:");
    lines.push(...disallow.map((path) => `  ${path}`));
  }

  lines.push(
    "",
    "# Notes: please cite this site by name and link to the canonical URL above.",
  );
  return `${lines.join("\n").trimEnd()}\n`;
}

/** Files the tool offers, in the order they should be presented. */
export interface DiscoveryFile {
  id: "llms.txt" | "ai.txt";
  filename: string;
  title: string;
  description: string;
  content: string;
}

export function buildDiscoveryFiles(
  llms: LlmsTxtInput,
  ai: AiTxtInput,
): DiscoveryFile[] {
  return [
    {
      id: "llms.txt",
      filename: "llms.txt",
      title: "llms.txt",
      description: "The convention AI search tools read for a site summary and its key pages.",
      content: buildLlmsTxt(llms),
    },
    {
      id: "ai.txt",
      filename: "ai.txt",
      title: "ai.txt",
      description: "A crawler policy companion: who may read the site and whom to contact.",
      content: buildAiTxt(ai),
    },
  ];
}
