/**
 * Page discovery for the selected-pages picker.
 *
 * Fetches one page with the scanner's guard rails (syntax, DNS, redirects,
 * size cap — the same gates a scan clears) and returns the pages a crawl
 * would visit from it, each with its link text for the checklist. It is the
 * crawl's first step factored out: `planNextPages` decides the set, so the
 * picker can never offer a page the scanner would refuse or skip.
 *
 * Fetch-only by design: the picker runs on the web tier, where there is no
 * browser. JavaScript-rendered links are invisible here, which the interface
 * says plainly; everything offered is typed-or-picked URLs re-validated at
 * scan time either way.
 */

import { fetchPageSafely, FetchError } from "./analyzer";
import { planNextPages } from "./crawl";
import { collectAnchors } from "./page-facts";
import {
  dohResolver,
  normalizeUrl,
  validateScanUrl,
  type HostResolver,
} from "./url-validator";
import type { DiscoveredLink } from "./types";

/** How many follow-up pages the picker offers (seed + these = the scope budget). */
export const DISCOVER_PAGE_LIMIT = 9;

export interface DiscoveredPageOption {
  url: string;
  /** Visible link text; empty when the anchor had none. */
  text: string;
}

export interface DiscoverResult {
  /** The fetched page, canonicalized — the checklist's first (seed) page. */
  seedUrl: string;
  pages: DiscoveredPageOption[];
}

/**
 * List the pages a crawl would visit from `rawUrl`.
 *
 * Throws `UrlValidationError` for an unscannable address and `FetchError`
 * when the page cannot be read or answers with an error status — both carry
 * messages written to be shown.
 */
export async function discoverPages(
  rawUrl: string,
  options: {
    resolve?: HostResolver;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<DiscoverResult> {
  const resolve = options.resolve ?? dohResolver;
  const fetchImpl = options.fetchImpl ?? fetch;

  const { url, normalized } = await validateScanUrl(rawUrl, resolve);
  // The guarded fetch only — no analysis rules. Discovery is the crawl's
  // first step, not a scan, so findings would be discarded work.
  const page = await fetchPageSafely(url, { resolve, fetchImpl });
  const finalUrl = page.finalUrl;

  if (page.statusCode >= 400) {
    throw new FetchError(
      "http",
      `That address returned HTTP ${page.statusCode}, so there are no site links to browse. Check the address, or type page URLs manually.`,
    );
  }

  // Anchor hrefs resolved and canonicalized exactly the way the crawler
  // canonicalizes: the text map and the plan below must agree on identity,
  // or the checklist would label the wrong pages.
  const textByUrl = new Map<string, string>();
  const links: DiscoveredLink[] = [];
  for (const anchor of collectAnchors(page.html)) {
    let href: string;
    try {
      href = normalizeUrl(new URL(anchor.href, finalUrl).toString());
    } catch {
      continue;
    }
    if (textByUrl.has(href)) continue;
    textByUrl.set(href, anchor.text);
    let internal = false;
    try {
      internal = new URL(href).origin === new URL(normalized).origin;
    } catch {
      continue;
    }
    links.push({ href, text: anchor.text, internal, nofollow: false });
  }

  const known = new Set<string>([normalized]);
  const planned = planNextPages({
    scannedUrl: finalUrl,
    seedUrl: normalized,
    links,
    known,
    remaining: DISCOVER_PAGE_LIMIT,
  });

  return {
    seedUrl: new URL(finalUrl).toString(),
    pages: planned.map((page) => ({ url: page, text: textByUrl.get(page) ?? "" })),
  };
}
