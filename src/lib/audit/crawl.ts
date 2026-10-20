/**
 * Crawl planning for the multi-page scope.
 *
 * Decides which links a rendered page discovered should be scanned next,
 * without touching the network or the database — the runner feeds it each
 * page's link inventory and pops the returned URLs off its queue. Being pure
 * is the point: the policy for "which few pages of this site are worth the
 * reader's quota" is the part worth arguing about, and it can only be argued
 * about in a test.
 *
 * The policy, in order:
 *
 *   1. Same origin only. A crawl that wanders off-site is auditing somebody
 *      else's website with this reader's quota, and the SSRF gates would
 *      refuse those hosts anyway — refusing here means they are never asked
 *      about at all.
 *   2. Pages, not files. Hrefs carrying a file extension the browser would
 *      download or render natively (PDF, images, archives, feeds, styles,
 *      scripts) are skipped: an audit of a PDF is a blank page and a finding
 *      list about nothing.
 *   3. Already-seen is skipped. The seed URL itself, every page scanned so
 *      far, and every URL already waiting in the queue are excluded — a site
 *      whose navigation links to the homepage from every page must not send
 *      the crawl in circles.
 *   4. Shallow before deep, stable within a depth. `/pricing` beats
 *      `/blog/2019/legacy-post/page/3`, and ties keep the order the page
 *      listed them in — the site's own navigation order is the best signal
 *      available for what matters.
 *
 * Every candidate is normalized through `normalizeUrl` (the same canonical
 * form the scanner stores), so `?utm_source=x` and a bare href are one page.
 */

import { normalizeUrl } from "./url-validator";
import type { DiscoveredLink } from "./types";

/**
 * Extensions that are not HTML pages. Matched against the pathname's tail, so
 * `/style.css?v=2` is excluded by the extension and `/guide.pdf.html` is not.
 */
const NON_PAGE_EXTENSIONS = new Set([
  "pdf", "zip", "gz", "tar", "rar", "7z", "dmg", "exe", "msi",
  "png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico", "bmp",
  "mp3", "wav", "ogg", "flac", "mp4", "webm", "mov", "avi", "mkv",
  "css", "js", "mjs", "map", "json", "xml", "rss", "atom",
  "woff", "woff2", "ttf", "otf", "eot",
  "csv", "tsv", "xlsx", "doc", "docx", "ppt", "pptx",
]);

function hasNonPageExtension(pathname: string): boolean {
  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
  const dot = lastSegment.lastIndexOf(".");
  if (dot <= 0) return false; // no extension, or a dotfile like /.well-known
  return NON_PAGE_EXTENSIONS.has(lastSegment.slice(dot + 1).toLowerCase());
}

/**
 * Normalize a href and return it parsed, or null when it is not a crawl
 * target. `normalizeUrl` throws for anything the scanner would refuse
 * (javascript:, malformed, absurdly long), which for a discovered link is not
 * a crawl target and not a reason to fail the scan.
 */
function normalizeOrNull(href: string): URL | null {
  try {
    return new URL(normalizeUrl(href));
  } catch {
    return null;
  }
}

/** How many candidate links the planner will look at per page. */
const MAX_CANDIDATES_PER_PAGE = 100;

export interface CrawlPlanInput {
  /** The page that was just scanned, whose links these are. */
  scannedUrl: string;
  /** The scan's seed URL — never re-queued. */
  seedUrl: string;
  /** Links found on `scannedUrl`, in the order the page listed them. */
  links: readonly DiscoveredLink[];
  /** Normalized URLs already scanned or already queued for this scan. */
  known: ReadonlySet<string>;
  /** How many more pages this scan may visit. */
  remaining: number;
}

/**
 * Pick the next URLs to scan from one page's link inventory.
 *
 * Returns normalized absolute URLs, in the order they should be scanned, at
 * most `remaining` of them. Callers add them to `known` as they queue them, so
 * successive calls (one per scanned page) never revisit anything.
 */
export function planNextPages(input: CrawlPlanInput): string[] {
  if (input.remaining <= 0) return [];

  const seed = normalizeOrNull(input.seedUrl);
  if (!seed) return [];

  const candidates: { url: string; depth: number }[] = [];

  for (const link of input.links.slice(0, MAX_CANDIDATES_PER_PAGE)) {
    // Same origin as the seed, not merely "internal to the page's host": the
    // scanned page may itself have been reached through a redirect to another
    // host, and the crawl belongs to the site the reader submitted.
    const candidate = normalizeOrNull(link.href);
    if (!candidate) continue;
    if (candidate.origin !== seed.origin) continue;
    if (hasNonPageExtension(candidate.pathname)) continue;

    const normalized = candidate.toString();
    if (input.known.has(normalized)) continue;
    if (candidates.some((existing) => existing.url === normalized)) continue;

    candidates.push({ url: normalized, depth: pathDepth(candidate) });
  }

  // Shallowest first; ties keep the page's own order (Array#sort is stable),
  // which is the best available signal for what the site considers primary.
  candidates.sort((a, b) => a.depth - b.depth);

  return candidates.slice(0, input.remaining).map((candidate) => candidate.url);
}

function pathDepth(url: URL): number {
  return url.pathname.split("/").filter(Boolean).length;
}

