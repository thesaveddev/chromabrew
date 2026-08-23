# Roadmap

This document tracks the phased product roadmap. Phases must only be
implemented when explicitly authorised. Never mark a phase complete unless the
functionality exists and has been tested.

## Status

| Phase | Name                                   | Status      |
| ----- | -------------------------------------- | ----------- |
| 1     | Free Design System Generator           | **COMPLETE** |
| 2     | Accounts & Projects                    | NOT STARTED |
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

Goal: a visitor can enter one colour and leave with an accessible, production-ready design system — scale, palette, semantic tokens, light/dark themes, WCAG analysis, live UI previews, exports (CSS / JSON / Tailwind / shadcn) and a shareable URL — without an account or payment.

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
- Export adapters: CSS variables, JSON tokens, Tailwind CSS v4, shadcn/ui
- Shareable URLs encoding generator state (no account required)
- Client-side image colour extraction (no uploads leave the browser)
- SEO tool architecture: `/tools/*` pages with unique metadata and genuine utility
- Unit/integration tests for all deterministic engines and export adapters

Out of scope (deliberately): authentication, databases, payments, AI features,
APIs, integrations, templates, marketplace, teams, advertising.

## Phase 2 — Accounts & Projects (not started)

Registered users, saved projects per user, project history/versions, shareable
project links with public/private visibility. Introduces PostgreSQL and a mature
auth provider. Do not start until authorised.
