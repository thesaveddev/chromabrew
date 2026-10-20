import { describe, expect, it } from "vitest";

import { planNextPages } from "./crawl";
import type { DiscoveredLink } from "./types";

const SEED = "https://example.com/";

function link(href: string, overrides: Partial<DiscoveredLink> = {}): DiscoveredLink {
  return { href, text: "", internal: true, nofollow: false, ...overrides };
}

function plan(links: DiscoveredLink[], known: string[] = [], remaining = 5): string[] {
  return planNextPages({
    scannedUrl: SEED,
    seedUrl: SEED,
    links,
    known: new Set([SEED, ...known]),
    remaining,
  });
}

describe("planNextPages", () => {
  it("queues same-origin page links, in page order", () => {
    expect(plan([link("https://example.com/pricing"), link("https://example.com/about")])).toEqual([
      "https://example.com/pricing",
      "https://example.com/about",
    ]);
  });

  it("refuses links that leave the submitted site", () => {
    // Off-site links are somebody else's server, and the SSRF gates would
    // refuse them anyway — the planner never lets them reach the queue.
    expect(
      plan([link("https://other.com/pricing"), link("https://blog.example.com/post")]),
    ).toEqual([]);
  });

  it("skips files the browser would download rather than render", () => {
    expect(
      plan([
        link("https://example.com/whitepaper.pdf"),
        link("https://example.com/logo.png"),
        link("https://example.com/feed.xml"),
        link("https://example.com/app.js?v=3"),
        link("https://example.com/docs"),
      ]),
    ).toEqual(["https://example.com/docs"]);
  });

  it("keeps pages whose path merely contains a dot", () => {
    expect(plan([link("https://example.com/guide.v2/overview")])).toEqual([
      "https://example.com/guide.v2/overview",
    ]);
  });

  it("never re-queues the seed or a page already known", () => {
    expect(
      plan([
        link("https://example.com/"),
        link("https://example.com/pricing"),
        link("https://example.com/about"),
      ], ["https://example.com/pricing"]),
    ).toEqual(["https://example.com/about"]);
  });

  it("deduplicates repeated hrefs that normalize to one page", () => {
    // The same page three ways: fragment, tracking parameter, trailing slash
    // spelling that normalizes identically. One page, one queue slot.
    expect(
      plan([
        link("https://example.com/pricing#plans"),
        link("https://example.com/pricing?utm_source=newsletter"),
        link("https://example.com/pricing"),
      ]),
    ).toEqual(["https://example.com/pricing"]);
  });

  it("honours the remaining-pages budget, preferring shallower paths", () => {
    const queued = plan(
      [
        link("https://example.com/blog/2024/deep/nested/post"),
        link("https://example.com/contact"),
        link("https://example.com/blog"),
      ],
      [],
      2,
    );

    // /contact and /blog beat a four-deep blog post; ties (both depth 1)
    // keep the page's own order.
    expect(queued).toEqual(["https://example.com/contact", "https://example.com/blog"]);
  });

  it("returns nothing when the budget is spent", () => {
    expect(plan([link("https://example.com/pricing")], [], 0)).toEqual([]);
  });

  it("drops malformed and non-http hrefs without failing", () => {
    expect(
      plan([
        link("javascript:void(0)"),
        link("mailto:hello@example.com"),
        link("not a url at all"),
        link("https://example.com/ok"),
      ]),
    ).toEqual(["https://example.com/ok"]);
  });

  it("ignores the link's internal flag and judges by origin itself", () => {
    // The flag is the renderer's shorthand; the planner re-derives the answer
    // from the URL so a mislabelled inventory cannot steer the crawl off-site.
    expect(
      plan([
        link("https://example.com/pricing", { internal: false }),
        link("https://other.com/page", { internal: true }),
      ]),
    ).toEqual(["https://example.com/pricing"]);
  });
});
