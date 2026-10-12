# Roadmap

This document tracks the phased product roadmap. Phases must only be
implemented when explicitly authorised. Never mark a phase complete unless the
functionality exists and has been tested.

## Status

| Phase | Name                                   | Status      |
| ----- | -------------------------------------- | ----------- |
| 1     | Free Design System Generator           | **COMPLETE** |
| 2     | Accounts & Projects                    | **IN PROGRESS** |
| 3     | AI + Pro Subscription                  | NOT STARTED |
| 4     | Developer & Design Integrations        | NOT STARTED |
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

## Phase 2 — Accounts & Projects (continued)

Still TODO for Phase 2:

- Database migrations (connect to VPS PostgreSQL)
- Project rename/edit from dashboard
- Version restore (roll back to a previous version)
- Project deletion confirmation
- Share link with copy-to-clipboard for public projects
- Project search/filter
- Responsive mobile layout for project dashboard
