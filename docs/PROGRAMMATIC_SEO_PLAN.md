# Programmatic SEO — URL architecture for indexable design systems and collections

**Phase 12 of the roadmap.** This is a design document, not a record of work
done — per `ROADMAP.md`, phases are implemented only when explicitly
authorised. It answers: *given the surfaces that already exist, which URLs
become indexable, which stay out, and what gates a page before it enters the
sitemap?*

Grounding: the 19 October 2026 SEO audit fixes (`SEO_AUDIT.md` second pass)
made every existing template serve a self-canonical URL, one `h1`, a unique
title ≤ 60 characters rendered, and a description ≤ 160. That invariant is the
admission price for any new family below — not a per-page aspiration.

## 1. What exists today

| Family | URLs | Indexable now | Template status |
| --- | --- | --- | --- |
| Hubs (7) | `/`, `/design-system`, `/generate`, `/tools`, `/color-tools`, `/blog`, `/audit`, `/pricing` | yes | invariants hold |
| Tools | 20 × `/tools/[slug]` | yes | invariants hold |
| Posts | 37 live × `/blog/[slug]` | yes | invariants hold |
| Palette themes (collections) | 10 × `/palettes/[theme]` | yes | invariants hold (clamped) |
| Gallery palettes | ~43 × `/palettes/[theme]/[palette]` | yes | invariants hold (clamped) |
| Named colors | 37 × `/colors/[slug]` | yes | invariants hold (clamped) |
| Brand colors | 98 × `/brands/[slug]` | **no** — served `noindex` deliberately | fine |
| Public projects | `/p/[id]` | **no** — `robots: { index: false }` in `src/app/p/[id]/page.tsx` | n/a while noindex |
| Community gallery | `/gallery` | **no** — `robots: { index: false, follow: true }`, "stays out of search results for now" | n/a while noindex |
| Generator state | `/design-system?primary=…` etc. | not in sitemap; query-state only | never indexable |
| Share/audit tokens | `/r/[token]` | `noindex, nofollow` | correct |

## 2. Principles (from the research behind this plan)

1. **Index stable artifacts, never app state.** A URL earns an index entry by
   being a distinct thing a person can land on from search — a saved design
   system, a curated palette, a named color — not every permutation the
   generator can produce. `/design-system?primary=%23ff0000` is one page with
   infinite query states; it stays out.
2. **One query intent per URL.** The `/tools` vs `/color-tools` overlap in the
   audit is the cautionary tale: two indexable pages competing for the same
   words waste crawl and split signals. Before adding a family, name the
   query it owns and confirm no existing page already owns it.
3. **Scaled content is a policy risk, not just a quality risk.** Google's
   spam policies prohibit scaled content produced primarily to manipulate
   rankings. Every family below ships with a hand-reviewed pilot set first
   and expands only against measured demand (`Search Console` impressions),
   never against a URL quota.
4. **A sitemap advertises, it does not convince.** Submission gets a URL
   crawled; quality and internal links get it indexed. Every new family needs
   a hub link path, not just a sitemap entry.
5. **The audit harness is the gate.** `npm run seo:audit` fails hard on
   duplicate titles/descriptions, self-canonical violations, missing
   descriptions, extra `h1`s, and dangling internal links. Any new family must
   be added to its `REGISTRY_ROUTES`/`TARGETS` lists and pass.

## 3. The new families

### 3a. Public design systems — `/p/[id]` (the headline change)

This is the Coolors-equivalent move: shareable systems become crawlable
artifacts, so "saaS dashboard color palette" style queries can land on a real
generated system instead of only on editorial content.

**Design:**

- Private projects stay `noindex` unconditionally — non-negotiable.
- Public projects become indexable **only when every gate in §4 passes**; the
  default for a freshly-flipped `visibility: public` remains `noindex` until
  the gates are evaluated. `generateMetadata` decides per request (the route
  is dynamic, so a project can move both directions without redeploys).
- The id stays opaque (`/p/[id]`). Pretty slugs are not worth a slug-namespace
  collision table yet; if a slug is ever added, the id URL 301s rather than
  co-serving.
- Titles/descriptions compose from data, so they go through
  `clampDescription()` (already unit-tested): title
  `"${project.name} — Free Design System · ChromaBrew"`-shaped but measured at
  render; description leads with the primary hue and the palette strategy,
  then the user's own description sentence.
- A project that fails a gate is still reachable (linkable, shareable) — the
  gate controls the `<meta name="robots">`, not access.

**Gates (all must hold):**

1. `visibility === "public"` and `listedInGallery` (the user already opted in
   twice — profile visibility is not search consent by itself).
2. `name` and `description` both set, description ≥ 60 characters — the
   fallback `"Design system: ${name}"` is thin by construction.
3. Config completeness: primary valid, at least one saved version, not the
   default config (a shared "I clicked generate once" system is thin).
4. Age: `createdAt` ≥ 7 days old — kills throwaway spam factories and gives
   the owner time to delete before Googlebot returns.
5. Uniqueness: config hash not equal to any other publicly indexable project
   (cheap dedupe against clone-spam).
6. The project is linked from `/gallery` (if listed) — orphan pages don't get
   indexed anyway; this just makes the requirement explicit.

**Rollout:** flip the metadata logic behind the gates first with everything
still `noindex` in practice, then enable indexing for gate-passing projects
only after the Search Console baseline (§6) exists. Revoke by setting
`visibility` private — the next render serves `noindex`.

**Implemented (Stage B, 19 October 2026):** the gates live in
`src/lib/project-indexing.ts` (pure, DB-free — the page resolves the clone
query and passes it in), unit-tested in `src/lib/project-indexing.test.ts`.
`/p/[id]`'s `generateMetadata` now computes the verdict, sets its own
canonical (it previously inherited `/` from the root layout — the same defect
as the audit's `/audit` finding), and clamps its title/description to the
sitewide budgets. Indexing itself stays off: `PROJECT_INDEXING` is unset, and
`projectIndexingEnabled()` only accepts the literal `"true"`, so Stage C is a
configuration flip with no code change.

### 3b. `/gallery` — the index of public projects

Keep `/gallery` itself `noindex` for now: it is a paginated listing whose
content duplicates its children (`/p/[id]`). Children are the unit that
should rank. Revisit only if the gallery gains genuinely unique browsing copy
per filter — and then filters must get distinct URLs first (§2.2).

### 3c. Curated collections — extend the `/palettes/[theme]` pattern

The theme + gallery-palette family already demonstrates the working pattern:
hub (`/palettes`) → collection (`/palettes/[theme]`) → artifact
(`/palettes/[theme]/[palette]`), each with honest `lastmod` and internal links
both directions.

**Do next:** nothing by default. The next collections should be
demand-led — e.g. only if Search Console shows unmined query clusters like
"healthcare website color palette" should a hand-written
`/palettes/for-[use-case]` collection enter the roadmap. One real collection
with a hand-written intro beats fifty generated ones with a swapped noun.

### 3d. `/brands/[slug]` — stays `noindex`, deliberately

Brand pages overlap the `/tools/brand-palettes` tool and each other
(one color per brand; widely-published values are not unique content). The
harness already treats their `noindex` as expected. Re-evaluate only if the
pages grow original measurement content (per-brand contrast analysis on
generated systems) worth ranking.

### 3e. Explicitly never indexable

- `/design-system?*`, `/generate?*` — generator state.
- `/r/[token]` — ephemeral share reports.
- `/account`, `/projects`, `/api/*`, auth routes — already disallowed in
  `robots.txt`.
- Any future filter/search parameter: give it a URL before giving it an index
  intention, otherwise canonicalize to the unfiltered hub.

## 4. Template invariants for any new page

Re-checked by `scripts/seo-audit.mjs`, which must gain the new routes:

- Rendered title ≤ 60 chars **including** the ` · ChromaBrew` suffix (page
  `metaTitle` ≤ 47).
- Meta description ≤ 160 — data-composed text goes through
  `clampDescription()` (`src/lib/meta.ts`).
- Exactly one `h1`, one self-referential canonical, one description.
- Unique title *and* description across the whole sitemap — the harness fails
  hard on collisions.
- JSON-LD only for content the page visibly renders; no FAQ schema
  expectations for rich results.
- Honest `lastmod`: content timestamps only, never a build stamp (the audit
  caught that once already; `src/app/sitemap.test.ts` locks it).

## 5. Internal linking rules

- Every indexable artifact reachable from its family hub in ≤ 2 clicks, and
  the family hub linked from the site header or footer (the `/audit` orphan
  incident is the precedent to avoid).
- Related-module footers (already present on posts, colors, palettes) are the
  crawl glue — new families get one: related systems, sibling palettes, or
  "seed this into the generator" links.
- No indexable page may be reachable *only* from a `noindex` page.

## 6. Measurement (the prerequisite everyone skips)

1. **Capture the Search Console baseline before the first flip** — the audit
   already flagged that none was available. Needed: total indexed count,
   per-family coverage, top queries.
2. Track per family: submitted (sitemap) vs indexed (coverage), impressions
   and clicks per template group, and average position for the family's head
   query.
3. Pruning rule: a gate-passing `/p/[id]` or collection page that shows **zero
   impressions after 90 days** gets reviewed — demoted back to `noindex` or
   improved. Index bloat costs crawl budget and dilutes the site's quality
   profile.
4. `npm run seo:audit` runs against production after every deploy that touches
   metadata (`BASE=https://chromabrew.com npm run seo:audit`).

## 7. Phased rollout

| Stage | Work | Gate to proceed |
| --- | --- | --- |
| A | Search Console property + baseline capture | baseline exists |
| B | **DONE (19 Oct 2026)** — `/p/[id]` metadata computes gates (`src/lib/project-indexing.ts`); `PROJECT_INDEXING` switch off, all projects noindex in practice | ✅ typecheck, 19 unit tests, full suite green |
| C | Enable indexing for gate-passing public projects; add them to sitemap | 2 weeks of coverage data with no crawl errors |
| D | Demand-led collections from real Search Console queries | an actual unowned query cluster appears |
| E | Re-evaluate `/gallery` and `/brands` | only with new unique content, not sooner |

Stages are implemented only when explicitly authorised, per `ROADMAP.md`.
