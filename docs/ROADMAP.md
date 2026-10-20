# Roadmap

This document tracks the phased product roadmap. Phases must only be
implemented when explicitly authorised. Never mark a phase complete unless the
functionality exists and has been tested.

## Status

| Phase | Name                                   | Status      |
| ----- | -------------------------------------- | ----------- |
| 1     | Free Design System Generator           | **COMPLETE** |
| 2     | Accounts & Projects                    | **IN PROGRESS** |
| 3     | AI + Pro Subscription                  | **IN PROGRESS** (Polar billing built) |
| 4     | Developer & Design Integrations        | **IN PROGRESS** (Figma plugin v1 built) |
| 5     | Developer API + AI Agent/MCP           | NOT STARTED |
| 6     | Template Store                         | NOT STARTED |
| 7     | Creator Marketplace                    | NOT STARTED |
| 8     | Teams & Agencies                       | NOT STARTED |
| 9     | Enterprise Design Governance           | NOT STARTED |
| 10    | Advertising                            | NOT STARTED |
| 11    | Affiliate Monetisation                 | NOT STARTED |
| 12    | Programmatic SEO Expansion             | NOT STARTED |

## Phase 1 — Free Design System Generator (current)

Goal: a visitor can enter one colour and leave with an accessible, production-ready design system — scale, palette, semantic tokens, primitives (typography/spacing/radius/shadows), light/dark themes for both generated systems and app chrome, WCAG analysis, live UI previews, exports (CSS / JSON / Tailwind / shadcn) and a shareable URL — without an account or payment.

Scope:

- Marketing homepage with primary colour input (colour picker, HEX, RGB, HSL)
- Deterministic colour engine (sRGB / HEX / RGB / HSL / OKLCH conversions)
- Perceptual colour scale generation (50–950) preserving brand character
- Palette generation (complementary, analogous, triadic, split-complementary,
  monochromatic, tetradic) with lock / edit / copy / regenerate
- Semantic token generation for light **and** dark themes
- WCAG 2.x contrast engine with pass/fail grading and contrast fixing
- Live UI previews: SaaS dashboard, marketing site, ecommerce, mobile
- Light/dark preview switching driven by semantic tokens
- Typography/spacing/radius/shadow primitives with configurable type ratio
  and radius style, visualised in a dedicated Primitives panel with knobs
- Light/dark app chrome with no-flash script, ThemeToggle, localStorage persistence
- Export adapters: CSS variables, JSON tokens (DTCG), Tailwind CSS v4, shadcn/ui
- Shareable URLs encoding generator state (no account required)
- Client-side image colour extraction (no uploads leave the browser)
- SEO tool architecture: `/tools/*` pages with unique metadata and genuine utility
- Unit/integration tests for all deterministic engines and export adapters
- Cross-browser E2E: Chromium, Firefox, WebKit via Playwright

Out of scope (deliberately): authentication, databases, payments, AI features,
APIs, integrations, templates, marketplace, teams, advertising.

### Phase 1 additions (competitor-informed, implemented)

Added after a competitive review of ChromaBrew against Chroma Creator (the
free color-tool market leader). These expand Phase 1 utility without changing
its scope — still no account, no payments, browser-only processing.

- Brand colour palettes: ~90 real brand colors browsable by search and sector
  at `/tools/brand-palettes`, each usable as the primary seed for the full
  design system generator via `/design-system?primary=…`. Values are
  noted as unofficial references, not brand guidelines.
- Unified colour converter: `/tools/color-converter` shows HEX, RGB, HSL and
  OKLCH simultaneously with copy buttons and a one-click seed into the
  generator. Replaces the three one-way pages `/tools/hex-to-rgb`,
  `/tools/rgb-to-hex` and `/tools/hex-to-hsl`, which now 301 to it.
- Related-tools relevance: tool registry gained a `category` field and
  `ToolShell` now surfaces same-category tools first instead of a cyclic
  "next three" list; the `/tools` index pages group tools by category.
- Privacy messaging: every `/tools/*` page and the footer now state plainly
  that processing runs in the browser and nothing is uploaded.
- Colour-blind simulation inside the design-system accessibility panel: key
  token pairs are run through the Machado et al. (2009) matrices with a
  "distinguishable / hard to tell apart" flag alongside the WCAG table.
  The matrices/`simulate` logic was extracted to a shared lib
  (`src/lib/design-system/colour/cvd.ts`) used by both the simulator tool
  and the panel.

Not copied from Chroma Creator (deliberately): its 100+ unrelated micro-tools,
`/vs/` competitor pages, and borrowed/misleading product statistics.

## Phase 2 — Accounts & Projects (in progress)

Goal: registered users can save, manage and share design system projects with
version history. Introduces PostgreSQL and Auth.js.

Scope (implemented so far):

- Auth.js with GitHub and Google OAuth providers
- PostgreSQL database via Prisma ORM (driver-adapter pattern)
- User, Account, Session, VerificationToken models (Auth.js standard)
- Project model with name, description, config (JSON), visibility (private/public)
- ProjectVersion model for version history
- Project CRUD API routes (`/api/projects`, `/api/projects/[id]`, `/api/projects/[id]/versions`)
- Sign-in page with GitHub + Google buttons
- Account page with profile display
- Projects dashboard with list, create, and link to generator
- Public project view at `/p/[id]`
- Save/Update button in generator toolbar (when signed in)
- User menu dropdown in header (avatar, name, links)
- SessionProvider wrapper for client-side auth state

## Chromabrew Audit (premium product line)

A separate, staged product line on top of ChromaBrew: enter a public URL and
receive an evidence-based design, metadata and accessibility audit. The staged
implementation plan and the repository audit that grounds it live in
[`docs/AUDIT_ARCHITECTURE.md`](AUDIT_ARCHITECTURE.md).

| Stage | Name                                              | Status      |
| ----- | ------------------------------------------------- | ----------- |
| 0     | Repository audit and architecture plan            | **COMPLETE** |
| 1     | Premium interface and single-page scan foundation | **IMPLEMENTED** (unit-tested; needs the schema push and a browser pass before it can be called verified) |
| 2     | Deterministic analysis engine (browser render + axe-core) | NOT STARTED |
| 3     | AI visual design analysis                         | NOT STARTED |
| 4     | Actionable fixes and design-system generation     | NOT STARTED |
| 5     | Before-and-after previews                         | NOT STARTED |
| 6     | Multi-page crawling and consolidated reporting    | NOT STARTED |
| 7     | Reports, accounts and premium billing             | NOT STARTED |
| 8     | Historical comparisons and monitoring             | NOT STARTED |

Stage 1 currently reads the HTML the server sends; it does not execute
JavaScript, so colour-contrast measurement, computed styles and AI review all
wait on the browser-rendering stage.

## Phase 3 — AI + Pro Subscription (started)

Goal: paid subscribers (Pro, monthly or annual) unlock paid surface —
unlimited saving, every export adapter, and AI features — with entitlements
the app can gate on. Built on **Polar**, replacing an earlier uncommitted
Stripe slice (removed on authorisation, user decision).

Implemented so far (working tree):

- **Plans:** Pro Monthly $9 / Pro Annual $90 — two Polar products (Polar's
  model is one interval per product), both granting the `pro` + `ai`
  entitlement keys. Prices live in `src/lib/entitlements.ts` (`PLANS.pro`).
- **Routes:** `/api/polar/checkout` (server-side product allowlist, auth as
  `external_customer_id`), `/api/polar/portal` (fresh customer-session
  link), `/api/webhooks/polar` (signature-verified via `@polar-sh/nextjs`).
- **Entitlement snapshot:** `Entitlement` table with per-grant `expiresAt`,
  fed by webhook reconciliation (`src/lib/polar/sync.ts`, idempotent) and
  read through `hasEntitlement` / `getUserPlan` / `getBillingSummary`
  (`src/lib/entitlements-server.ts`). Gates never call Polar's API.
- **Pure decision core** (`src/lib/polar/derive.ts`, unit-tested): status ×
  period → access window; unknown products fail closed; cancelled
  subscriptions keep access until `ends_at`.
- **Gates live:** export adapters + history caps (existing Pro gates) now
  plan from entitlement rows; the AI palette-suggestion endpoint gives
  `ai` holders a 120/min bucket vs 30/min free.
- **UI:** pricing page shows Free + Pro cards with monthly/annual checkout;
  account billing card shows plan, entitlements, renewal/cancellation and
  Polar portal management.
- **Setup:** `npm run billing:setup` (idempotent product creation) and
  [`docs/BILLING_SETUP.md`](BILLING_SETUP.md) (env, webhooks, E2E checklist).

Not started: Polar credentials + live purchase run (needs a Polar account
— the E2E checklist in BILLING_SETUP.md), AI features that consume the
`ai` entitlement beyond the rate cap, dunning/recovery UX, and any metered
usage.

## Phase 4 — Developer & Design Integrations (started)

Goal: ChromaBrew meets designers and developers where they already work,
turning distribution into a traffic source (the launch plan's Figma-first
sequencing — see [`LAUNCH_PLAN.md`](LAUNCH_PLAN.md) §5).

Implemented so far:

- **Figma plugin v1 — native scale generator** (`figma-plugin/`): a hex in,
  local Figma variables out — `scale/50…950`, harmony `palette/*` and
  `semantic/*` tokens in a Light/Dark collection, generated by the real
  ChromaBrew engine bundled from `src/lib/design-system` with
  `networkAccess: none`. Pure planning logic lives in
  `figma-plugin/src/token-plan.ts` (unit-tested in the root suite), the API
  shell in `code.ts`, and the bundle/typecheck entry points are
  `npm run build:figma` / `npm run typecheck:figma`.
- Manual verification inside Figma (import-from-manifest pass in the
  checklist in [`figma-plugin/README.md`](../figma-plugin/README.md)) has
  **not** run yet — it needs a desktop Figma session.

Still open in Phase 4: Figma Community listing (copy + screenshots per
`LAUNCH_PLAN.md` §5), typography/spacing styles, a web→Figma bridge, and the
Chrome extension.

## Phase 2 — Accounts & Projects (continued)

The items below were listed as TODO but are implemented and verified in the
working tree (typecheck + 492 tests + production build green; dashboard and
gallery flows exercised live against a local database):

- Database migrations — `scripts/db-migrate.mjs` plus versioned migrations in
  `prisma/migrations/` (only the VPS connection itself is deploy ops)
- Project rename/edit from dashboard — name, description, visibility and
gallery opt-in in `src/components/projects/project-settings.tsx`
- Version restore — PATCH route snapshots the current config as
"Before restore" before rolling back
(`src/app/api/projects/[id]/versions/[versionId]/route.ts`)
- Project deletion confirmation — two-step danger zone in project settings
- Share link with copy-to-clipboard for public projects —
`src/components/projects/share-button.tsx`
- Project search/filter — `q` + `visibility` params on `/api/projects` with
the `ProjectSearch` UI (debounced text + visibility chips)
- Responsive mobile layout for project dashboard — constrained column,
wrapping controls, truncating cards

Also built beyond this list: gallery opt-in (`listedInGallery`) with
publish/unpublish guards, the browsable noindex community gallery at
`/gallery` with search + harmony filtering, and the `/generate` spacebar
generator. Still genuinely outstanding: an authenticated end-to-end pass
(sign-in through OAuth cannot run headless here) and the production seeding
of gallery entries.
