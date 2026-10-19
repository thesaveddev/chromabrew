/**
 * SEO audit harness — re-runnable against this app or a deployed origin.
 *
 *   npm run seo:audit                              # against http://127.0.0.1:3300
 *   BASE=https://chromabrew.com npm run seo:audit   # against production
 *
 * Two halves:
 *   1. Registry inventory — duplicates, truncation and content depth, read from
 *      the same modules the pages render, so the numbers cannot drift.
 *   2. Served-HTML checks — every route fetched with redirects unfollowed, then
 *      compared against what its own metadata declares.
 *
 * Exit code is 1 when a hard invariant breaks (a page canonicalising away from
 * itself, a duplicate title, a missing canonical or description, more than one
 * h1). Warnings do not fail the run — they are judgement calls, not breakage.
 */
import { TOOLS } from "../src/lib/tools.ts";
import { BLOG_POSTS, livePosts } from "../src/lib/posts.ts";
import { PALETTE_THEMES, GALLERY_PALETTES } from "../src/lib/palettes.ts";
import { NAMED_COLORS } from "../src/lib/colors.ts";
import { BRAND_PALETTES } from "../src/lib/brand-palettes.ts";
import { brandSlug } from "../src/lib/brand-pages.ts";
import { siteUrl } from "../src/lib/site-url.ts";

const BASE = process.env.BASE ?? "http://127.0.0.1:3300";

/** The layout's title template, applied to every child segment. */
const TEMPLATE_SUFFIX = " · ChromaBrew";
const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

const REGISTRY_ROUTES = new Set([
  "/", "/design-system", "/tools", "/color-tools", "/blog", "/pricing", "/audit",
  ...TOOLS.map((t) => t.href),
  ...BLOG_POSTS.map((p) => `/blog/${p.slug}`),
  "/palettes",
  ...PALETTE_THEMES.map((t) => `/palettes/${t.slug}`),
  ...GALLERY_PALETTES.map((p) => `/palettes/${p.theme}/${p.slug}`),
  "/colors",
  ...NAMED_COLORS.map((c) => `/colors/${c.slug}`),
  "/brands",
  ...BRAND_PALETTES.map((b) => `/brands/${brandSlug(b.name)}`),
]);

const hard = [];
const warn = [];
const ok = [];
const fail = (m) => hard.push(m);
const notice = (m) => warn.push(m);

/* ------------------------------------------------------------------ */
/* 1. Registry inventory                                               */

console.log(`\n${"─".repeat(72)}\nREGISTRY INVENTORY\n${"─".repeat(72)}`);
console.log(`tools: ${TOOLS.length}   posts: ${BLOG_POSTS.length} (live ${livePosts().length})`);

const entries = [
  { url: "/", title: null, description: null, kind: "hub" },
  { url: "/design-system", title: null, description: null, kind: "hub" },
  { url: "/tools", title: null, description: null, kind: "hub" },
  { url: "/color-tools", title: null, description: null, kind: "hub" },
  { url: "/blog", title: null, description: null, kind: "hub" },
  { url: "/pricing", title: null, description: null, kind: "hub" },
  ...TOOLS.map((t) => ({ url: t.href, title: t.metaTitle, description: t.description, kind: "tool" })),
  ...livePosts().map((p) => ({ url: `/blog/${p.slug}`, title: p.metaTitle, description: p.description, kind: "post" })),
];

const rendered = (entry) => (entry.kind === "hub" ? entry.title : entry.title + TEMPLATE_SUFFIX);

for (const key of ["title", "description"]) {
  const seen = new Map();
  for (const entry of entries) {
    const value = key === "title" ? rendered(entry) : entry.description;
    if (!value) continue;
    seen.set(value, [...(seen.get(value) ?? []), entry.url]);
  }
  const dupes = [...seen.entries()].filter(([, urls]) => urls.length > 1);
  if (dupes.length) {
    for (const [value, urls] of dupes) fail(`duplicate ${key}: ${urls.join(", ")}  ::  "${value.slice(0, 70)}"`);
  } else {
    ok.push(`no duplicate ${key}s across ${entries.length} routes`);
  }
}

const longTitles = entries.filter((e) => e.title && rendered(e).length > TITLE_LIMIT);
const longDescs = entries.filter((e) => e.description && e.description.length > DESC_LIMIT);
notice(`${longTitles.length}/${entries.filter((e) => e.title).length} titles render over ${TITLE_LIMIT} chars (template adds ${TEMPLATE_SUFFIX.length})`);
notice(`${longDescs.length} descriptions over ${DESC_LIMIT} chars`);

const thinIntros = TOOLS.filter((t) => t.intro.join(" ").length < 250);
const fewFaqs = TOOLS.filter((t) => t.faqs.length < 3);
if (thinIntros.length) notice(`${thinIntros.length} tools with an intro under 250 chars`);
if (fewFaqs.length) notice(`${fewFaqs.length} tools with fewer than 3 FAQs`);
if (!thinIntros.length && !fewFaqs.length) ok.push("every tool has a substantial intro and 3+ FAQs");

const dangling = new Map();
const note = (href, from) => {
  const path = href.split(/[?#]/)[0];
  if (!path.startsWith("/") || REGISTRY_ROUTES.has(path)) return;
  dangling.set(path, [...(dangling.get(path) ?? []), from]);
};
for (const post of BLOG_POSTS) {
  for (const href of post.relatedHrefs) note(href, `post:${post.slug}`);
  for (const section of post.sections) {
    for (const link of section.links ?? []) note(link.href, `post:${post.slug}`);
    for (const bullet of section.bullets ?? []) if (typeof bullet !== "string") note(bullet.href, `post:${post.slug}`);
  }
}
if (dangling.size) for (const [path, froms] of dangling) fail(`dangling internal link ${path} (from ${[...new Set(froms)].join(", ")})`);
else ok.push("no dangling internal links");

/* ------------------------------------------------------------------ */
/* 2. Served HTML                                                      */

const decode = (s) =>
  s === null ? null : s.replace(/&amp;/g, "&").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, "/");
const grab = (html, re) => (html.match(re) ? decode(html.match(re)[1].trim()) : null);

const TARGETS = [
  "/", "/design-system", "/tools", "/color-tools", "/blog", "/pricing", "/audit",
  "/palettes",
  ...TOOLS.map((t) => t.href),
  ...livePosts().map((p) => `/blog/${p.slug}`),
  ...PALETTE_THEMES.map((t) => `/palettes/${t.slug}`),
  ...GALLERY_PALETTES.map((p) => `/palettes/${p.theme}/${p.slug}`),
  "/colors",
  ...NAMED_COLORS.map((c) => `/colors/${c.slug}`),
  "/brands",
  ...BRAND_PALETTES.map((b) => `/brands/${brandSlug(b.name)}`),
];

console.log(`\n${"─".repeat(72)}\nSERVED HTML  (BASE ${BASE})\n${"─".repeat(72)}`);

const seenTitles = new Map();
let fetched = 0;
let redirects = 0;

for (const path of TARGETS) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  } catch (error) {
    fail(`${path}: fetch failed — ${error}`);
    continue;
  }

  if (res.status >= 300 && res.status < 400) {
    const to = res.headers.get("location");
    redirects += 1;
    if (res.status !== 308 && res.status !== 301) notice(`${path}: ${res.status} (expected a permanent 301/308) → ${to}`);
    if (REGISTRY_ROUTES.has(path)) notice(`${path}: is in the expected route set but redirects to ${to}`);
    continue;
  }
  if (res.status !== 200) {
    fail(`${path}: HTTP ${res.status}`);
    continue;
  }

  fetched += 1;
  const html = await res.text();
  const title = grab(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = grab(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical = grab(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const robots = grab(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];

  // The invariant that matters most: an indexable page must canonicalise to
  // itself, not to some other URL.
  const selfUrl = `${siteUrl}${path === "/" ? "" : path}`;
  if (!canonical) {
    fail(`${path}: no canonical`);
  } else if (canonical.replace(/\/$/, "") !== selfUrl.replace(/\/$/, "")) {
    fail(`${path}: canonical is ${canonical} (expected ${selfUrl})`);
  }

  if (!description) fail(`${path}: no meta description`);
  if (h1s.length !== 1) fail(`${path}: ${h1s.length} h1 elements`);
  if (title && (title.length > TITLE_LIMIT || (description && description.length > DESC_LIMIT))) {
    notice(`${path}: title ${title?.length ?? 0} / description ${description?.length ?? 0}`);
  }
  if (title) {
    const prev = seenTitles.get(title);
    if (prev) fail(`duplicate served title on ${prev} and ${path}`);
    else seenTitles.set(title, path);
  }
  if (robots && /noindex/i.test(robots) && !/\/audit|\/brands/.test(path)) {
    notice(`${path}: served noindex`);
  }
}

console.log(`fetched ${fetched} pages, skipped ${redirects} redirects`);

/* ------------------------------------------------------------------ */
/* Verdict                                                             */

console.log(`\n${"─".repeat(72)}\nRESULT\n${"─".repeat(72)}`);
for (const line of ok) console.log(`  ok    ${line}`);
for (const line of warn) console.log(`  warn  ${line}`);
for (const line of hard) console.log(`  FAIL  ${line}`);
console.log(`\n${hard.length} hard failures, ${warn.length} warnings`);
process.exit(hard.length ? 1 : 0);
