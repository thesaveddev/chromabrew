# Chromabrew SEO Growth — Phase 1 Audit

**Date:** 12 October 2026
**Scope:** indexability, metadata, structured data, internal linking, content depth, and search-intent alignment across every indexable route.
**Method:** the live app was rendered and the served HTML inspected directly. Nothing below is inferred from reading source alone — every finding carries the exact value the server emitted and the URL it was measured on. The audit pass itself changed no application code; the fixes listed at the end came after, and each was re-measured against the production build.

## How the evidence was gathered

| Step | What it establishes |
| --- | --- |
| `/sitemap.xml` and `/robots.txt` fetched from the running app | the crawl surface as a crawler sees it |
| 17 routes fetched with redirects **not** followed, raw HTML parsed | served `<title>`, description, canonical, `robots`, H1 count, JSON-LD types |
| Registry modules imported and measured (`TOOLS`, `BLOG_POSTS`) | 61-URL metadata inventory: duplicates, truncation, depth |
| Every internal link target resolved against the route set | broken-link and redirect-waste check |
| Prose probes on raw HTML | confirms content is present without JavaScript |

Harness: [`scripts/seo-audit.mjs`](../scripts/seo-audit.mjs) — re-runnable against this app or a deployed origin, so Phase 6 can diff before and after.

## Inventory

- **20** tools in the registry, across 4 categories (color, converter, css, image).
- **43** blog posts defined, **34** live (9 future-dated and correctly withheld).
- **61** URLs in the sitemap: 7 hubs + 20 tools + 34 posts.
- `robots.txt` is correct: `Allow: /`, disallows `/api/`, `/account`, `/projects`, and declares the sitemap.
- Three legacy converter paths (`/tools/hex-to-rgb`, `/tools/rgb-to-hex`, `/tools/hex-to-hsl`) and `/brands` return **308** to a single consolidated URL, are absent from the sitemap, and have **no internal links** pointing at them. This is exactly right.

## Findings, highest impact first

### 1. `/audit` is a self-canonicalised orphan — it cannot rank despite being in the sitemap
**Severity: critical** · **URL: https://chromabrew.com/audit**

Three signals contradict each other:

```
<title>Website Audit - Chromabrew · ChromaBrew</title>
<link rel="canonical" href="https://chromabrew.com"/>     ← the homepage
<meta name="robots" content="index"/>
sitemap.xml: /audit   priority 0.8
```

- The canonical points at the **home page**, so Google will consolidate `/audit` into `/`. A `robots: index` directive does not override a canonical that names a different URL.
- The page is **orphaned**: the only internal link to it anywhere in the app is from `/r/[token]`, which is itself `noindex`. Neither the header, the footer, the tools index, nor the home page links to it.
- Cause: `src/app/audit/page.tsx` declares `robots: { index: true }` but sets no `alternates`, so it inherits `alternates: { canonical: "/" }` from the root layout.

**Impact:** a working, linkable, genuinely useful tool is invisible to organic search. **Fix:** give `/audit` its own canonical, and link it from at least the tools index and the footer.

### 2. `/audit` renders the brand twice, and mis-cases it
**Severity: high** · **URL: https://chromabrew.com/audit**

Served: `<title>Website Audit - Chromabrew · ChromaBrew</title>`

The page's literal title already contains a brand suffix, and the root layout's `title.template: "%s · ChromaBrew"` appends a second one. It also spells the brand **"Chromabrew"** where the rest of the site uses **"ChromaBrew"**. **Fix:** set a bare title (`Website Audit — accessibility & design scanner`) and let the template add the brand once.

### 3. 51 of 61 titles exceed the ~60-character truncation point — the brand suffix is what gets cut
**Severity: high (systemic)** · **URLs: all tool and post pages**

Every tool `metaTitle` is deliberately tuned to 48–64 characters, but the layout appends `· ChromaBrew` (+13). The result is that **20 of 20 tool pages and 31 of 34 posts** render over the limit:

| Rendered length | URL |
| --- | --- |
| 77 | `/blog/brand-color-palettes` |
| 77 | `/blog/types-of-color-blindness` |
| 76 | `/tools/css-gradient-generator` |
| 75 | `/tools/shadcn-theme-generator` |
| 73 | `/tools/color-names`, `/tools/tailwind-color-generator`, `/tools/typography-scale-generator` |

**Impact:** the distinguishing words survive, but the brand is truncated away on the majority of URLs — a sitewide loss of brand reinforcement in every SERP impression. **Fix options below** (this is a sitewide appearance change, so it is the one decision worth taking deliberately).

### 4. Home page and metadata position Chromabrew as *only* a one-colour design-system generator
**Severity: high (brief-aligned)** · **URL: https://chromabrew.com/**

- Title: `ChromaBrew — Free Color Palette Generator & Design System Tool`
- H1: `Turn one color into an entire design system.`
- OG description: `Turn one color into a complete design system…`
- OG image alt: `ChromaBrew — turn one color into an entire design system`

The brief states directly: *"Do not position it exclusively as a single-colour-to-design-system generator."* The site actually ships 20 tools spanning colour theory, WCAG accessibility, design tokens, CSS generation, **raster/vector image conversion**, and typography. None of that breadth appears in the home title or H1.

**Fix:** widen the title and H1 to name the toolkit (colour tools *and* accessibility *and* CSS/token exports) rather than the single pipeline, keeping the generator as the primary CTA.

### 5. `/tools` and `/color-tools` compete for the same intent
**Severity: medium** · **URLs: https://chromabrew.com/tools, https://chromabrew.com/color-tools**

Both pages are indexable, both list the *same* colour tools with the *same* `blurb` text, and both target "free color tools":

| | `/tools` | `/color-tools` |
| --- | --- | --- |
| H1 | Free color & design token tools | Color tools |
| Title | Free Color Tools — Palette & Contrast Checker | Color Tools — Palettes, Contrast, Names & Converters |
| Lists | all 20 tools, by category | 17 colour tools, curated shelf |

`/tools` also links to `/color-tools` as "color tools hub", and `/color-tools` links back to `/tools` three times. This is the classic hub-vs-index overlap the brief asks to prevent. **Fix:** give them genuinely different jobs — e.g. `/tools` as the complete directory by category, `/color-tools` narrowed to a task-oriented "which colour tool do I need" chooser — or consolidate one into the other with a redirect.

### 6. Every sitemap URL claims it changed at the moment of deploy
**Severity: medium** · **URL: https://chromabrew.com/sitemap.xml**

All **61** entries share one `lastmod` — `2026-10-12T09:12:23.619Z`, the build timestamp — and one `changefreq` (`monthly`). Source: `const buildDate = new Date()` in `src/app/sitemap.ts`.

**Impact:** `lastmod` that moves on every deploy without content changing is the documented case Google learns to ignore, and it throws away the strongest recrawl signal for the URLs that genuinely do change. **Fix:** real per-URL dates — `updatedAt`/`publishedAt` for posts, and omit `lastmod`/`changeFrequency` where no honest date exists rather than stamping a false one.

### 7. 18 descriptions exceed the ~160-character truncation point
**Severity: medium** · worst: **`/tools/color-blindness-simulator` at 257 characters**

| Length | URL |
| --- | --- |
| 257 | `/tools/color-blindness-simulator` |
| 212 | `/tools/typography-scale-generator` |
| 208 | `/blog/secondary-and-accent-colors-in-a-design-system` |
| 202 | `/blog/one-color-to-a-working-design-system` |
| 194 | `/color-tools` |

**Fix:** trim to ≤160 with the value proposition in the first 120 characters.

### 8. `/color-tools` "Other tool areas" — three cards, one destination, broken titles
**Severity: low (real defect)** · **URL: https://chromabrew.com/color-tools**

The section builds cards for `converter`, `css` and `image`, but every card's `href` is hardcoded to `"/tools"`, and the titles are generated by `${categoryLabel(category)} tools`, rendering **"Converters tools"**, **"CSS & tokens tools"** and **"Image tools tools"**. **Fix:** point each card at a representative tool and fix the label.

### 9. Stale counts: "15+" where the site ships 20 tools
**Severity: low** · **URLs: https://chromabrew.com/tools, footer on every page**

The `/tools` description and the sitewide footer both say "15+ free color tools" / "15+ developer utilities". There are 20. **Fix:** derive the number from `TOOLS.length` so it cannot go stale again.

### 10. Home canonical and sitemap disagree on the trailing slash
**Severity: low** · **URL: https://chromabrew.com/**

Canonical emits `https://chromabrew.com`; the sitemap lists `https://chromabrew.com/`. Two spellings of one URL across the two signals. **Fix:** make them identical.

### 11. `Article` structured data has no `image` on posts without a hero
**Severity: low** · **URLs: posts lacking a `hero` image**

`src/app/blog/[slug]/page.tsx` conditionally omits `image`, and `publisher` carries no `logo`. Google lists image as a recommended Article property. **Fix:** fall back to the site OG image.

## What is already correct (not findings)

Recorded so the list above is not mistaken for a general indictment:

- **Zero** duplicate titles and **zero** duplicate descriptions across all 61 real routes.
- **Zero** broken internal links — every `relatedHrefs` target and every in-article link resolves.
- **Zero** thin tool pages: all 20 have an intro over 250 characters and at least 3 FAQs.
- **Zero** tools lacking a topical blog link, and **zero** duplicated FAQ questions across tools.
- **No** `<img>` without `alt`.
- **Server rendering is sound.** For `/tools/contrast-checker` and `/tools/color-mixer`, the H1, intro, usage steps and full FAQ text are all present in the initial HTML with JavaScript disabled — the tool prose is fully crawlable.
- **JSON-LD is consistent with visible content.** `/tools/contrast-checker` emits exactly one `FAQPage` with 3 `Question` entities matching the 3 rendered FAQs, plus `WebApplication`, `BreadcrumbList`, `WebSite` and `Organization`. Posts emit `Article` + `BreadcrumbList`.
- `robots.txt` disallows the private surfaces correctly, and the redirect stubs are neither sitemapped nor linked.

## A note on FAQ rich results

20 tool pages and `/design-system` emit `FAQPage` markup. Google restricted FAQ rich results to a small set of authoritative government and health sites in 2023, so Chromabrew should **not** expect a FAQ SERP feature from this markup. It is not harmful, and the value is real — it is the same genuine Q&A content that is rendered on the page — but it should not be counted as a rich-result win.

## Prioritised fix plan

| # | Fix | Impact | Effort | Risk | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | `/audit` canonical + internal links | High | XS | Low | **Done** |
| 2 | `/audit` title (dedupe brand, fix casing) | High | XS | Low | **Done** |
| 3 | Title strategy for the 51 over-length titles | High | S | **Decision needed** | Open |
| 4 | Home title/H1 breadth (brief alignment) | High | XS | Low | **Done** |
| 5 | Real `lastmod`/`changefreq` in sitemap | Medium | S | Low | **Done** |
| 6 | Trim 18 long descriptions | Medium | S | Low | Open |
| 7 | `/tools` vs `/color-tools` intent split | Medium | M | **Decision needed** | Open |
| 8 | `/color-tools` card hrefs + labels | Low | XS | Low | **Done** |
| 9 | Derive "15+" counts from the registry | Low | XS | Low | **Done** |
| 10 | Home canonical/sitemap slash parity | Low | XS | Low | **Done** |
| 11 | `Article.image` fallback | Low | XS | Low | **Done** |

**Baseline:** no Search Console data was available in this environment, so the baseline in Phase 6 must be captured from the account before the first deploy. Everything above is measured from the served site, not from Search Console.

## Fixes implemented

Each change below was re-measured on the production build (`next start`), not just in dev.

| File | Change |
| --- | --- |
| `src/app/audit/page.tsx` | Own canonical, bare title the layout template brands once |
| `src/components/site/footer.tsx` | Sitewide link to `/audit`; tool count derived from the registry |
| `src/app/sitemap.ts` | Real post dates only; no build stamp; no `changeFrequency`; home URL matches its canonical |
| `src/app/color-tools/page.tsx` | "Other tool areas" cards open their own tools, with corrected labels |
| `src/app/tools/page.tsx` | Tool count derived from the registry |
| `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/opengraph-image.tsx`, `src/lib/og.ts` | Home title, description and h1 name the toolkit breadth, not only the one-color pipeline; OG artwork and alt text follow |
| `src/app/blog/[slug]/page.tsx` | `Article.image` always present |
| `src/app/sitemap.test.ts` | New — locks in the date and URL invariants |
| `e2e/critical-workflow.spec.ts` | Assertions updated for the new h1, and repaired for a heading relabel that had already broken this test |

### Verification (production build)

- `npm run build` — exit 0, 85 pages, no warnings; every tool page prerendered as static HTML.
- `npm test` — 353 passed, 6 skipped.
- `npm run typecheck` — clean. `eslint` — clean on all changed files.
- `npm run seo:audit` — **0 hard failures** against dev and against the production build.
- `npx playwright test e2e/critical-workflow.spec.ts --project=chromium` — 2/2.

### Known limitation

The critical-workflow e2e assertion was failing before these changes: an uncommitted edit had relabelled the design-system heading from "Design system" to "Design system generator" without updating the test. The copy is correct, so the stale assertion was repaired rather than the label reverted. Playwright was run on chromium only, at a single 1440×900 viewport — mobile is not yet evidenced.
