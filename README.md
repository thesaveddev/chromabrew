# Colorsmith

**Turn one colour into an entire design system.**

Colorsmith is a free, account-free web tool that transforms a single colour
(HEX / RGB / HSL / colour picker / extracted from an image) into a complete,
accessible, production-ready design system:

- perceptual 50–950 colour scales (OKLCH)
- palette generation (six strategies, with locks and manual overrides)
- semantic design tokens for **light and dark themes**
- typography, spacing, radius and shadow primitives with configurable knobs
- WCAG 2.x contrast analysis with one-click accessible fixes
- live UI previews (SaaS dashboard, marketing site, ecommerce, mobile app)
- exports: CSS variables, DTCG-style JSON, Tailwind CSS v4, shadcn/ui
- light/dark app chrome with no-flash script and ThemeToggle
- shareable URLs — no account required, nothing uploaded

Everything runs client-side. There is no database. Vercel Analytics
loads only on Vercel deployments; local development is fully silent.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm run start      # serve production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # unit + integration tests (Vitest)
npm run test:e2e   # browser E2E for the critical workflow (Playwright; builds first)
```

Requires Node 18.18+ (developed on Node 22). E2E tests need a one-time
`npx playwright install chromium firefox webkit`.

## Environment variables

| Variable               | Required | Default                 | Purpose                          |
| ---------------------- | -------- | ----------------------- | -------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | no       | `https://colorsmith.app`| Canonical URLs, sitemap, robots  |

No secrets are required in Phase 1.

## Routes

| Route                        | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `/`                          | Marketing homepage with hero colour input          |
| `/design-system?primary=X`   | The generator (accepts `primary`, `strategy`, `locked`, `custom`) |
| `/tools`                     | Free tools index                                   |
| `/tools/*`                   | Ten individual free tools (see `src/lib/tools.ts`) |
| `/sitemap.xml`, `/robots.txt`| Generated SEO infrastructure                       |

## Documentation

- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phase status; Phase 1 is current
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — engines, token model,
  export adapters, testing strategy

## Tech stack

- Next.js (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Vitest for deterministic-engine tests
- Playwright for cross-browser E2E (Chromium, Firefox, WebKit)
- @vercel/analytics (Vercel deployments only)
- No runtime dependencies beyond the framework

## Licence / status

Internal project — see `docs/ROADMAP.md` for the development phase.
