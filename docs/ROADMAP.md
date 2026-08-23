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

Still TODO for Phase 2:

- Database migrations (connect to VPS PostgreSQL)
- Project rename/edit from dashboard
- Version restore (roll back to a previous version)
- Project deletion confirmation
- Share link with copy-to-clipboard for public projects
- Project search/filter
- Responsive mobile layout for project dashboard
