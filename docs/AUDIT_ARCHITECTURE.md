# Audit architecture (Chromabrew Premium)

This document is the architecture record for Chromabrew Premium — a website
design and accessibility audit built as a second product on top of the existing
design-system generator. It records what the repository actually contains, what
Stages 1 and 2 implement, what is deliberately absent, and which decisions are
still open.

It supersedes `docs/AUDIT_PREMIUM_PLAN.md` as the architecture record; that file
remains the original stage-by-stage planning note.

## Status

| Stage | Name                                   | Status |
| ----- | -------------------------------------- | ------ |
| 0     | Repository audit and architecture plan | COMPLETE (this document) |
| 1     | Premium interface and single-page scan | IMPLEMENTED |
| 2     | Deterministic analysis engine          | IMPLEMENTED |
| 3     | AI visual design analysis              | NOT STARTED — no provider configured (see *Existing AI integrations*) |
| 4     | Actionable fixes and design-system generation | PARTIAL — deterministic contrast and metadata fixes implemented; token generation not started |
| 5     | Before-and-after previews              | NOT STARTED |
| 6     | Multi-page crawling                    | NOT STARTED |
| 7     | Reports, accounts and premium billing  | PARTIAL — shareable report links implemented; metering, history and billing not started |
| 8     | Historical comparisons and monitoring  | NOT STARTED |

Stages 5-8 do not exist in the repository: no preview rendering, no crawling, no
billing and no history view have been written. Links *are* discovered and stored
(Stage 2), but nothing crawls them until Stage 6. Stage 3 does not exist either
because no model provider is configured anywhere in the project, and Stage 4 is
half done: the deterministic half — contrast and metadata fixes, each one
re-measured before it is offered — is implemented and described below, while
turning observed colours into editable design-system tokens is not.

The Phase 1 audit this document represents was re-run after Stage 2 and the fix
generator landed. Its findings are recorded in *Current state audit* below,
including one that had to be repaired before the build would pass again.

## Current state audit

### Stack

| Concern | What the repository uses |
| ------- | ------------------------ |
| Framework | Next.js 16.3.2 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` |
| Database | PostgreSQL through Prisma 7 with `@prisma/adapter-pg`; all models live in the `chromabrew` schema (`prisma/schema.prisma`, `src/lib/db.ts`) |
| Auth | Auth.js v5 (`next-auth`), GitHub + Google + credentials, JWT sessions, Prisma adapter (`src/lib/auth/config.ts`) |
| Payments | Stripe (`src/app/api/stripe/*`) with plan gating in `src/lib/entitlements.ts` and `src/lib/entitlements-server.ts` |
| Email | Resend (`src/lib/mail.ts`) |
| Analytics | `@vercel/analytics`, loaded only when `process.env.VERCEL` is set (`src/app/layout.tsx`) |
| Unit tests | Vitest, `src/**/*.test.ts`, `npx vitest run` |
| Browser tests | Playwright, `e2e/*.spec.ts`, `npm run test:e2e` against a production build |

### Deployment and operations

Deployment is Vercel. Two things in the repository prove the target and its
constraints:

- `src/app/layout.tsx` renders `<Analytics />` only when `process.env.VERCEL` is
  truthy, so Vercel is the production host and local development is silent.
- `.github/workflows/publish-posts.yml` runs on a cron schedule and calls a
  `VERCEL_DEPLOY_HOOK_URL` secret to trigger a production rebuild — there is no
  other deployment automation.

`docs/ARCHITECTURE.md` records that database migrations are applied by hand on
the VPS with `npx prisma migrate deploy`. There is no queue, no worker process
and no scheduled job runner inside the application.

### What existed before this work

The audit feature had no code. What it can build on:

- A pure, tested design-system engine under `src/lib/design-system/`, including
  `colour/contrast.ts` with WCAG ratio maths and `fixContrast()`, and a
  colour-vision-deficiency simulation in `colour/cvd.ts`.
- A registry-based export adapter pattern (`exports/registry.ts`) that turns a
  `DesignSystem` into CSS, DTCG JSON, Tailwind, shadcn and others.
- A tool-page shell (`src/components/tools/tool-shell.tsx`) that renders a
  heading, usage steps, FAQ and JSON-LD consistently.
- Shared UI primitives (`src/components/ui/primitives.tsx`: `Button`,
  `LinkButton`, `CopyButton`, `DownloadButton`, `TabList`) and a `JsonLd`
  helper (`src/components/site/json-ld.tsx`).
- SEO plumbing: `src/app/sitemap.ts`, `src/app/robots.ts`, generated OG images.

There was no rate limiting anywhere in the codebase before this change; the
audit quota described below is the first abuse control in the project.

### Existing AI integrations

The brief requires the repository to be inspected for AI integrations *before*
any provider, SDK or dependency is introduced, and requires AI to be reported as
implemented only when a real provider has been configured and tested end to end.
The audit result is unambiguous, and worth stating plainly rather than quietly
building around:

- **No model provider is integrated.** `package.json` contains no `openai`,
  `anthropic`, `@google/generative-ai`, `groq` or Vercel AI SDK dependency, and no
  provider SDK appears in a single source file.
- **No model credentials exist.** The environment variables the application reads
  are Auth.js (`AUTH_SECRET`, GitHub, Google), Stripe, Resend, `DATABASE_URL`,
  `SITE_URL`, the audit worker's own settings and `FEEDBACK_NOTIFY_TO`. There is no
  `*_API_KEY` for a model, in `.env.example` or in `src/`.
- **The one feature named "AI" is not one.** `/api/ai/palette-suggestion` — the
  endpoint behind the generator panel titled *AI Palette Suggestion* — maps brand
  keywords to hue ranges through a constant table and, failing that, hashes the
  description into a hue. Its own module comment is explicit: *"No LLM API
  required — works entirely offline."* It is a deterministic heuristic, and it
  performs no visual or contextual reasoning of any kind.

Two consequences follow, and both are requirements rather than observations:

1. There is nothing to reuse. Stage 3 starts from an empty page: a backend-only
   provider abstraction, a selected provider, vision-capable model configuration,
   schema validation, and the metering, timeouts and cost accounting that a
   paid-for call needs.
2. Until such a provider is configured *and* tested end to end, the honest state
   is "unavailable". The deterministic scanner must stay fully operational with
   no model present, the interface must say that AI-assisted design analysis is
   unavailable rather than degrading silently, and no report may imply an AI
   finding exists. The existing `AI Palette Suggestion` label on a heuristic is
   the same class of overstatement, in the free tools, and is recorded here as a
   known inaccuracy to correct rather than left to be rediscovered.

### A regression repaired during this audit

An audit that only reads is worth less than one that runs the build. Doing so
turned up a half-finished rewrite of `src/lib/audit/url-validator.ts` that had
replaced the SSRF gate with a weaker reimplementation — synchronous redirect
checking with no DNS re-validation, IP classification collapsed to
public/private, and no injectable resolver. It broke 40 typecheck references
across the module's five callers and its own suite, and, more seriously, it would
have followed a redirect to `http://169.254.169.254/`. The gate was restored to
the contract the test suite and every caller already describe; the suite that
specifies it (28 tests) passes again, and `npx tsc --noEmit` is clean. The lesson
recorded for the rest of this programme: **the SSRF rules are specified by
`url-validator.test.ts`, and that file is the thing to trust when two versions of
the validator disagree.**

## What Stage 1 implements

Stage 1 delivers a complete single-page workflow: submit a URL, the job runs
outside the request, real progress is reported, and results persist.

Its analysis is a **fetch-and-parse** pipeline. There is no browser and no
JavaScript execution, so anything the server does not put in the served HTML is
invisible to it.

Stage 2 supersedes this as the *default* path (see the next section). The fetch
pipeline is still here, and is what runs when the browser cannot: every scan
records which pipeline produced its findings, and a fetch-only scan states that
computed styles, contrast, links and axe-core were not measured.

### Modules

| File | Responsibility |
| ---- | -------------- |
| `src/lib/audit/types.ts` | Client-safe vocabulary: scopes, viewports, stages, statuses, severities, categories, DTOs and the numeric limits |
| `src/lib/audit/url-validator.ts` | SSRF gate: `classifyIp`, `isIpLiteral`, `assertAllowedUrlSyntax`, `resolveAndAssertPublic`, `validateScanUrl`, `assertSafeRedirect`, `UrlValidationError` |
| `src/lib/audit/analyzer.ts` | `extractPageFacts` (pure HTML fact extraction), `analyzePageFacts` (pure rules), `fetchPageSafely` (guarded I/O) and `analyzeUrl` |
| `src/lib/audit/runner.ts` | Job lifecycle: `enqueueScan`, `runScan`, `runClaimedScan`, `claimNextScan`, `runQueuedScan`, `recoverStaleScans` |
| `src/lib/audit/rate-limit.ts` | `checkScanQuota`, `hashIp`, `clientIpFromHeaders` |
| `src/lib/audit/queries.ts` | Read-side DTO mapping: `getScanStatusDto`, `getScanResultsDto` |
| `src/lib/audit/url-validator.test.ts`, `src/lib/audit/analyzer.test.ts` | Unit coverage for every rejection path, guard rail and rule |

### Rules that run

The catalogue is exported as `AUDIT_RULES` so the report can state its own
coverage rather than implying a complete audit:

`http-status`, `content-type`, `meta-title`, `meta-title-length`,
`meta-description`, `meta-viewport`, `html-lang`, `img-alt`, `heading-h1`,
`robots-noindex`.

Findings carry a `detectionMethod`. Everything Stage 1 produces is
`deterministic` — measured, not inferred. Guidance-shaped checks
(`meta-title-length`) are labelled as low severity, marked with a confidence
below 1 and carry no WCAG criterion, so craft advice is never presented as a
conformance failure. Where a criterion really is checkable from the document
alone it is cited: `img-alt` against WCAG 1.1.1, `html-lang` against 3.1.1,
`meta-title` against 2.4.2.

### Job lifecycle

1. `POST` creates a `Scan` row with status `queued` and returns the id.
2. The row is left `queued`. Nothing runs inside the request: a long-lived
   process claims it (the worker in `docs/AUDIT_WORKER_HOST.md`; `runQueuedScan`
   is the same loop for a local process). Enqueueing goes through `enqueueScan`,
   which stores `normalizeUrl(url)` — the canonical, tracking-stripped form the
   validator expects.
3. The worker claims the row with a conditional update
   (`updateMany` where status is `queued`), so two workers racing for the same
   job cannot both run it.
4. Progress is written to `Scan.metadata.stage` as it really changes:
   `validating` → `rendering` → `analyzing` → `preparing`.
5. Findings and the scanned page are persisted, then the scan is closed as
   `completed`, `partially_completed` (the page answered 4xx/5xx) or `failed`.
6. `recoverStaleScans` closes scans left `running` for more than ten minutes, so
   a redeploy cannot leave a job stuck and inflating the concurrency counter.

Failure paths always write a terminal status and a user-facing message. No path
reports a failed scan as a success.

### Limits

| Limit | Value | Source |
| ----- | ----- | ------ |
| Anonymous scans per IP per hour | 3 | `types.ts` |
| Anonymous scans per IP per day | 10 | `types.ts` |
| Signed-in scans per hour | 10 | `rate-limit.ts` |
| Signed-in scans per day | 50 | `rate-limit.ts` |
| Concurrent scans (global) | 2 | `types.ts` |
| Fetch timeout | 20s | `types.ts` |
| Response size cap | 5 MiB | `types.ts` |
| Redirect limit | 5 | `types.ts` |

Counters are derived from the `Scan` table itself, so the limit a caller hits is
the limit the database can see. The client IP is stored only as a salted,
truncated SHA-256 (`hashIp`), never in the clear.

## What Stage 2 implements

Stage 2 replaces the default analysis with a **rendered** one. A real browser
loads the submitted page, and the pipeline measures the page that a visitor
would actually get:

1. the rendered DOM (not the served response) is scanned by the ten native rules;
2. axe-core runs inside the rendered document against WCAG 2.0/2.1/2.2 A+AA and
   best-practice tags, and its violations are translated into findings;
3. text contrast is measured from computed styles, using the design-system
   engine's ratio maths (`src/lib/design-system/colour/contrast.ts`);
4. the viewport screenshot is captured and stored;
5. every http(s) link on the page is collected into a deduplicated inventory;
6. findings from both engines are deduplicated, and every finding carries its
   selector, measured values and evidence.

### Modules

| File | Responsibility |
| ---- | -------------- |
| `src/lib/audit/browser.ts` | The untrusted-input boundary: `renderPage`, `collectTextSamples`, `collectPageLinks`, `runAxeInPage`, `RendererError`, `RendererUnavailableError`, `isBrowserRendererAvailable` and the renderer limits |
| `src/lib/audit/axe.ts` | Faithful translation: `AXE_RUN_TAGS`, `mapAxeViolations`, `axeImpactToSeverity`, `axeWcagCriterion`, `axeCategory` |
| `src/lib/audit/contrast-rules.ts` | Measured contrast: `buildContrastFindings`, `measureContrast`, `requiredRatio`, `isLargeText` |
| `src/lib/audit/fixes.ts` | Fix generation: `proposeContrastFix`, `proposeTitleFix`, `proposeDescriptionFix`, `applyProposedFixes` — validated replacements, attached after deduplication |
| `src/lib/audit/dedupe.ts` | Cross-engine deduplication: `RULE_TOPICS`, `topicFor`, `dedupeFindings` |
| `src/lib/audit/pipeline.ts` | The render-or-fetch decision and the `PageRenderer` seam: `analyzePage`, `AnalysisOutcome` |
| `src/lib/audit/coverage.ts` | `buildScanCoverage` — the engines' account of what ran, mapped for the report |
| `src/lib/audit/screenshot-store.ts` + `src/app/api/audit/scan/[scanId]/screenshot/route.ts` | Screenshot persistence and serving, with no request-supplied path reaching the filesystem |
| `src/lib/audit/runner.ts` | Job lifecycle and persistence (unchanged in shape from Stage 1) |

### Coverage is part of the contract

An empty findings list is ambiguous: it can mean "nothing is wrong" or "nothing
ran". Stage 2 therefore reports what each engine did, and the report shows it
(`ScanResultsDto.coverage`, rendered by `src/components/audit/coverage-panel.tsx`):

- **axe-core**: whether it ran, its version, and — when it did not — a stored
  reason (`axeError`) instead of an empty violation list;
- **contrast**: how many text samples were measured, and how many text elements
  could not be measured, broken down by reason;
- **links**: `null` when the page was fetched rather than rendered, so the report
  says "not collected" rather than "0 links";
- **render mode**: `browser` or `fetch`, plus the reason for any fallback;
- **deduplication**: how many findings two engines reported for one problem and
  were collapsed into one.

The rule applied throughout: absent facts stay absent. A number that was never
recorded is never displayed as a confident zero.

### Colour contrast: what is measured, and what is refused

Measured: text on a solid colour, including translucent text (`rgba()`) and text
inside a translucent group. CSS `opacity` applies to a whole subtree, so a
translucent group is handled by compositing — each layer's alpha is scaled by the
opacity of its own element and its ancestors, deepest first, then reduced to the
single colour the eye sees. This is arithmetic, not a guess: 60% black text over
white is `#666666`, and the engine says so.

Refused, and counted as *not measured* with a reason: text with a background
image or gradient anywhere in its chain, and text under a `filter` or a
`mix-blend-mode`. Those colours cannot be derived from computed styles, and a
guess there would produce a false accusation — the one outcome this feature must
never produce. Refusal is reported as a gap in coverage, never as a pass.

Also refused, and counted with the reason `unsupported_colour`: a colour the
browser will not resolve to sRGB. This matters more than it sounds. Modern CSS
colour spaces are the norm in current design systems — Tailwind v4 computes
`bg-zinc-900` as `lab(8.30603 0.618205 -2.16572)`, not `rgb()` — and a parser that
only understood `rgb()` used to treat an unreadable layer as *absent*. The walk
then continued to the white page canvas behind it and reported white-on-white text
at 1:1: a critical accusation against a page that was fine, on every Tailwind v4
site. Colours are now resolved by painting them into a one-pixel canvas and
reading the pixel back over opaque black and opaque white, which separates the
colour from its alpha in any colour space the browser understands. If that
resolution fails, the sample is *unmeasurable* — skipping the layer is never an
option, because the answer it produces is a confident lie.

Excluded entirely, as inapplicable rather than unmeasurable, because WCAG does not
constrain them: text that is not painted for anyone (`sr-only` labels, anything
clipped to a pixel box) and text inside an inactive control. A screen-reader label
was previously measured as dark-on-dark 1:1 — real text, a real ratio, and nothing
wrong with the page.

### Fix generation: a proposal that has been re-measured

A finding says what is wrong; `fixes.ts` says what to write instead, and then
checks its own suggestion the same way the finding was checked.

- **Contrast.** The nearest accessible shade of the *same* colour comes from the
design-system engine's `fixContrast` (a binary search down the OKLCH lightness
axis), keeping the background — usually the shared brand or surface colour — and
moving the text. The proposed colour is then put back through the same ratio maths
as the failure; if it does not clear the requirement, **no fix is returned at all**.
Each proposal carries its before/after values, a paste-ready CSS rule against the
real selector, a role-named token (`--text-on-light` / `--text-on-dark`, decided by
the measured background), and its own evidence: `validation.before`, `validation.after`
and `validation.passed`.
- **Metadata.** Over-long titles and descriptions are shortened to a word-boundary
*prefix* of the text that already exists and re-checked against the length rule.
Every surviving word is the original's own, in order — the audit removes copy, it
never writes it. A missing title or description gets no fix: that would mean
inventing page content.
- **axe-core contrast too.** `mapAxeViolations` now keeps the colours axe measured
(`any[].data`) in the same vocabulary the native rule uses (`color`, `background`,
`ratio`, `required`, `fontSizePx`, `fontWeight`), so one generator serves both
engines and the report cannot describe two different pairs for one element.

Fixes are attached once, after cross-engine deduplication, so one problem carries
one proposal. They are stored as `suggestedValues.fix` on the finding — the
Finding table already had that column for "what the value should be". `cssSuggestion`
and `tokenSuggestion` are deliberately left empty rather than duplicating two of
the object's fields into a second, half-populated representation.

### The fetch fallback, stated rather than implied

`pipeline.ts` decides which pipeline runs. If the renderer is missing or throws,
the fetch pipeline still analyses the served HTML and the outcome carries
`renderFallbackReason`; render-only facts are left absent, so coverage reads "not
measured". Any error that is *not* a renderer problem is rethrown, and the scan
is recorded as failed — a broken pipeline must not become a thin report that
looks like a clean scan.

### What the renderer enforces

Rendering a hostile page is the most dangerous thing this product does, so the
guard rails are explicit:

- **Every request is policed.** Playwright intercepts all traffic — main
document, subresources, XHR — and each URL passes the same syntax and DNS checks
the submitted URL passed. A page cannot use `<img src="http://169.254.169.254/…">`
to make the scanner read cloud metadata. Hosts are resolved once per scan and
cached; a denied request is aborted, never allowed through.
- **Nothing outlives the scan.** A fresh browser context per page, closed in a
`finally` block, with `serviceWorkers: "block"`, no permissions, downloads
cancelled, dialogs dismissed and popups closed.
- **Bounded work.** Navigation 20s, network-idle wait 5s, each tool call 25s, at
most 500 requests, 400 text samples, 6,000 elements visited and 300 stored links.
Every cap that truncates is recorded in the scan (`truncated`, `linksTruncated`).
- **Still open.** DNS rebinding: the guard validates the addresses a hostname
resolves to, but the connection is then made by the platform client, which
resolves it again. Pinning the validated address into the connecting agent (a
custom `undici` dispatcher) is the fix and is not done. The worker-host decision
below is likewise still open.

### A bundler trap worth recording

axe-core builds the script it injects into the scanned page by stringifying its
own IIFE:

```js
axe.source = "(" + axeFunction.toString() + ")(typeof window === 'object' ? window : this);"
```

A bundler that minifies and renames that function rewrites the stringified body
to reference the bundler's own module parameters, so the injected script dies in
the page with `ReferenceError: t is not defined`. The failure is silent in the
worst way: axe reports nothing, and a report with no accessibility findings looks
like a clean page. It was found by scanning a real site and noticing zero axe
findings where a standalone axe run found seven.

A second, quieter version of the same trap bites only the standalone worker.
`page.evaluate` stringifies the function it is given and re-evaluates that source
inside the page, and a transpiler that preserves function names — esbuild with
`keepNames`, which the `tsx` loader always enables — wraps every named function
declaration in a `__name(...)` helper call that travels into the page with it. Next
compiles the same file with SWC and injects nothing, so the extraction worked in
the app and died in the worker with `ReferenceError: __name is not defined`, which
the runner could only report as "internal". `browser.ts` now installs the helper in
the page before every in-page function call, rather than relying on how the
extraction functions happen to be written.

`next.config.ts` therefore lists `serverExternalPackages: ["axe-core",
"playwright"]`, so Node requires the published package instead of bundling it.
If this ever regresses, the symptom is `axeRan: false` with an `axeError`
recorded on the scan, and the coverage panel shows it in the report.

## Data model

The audit models live in the existing `chromabrew` schema alongside the user and
project tables. Added in this work: `Scan`, `ScannedPage`, `Finding`,
`ProposedFix`, `Preview` and `Report`, with the enums `ScanStatus`, `ScanScope`,
`FindingSeverity`, `FindingCategory`, `DetectionMethod` and `PreviewMethod`, plus
a `scans` relation on `User`.

Stage 1 writes to `Scan`, `ScannedPage` and `Finding`. `ProposedFix`, `Preview`
and `Report` are defined but unused — they belong to Stages 4, 5 and 7.

`Scan` also carries the share columns — `shareToken` (unique, nullable) and
`sharedAt`. `shareToken IS NULL` means "not shared", so a report is never public
merely because somebody knows or guesses its id; see *Sharing* under Security.

`Scan` records the scanner and rules version (`1.0.0`), the viewport, page
counts, timings and the error message. `Finding` records the rule id, category,
severity, the explanation fields, an element selector when one is knowable, the
WCAG criterion, the detection method, a confidence value and JSON evidence for
the measured values. Screenshots and report artifacts are separated from the
structured rows, matching the plan's requirement to store them apart.

**The migrations are not applied to production.** The schema validates, and the
migration history in `prisma/migrations/` has been replayed twice against a
throwaway PostgreSQL 16 instance — once from an empty database and once from a
pre-audit one — and both runs leave a schema that `prisma migrate diff` reports
as identical to `schema.prisma`. Nothing exists in the deployed database yet:
it still needs the one-time baseline and deploy in `docs/AUDIT_WORKER_HOST.md`
§5. Until then every audit request fails with `503`, and sharing has no columns
to write to.

## API design

| Route | Method | Purpose | Response |
| ----- | ------ | ------- | -------- |
| `/api/audit/scan` | POST | Create a scan | `202` with `{ id, status, stage }`; `400` for an invalid URL or unsupported scope; `429` with `Retry-After` when the quota is exhausted |
| `/api/audit/scan/[scanId]` | GET | Status and stage | `ScanStatusDto`, or `404` |
| `/api/audit/scan/[scanId]/results` | GET | Findings, pages and coverage | `ScanResultsDto`, or `404` |
| `/api/audit/scan/[scanId]/screenshot` | GET | The stored screenshot of one page of the scan | `image/png`, or `404` when there is none |
| `/api/audit/scan/[scanId]/share` | GET | The scan's share state, owner only | `{ shared, token, url, sharedAt }`; `401` signed out, `403` not the owner |
| `/api/audit/scan/[scanId]/share` | POST | Create (or return) the share link, owner only | Same body; `409` when the scan is not finished |
| `/api/audit/scan/[scanId]/share` | DELETE | Revoke the share link, owner only | Same body, with `shared: false` |

Two pages are public on purpose, and neither takes a scan id:

| Route | Purpose |
| ----- | ------- |
| `/r/[token]` | A shared report: the same DTO the owner sees, screenshot and coverage panel included, `noindex, nofollow` |
| `/r/[token]/screenshot?page=<id>` | The screenshot for a page of that shared report, scoped to the token |

The request body is `{ url, scope?, viewport? }`. `scope` accepts only
`single_page`; `homepage_plus_pages` and `selected_pages` exist in the enum and
in the UI, but `enqueueScan` rejects them with a clear message rather than
silently auditing one page and pretending otherwise.

Responses are built by `queries.ts`, so internal columns (`ipHash`,
`userAgent`, raw `metadata`) are never returned. A scan is readable by anyone
holding its id — the same model the existing public project shares use — but
scans are never listed or discoverable.

## Security and privacy

### What is enforced

- Protocol allowlist: `http` and `https` only. Bare schemes (`javascript:`,
  `data:`, `file:`) are recognised and rejected as protocols rather than being
  mangled into hostnames.
- No credentials in the URL, and no ports other than 80 and 443.
- Hostname blocklist: `localhost`, `.localhost`, `.local`, `.internal`,
  `.lan`, `.corp`, `.home.arpa`, `.onion` and single-label hostnames.
- Full IP blocklist coverage: RFC1918 private ranges, loopback, link-local
  including the `169.254.169.254` metadata address, CGNAT, benchmarking,
  documentation and multicast ranges, reserved space, ULA, IPv6 link-local,
  IPv6 multicast, and the 6to4, NAT64 and Teredo tunnelling prefixes.
  IPv4-mapped IPv6 addresses are unwrapped and judged as IPv4.
- A hostname that resolves to *any* blocked address is rejected, even if other
  answers are public.
- Every redirect hop is revalidated, not just the submitted URL — a redirect is
  the commonest way to slip past a single pre-flight check.
- Hard fetch timeout, response size cap and redirect limit.
- The scanner identifies itself with a descriptive user agent.
- Quota and concurrency limits before a job is created.

### Sharing

A finished scan can be published at `/r/<token>` for someone who is not the
owner. `src/lib/audit/share.ts` is the whole of it, and four rules hold:

- **The token is the authorisation.** 24 random bytes, base64url, unique in the
database. Nothing is public by id, and a token is refused by its shape before
any query runs.
- **Only a finished scan can be shared.** `isReportReady` — `completed` or
  `partially_completed` — is checked when the link is created *and* when it is
  read, so a token cannot keep a report readable after a rescan leaves it in a
  state that was never shareable.
- **Only the owner can create or revoke a link.** Ownership is the scan's
  `userId`, compared server-side; a scan submitted signed out has no owner, so
  nobody can share it. Ownership is checked before shareability, so a stranger
  learns nothing about someone else's scan.
- **Revoking removes access, not data.** The token is cleared, and every
  subsequent read is a 404 — indistinguishable from a link that never existed.

The shared page renders the same `ScanReport` component as the owner's report
and carries screenshot URLs built from the token, so no scan-scoped URL appears
anywhere in a shared page. Shared pages are `noindex, nofollow`, and the
screenshot keeps `Cache-Control: private, no-store`.

### What is not closed

**DNS rebinding.** `resolveAndAssertPublic` checks the addresses a hostname
resolves to, but the connection is then made by the platform's HTTP client,
which resolves the name again. A resolver that answers with a public address
during validation and a private address moments later can still be reached.
Closing this properly means pinning the validated address into the connecting
agent (a custom `undici` dispatcher, or a proxy that enforces the egress
policy), and re-validating on every hop with that pin in place. Stage 1 reduces
the window; it does not eliminate it. This is recorded rather than papered over.

**A report page is reachable by whoever holds a scan id.** `/audit/[scanId]` and
the three `/api/audit/scan/[scanId]/*` routes check no session, because a scan
can be created signed out and its creator then has no session to check against.
A cuid is not a secret the way the share token is: it is in the address bar, in
screenshots of the screen and in referrers. The share token is the intended way
to hand a report to somebody else; whether the id-based routes should require a
session — and therefore whether signed-out scans stay viewable at all — is a
product decision that has not been made. Recorded here rather than quietly
changed, because tightening them would break the signed-out flow that exists
today.

**Browser isolation.** Once Stage 2 executes page JavaScript, the fetch-level
controls are no longer sufficient: a rendered page can issue its own requests,
so browser automation needs its own sandbox with restricted egress, per-scan
contexts, disabled geolocation/camera/microphone/notifications and a hard
wall-clock ceiling. This is a Stage 2 prerequisite, not a Stage 1 concern.

### Privacy

A scan reads public page content. No personal data is collected beyond a salted
IP hash for rate limiting, and `docs/ARCHITECTURE.md` already records that all
colour computation stays client-side. When Stage 3 sends screenshots or page
content to a model provider, the product's privacy information must be updated
to say so, and the data sent must be minimised to the page content required.

## Deployment plan

1. Apply the migration on the VPS: `npx prisma migrate deploy`. This creates
   `scans`, `scanned_pages`, `findings`, `proposed_fixes`, `previews` and
   `reports` in the `chromabrew` schema.
2. Deploy the application. Stage 1 adds no environment variables — the database
   and auth secrets it needs already exist in `.env.example`.
3. Stage 1 can run on Vercel as-is, because the analysis is an HTTP fetch and
   the route declares its own `maxDuration`. Scans remain bounded by the
   platform's function duration; `recoverStaleScans` keeps that bounded failure
   from becoming a stuck job.

## Reusable components

| Component | Reuse |
| --------- | ----- |
| `src/components/tools/tool-shell.tsx` | Reference for page structure: heading, intro, usage steps, FAQ, JSON-LD |
| `src/components/ui/primitives.tsx` | `Button`, `LinkButton`, `CopyButton`, `DownloadButton`, `TabList` |
| `src/components/site/json-ld.tsx` | Structured data helper |
| `src/lib/design-system/colour/contrast.ts` | WCAG ratio maths and `fixContrast()` for Stage 4 colour alternatives |
| `src/lib/design-system/colour/cvd.ts` | Colour-vision simulation, reusable in Stage 2 contrast findings |
| `src/lib/design-system/exports/registry.ts` | Where generated audit tokens become CSS/Tailwind/shadcn output in Stage 4 |
| `src/lib/entitlements.ts`, `src/lib/entitlements-server.ts` | Plan gating for Stage 7 |
| `src/lib/auth/config.ts`, `src/lib/db.ts` | Existing session and database access |

## New services and dependencies

Stage 1 adds **no runtime dependency**. The HTML fact extraction is
hand-written: the rules that run need a handful of document-level facts
(`<title>`, `<meta>`, `<html lang>`, headings, `<img alt>`), which a small
spec-following attribute scanner covers without pulling in a parser. Stage 2's
DOM work replaces it with a real parser inside the browser.

Stage 2 adds two:

- **axe-core, declared as a runtime dependency** (`axe-core@^4.13.0`). It was
  previously present only as a transitive dependency of `eslint-config-next` →
  `eslint-plugin-jsx-a11y`, which is a linter's dependency and not something
  application code may import. It is also listed in `serverExternalPackages`
  (see the bundler trap above) — bundling it silently disables it.
- **Playwright**, deliberately a `devDependency`: the browser renderer is used
  by tests and by a worker host that installs it explicitly.
- **A model provider (Stage 3), not chosen.** The brief's rule is that the
  provider is a backend-only abstraction with configurable model selection, that
  a missing configuration leaves deterministic scanning fully operational and
  says so in the interface, and that no key reaches frontend code, logs, reports
  or a browser session. No provider dependency will be added until Stage 3 begins;
  when it does, the key belongs in the environment (or the platform's secret
  store) and the abstraction, not the call site, selects the model.
- **A long-running worker host.** Decided: the existing VPS, as an unprivileged
  `chromabrew-worker` service. See *Open decision* below and
  `docs/AUDIT_WORKER_HOST.md`.

## Open decision: where the Stage 2 browser worker runs

Playwright cannot run inside a Vercel serverless function. The function bundle
size, the package's browser binaries and the execution ceiling all rule it out,
and the platform's ephemeral filesystem cannot hold screenshots. Stage 2
therefore needs a host that runs long-lived processes.

**Decided: the existing VPS, as an unprivileged `chromabrew-worker` service.**
Runbook: `docs/AUDIT_WORKER_HOST.md`.

- **The claim loop is a database loop.** Every poll reads and writes the `Scan`
  table. The VPS already hosts PostgreSQL, so those round trips stay on the host
  rather than crossing a network on each poll, and the worker needs no public
  ingress at all.
- **Migrations already run there.** `prisma migrate deploy` targets the VPS, so
  the worker and the schema it depends on are upgraded in one place and cannot
  drift apart across two deploys.
- **No new vendor, credential or bill.** Each of the other two options adds at
  least one of those.
- **Egress is firewalled at the host**, which matters more here than anywhere
  else in the stack: this is the only process in the deployment that executes
  JavaScript written by strangers.

Accepted cost: the browser binaries and the worker's lifecycle become the
project's responsibility, and a compromised render is adjacent to the database.
The isolation in `docs/AUDIT_WORKER_HOST.md` §7 is therefore not optional — a
dedicated unprivileged user, a database role that reaches the audit tables but
not the user, account or session tables, and a write path limited to the
screenshot directory.

This stays a deployment decision rather than an architectural one: the queue is
host-agnostic, so `claimNextScan` and `runClaimedScan` are plain functions over
the `Scan` table, and moving the worker later changes where the loop runs, not
what it does.

| Option | What it protects | What it costs |
| ------ | ---------------- | ------------- |
| The existing VPS (already hosts PostgreSQL) | No new vendor; the database is colocated, so findings and screenshots stay on infrastructure the project already trusts; egress can be firewalled at the host | The worker, its browser binaries and its lifecycle become the project's responsibility; a compromised render is adjacent to the database unless the worker is isolated from it |
| A hosted browser service | Egress and isolation are someone else's problem, and the sandbox is maintained for you | New vendor, new credentials to protect, per-session billing, and page content leaves the VPS |
| A separate container host (Fly, Railway, Cloud Run) | Real network isolation from the database, scales independently of the web tier | Another deployment target to operate and pay for, plus image maintenance for the browsers |

The queue is already host-agnostic: `claimNextScan` and `runClaimedScan` are
plain functions over the `Scan` table, so any of the three options is a worker
process that calls them in a loop. Nothing in Stage 1 assumes where that process
lives, which is why this can stay open without blocking the current work.

## Stage roadmap

Definition of done for the stages that remain, taken from the product brief.

| Stage | Done when |
| ----- | --------- |
| 2 — Deterministic analysis engine | A real browser renders the submitted page, DOM and computed styles are extracted, the original screenshot is captured, axe-core runs against the rendered document, contrast is calculated for supported cases, and findings carry evidence, selectors and deduplication. Unsupported checks are omitted rather than fabricated, and a scan failure never becomes a successful result. |
| 3 — AI visual design analysis | A provider-agnostic service returns schema-validated visual recommendations, each referencing real page evidence and labelled as opinion rather than failure, deduplicated against the deterministic findings, with a way for users to mark a finding useful, wrong or irrelevant. The model never invents selectors, ratios or accessibility failures. |
| 4 — Actionable fixes and design-system generation | **Half done.** Contrast alternatives are generated with `fixContrast`, recalculated programmatically and only labelled as passing when they measurably do, and metadata fixes are word-boundary prefixes of existing copy — both implemented. Remaining: observed colours grouped into primitive and semantic tokens, editable and labelled as inferred. |
| 5 — Before-and-after previews | Three distinct, correctly labelled preview states exist — annotated original, illustrative proposal, rendered change — and a rendered change actually applies the proposed CSS in isolation rather than being a mockup in disguise. |
| 6 — Multi-page crawling | A bounded crawl respects scope, normalises URLs, enforces page, depth and time limits, groups repeated findings without losing per-occurrence evidence, and reports accurately which pages were scanned, excluded or failed. |
| 7 — Reports, accounts and premium billing | Scans belong to users and projects, history is browsable, reports export, plan limits are enforced server-side rather than in client state, and usage is metered per scan and per expensive operation. |
| 8 — Historical comparisons and monitoring | Immutable snapshots are stored, rescans can be scheduled, and a finding is never marked resolved merely because it stopped appearing — verified resolution, no longer detected and not rechecked are distinguished. |

## Testing

Unit tests live beside the code as `src/**/*.test.ts` and run with
`npx vitest run` (395 passing, 6 skipped by default, 30 files — a snapshot, not a
contract: the number moves as work lands).

| Suite | Covers |
| ----- | ------ |
| `url-validator.test.ts` | The specification for the SSRF gate: URL syntax, IPv4/IPv6 blocklists, the injected-resolver DNS paths, and per-hop redirect rejection |
| `analyzer.test.ts` | Stage 1 fact extraction, every native rule, fetcher caps and timeouts |
| `browser.test.ts` | Runs against **real Chromium**: computed-style extraction, translucent-text and translucent-group compositing (exact hex asserted), hidden/empty elements, sample caps, the link inventory, the axe happy path, the axe failure path, and a refused destination |
| `contrast-rules.test.ts`, `axe.test.ts` | Thresholds, large-text rules, severity mapping, WCAG citation, best-practice caps |
| `dedupe.test.ts`, `coverage.test.ts` | Cross-engine grouping, and coverage facts (absent stays absent) |
| `screenshot-store.test.ts` | Path safety: ids from a request never become filesystem paths |
| `pipeline.test.ts` | The degradation decision, offline: fallback labelling, absent facts, `null` renderer, renderer errors, and that a non-renderer error fails the scan |
| `share.test.ts` | The sharing rules that need no database: token shape and uniqueness, URL-safe tokens, links built on the token rather than a scan id, and that a malformed token is refused before any query |
| `scan-report.test.ts` | The report view both the owner and a share link render: the screenshot from the URL the DTO carries, the coverage panel, findings, a missing screenshot staying missing, and a fetch-only scan not claiming measurements it never took |

`browser.test.ts` reports as **skipped** when Playwright's browsers are absent —
never as passing.

There is also an opt-in live suite, because the failure that mattered most here
was only visible against the real internet:

```
AUDIT_LIVE=1 npx vitest run src/lib/audit/live.test.ts
```

It resolves real DNS, audits `https://example.com/` end to end (render, engine,
contrast, links, screenshot), asserts that axe actually ran, and renders the same
page twice to prove the findings are reproducible.

`npx prisma validate` guards the schema. Playwright's other suite
(`npm run test:e2e`) still covers only the existing generator workflows; no
end-to-end test drives the audit UI through a browser yet.

## Deliberate limitations

- Only `single_page` scope is executable; the other scopes are rejected by the
  API with an explicit message. Nothing crawls yet: links are discovered and
  stored, but following them is Stage 6.
- `robots.txt` is not consulted before fetching. The user submits the URL they
  want audited, and crawl restrictions genuinely matter only once the crawler
  exists (Stage 6).
- One viewport per scan, and one page state: the page is loaded and measured as
  it settles, so interactive states (menus, hover, focus, dialogs) and content
  behind a login are outside this stage.
- Contrast is measured only where the colours reduce to solid values. Text over
  an image, a gradient, a `filter` or a `mix-blend-mode` is recorded as not
  measured, with the reason, and counted in the coverage panel — never reported
  as a pass or a failure.
- The browser is a headless Chromium at a fixed viewport. Print stylesheets,
  dark-mode media queries the page reacts to, scroll-triggered animation and
  `prefers-reduced-motion` are not separately exercised.
- Automated rules cover a subset of WCAG 2.2. No output claims conformance, and
  the report says so next to the findings.
- Screenshots are evidence, not annotated reports: nothing is highlighted on
  them yet (Stage 5), and no AI visual analysis exists (Stage 3).
- Reports are not exportable, and there is no history view or billing
  (Stage 7). A shared link has no expiry, no password and no view count; it ends
  when the owner revokes it or the row is deleted.
- The renderer needs a host that runs long-lived processes, which is not chosen
  yet — the open decision below is what stands between Stage 2 and production.
