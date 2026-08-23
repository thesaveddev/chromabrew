# Architecture

This document describes the Phase 1 architecture: the deterministic design
pipeline, the canonical data model, export adapters and testing strategy.
Future phases (accounts, billing, AI, integrations) must layer onto these
seams rather than bypassing them.

## Pipeline overview

```text
GeneratorConfig
      ↓  buildDesignSystem()          src/lib/design-system/index.ts
DesignSystem  (canonical model)
      ├── colour engine    → scale (50–950, OKLCH, source pinned)
      ├── palette engine   → strategy swatches with locks/overrides
      ├── token engine     → light + dark semantic themes
      ├── primitives       → typography, spacing, radius, shadow scales
      ├── accessibility    → WCAG report over key UI pairs
      ↓
Previews (consume themes via --ds-* CSS variables, including radius/shadow)
Export adapters (consume the same DesignSystem)
```

All previews and exports consume the canonical `DesignSystem`. No component
recalculates colours independently.

## Canonical data model

`src/lib/design-system/types.ts` defines:

- `DesignSystem` — metadata, source, configuration, primitives (typography,
  spacing, radius, shadow), themes, accessibility report. This is the single
  source of truth.
- `ThemeTokens` — `Record<SemanticTokenId, string>` for each of
  `light` / `dark` (31 semantic tokens).
- `TypographyScale`, `SpacingScale`, `RadiusScale`, `ShadowScale` — 9-10
  steps each, derived from type ratio and radius style in `GeneratorConfig`.
- `ScaleStep`, `PaletteColour`, `AccessibilityCheck`, `ContrastGrade`,
  `GeneratorConfig`.

`buildDesignSystem(config)` is pure and deterministic: identical config in,
identical system out (covered by tests).

## Colour engine (`src/lib/design-system/colour/`)

### convert.ts

- HEX (short + long), `rgb()`, `hsl()` parsing; invalid input returns `null`
  so the UI can show validation errors instead of generating nonsense.
- sRGB ↔ HSL conversions (standard definitions).
- sRGB ↔ OKLab/OKLCH using Björn Ottosson's public-domain matrices.
- `oklchToHex()` gamut-maps by binary-searching chroma down to the sRGB
  boundary — hue is never shifted to force a colour into gamut.

### scale.ts — shade generation

11 steps (50–950) with fixed OKLCH lightness anchors and a chroma curve that
peaks at mid tones. The user's exact colour is pinned at its nearest step so
the brand value survives verbatim; all other steps keep the brand hue.

### contrast.ts — accessibility engine

- WCAG 2.x relative luminance and contrast ratio (reference-tested:
  black/white = 21, #767676 on white ≈ 4.54).
- Grading against AA/AAA thresholds for normal and large text.
- `fixContrast()` finds the *nearest* accessible colour by binary search
  along OKLCH lightness (hue and chroma preserved), falling back to reduced
  chroma only if neither extreme can pass.

## Palette engine (`src/lib/design-system/palette/`)

Six strategies (complementary, analogous, triadic, split-complementary,
monochromatic, tetradic) derived from the primary's OKLCH values.
`regeneratePalette()` preserves locked and manually edited swatches.

## Primitives engine (`src/lib/design-system/primitives/generate.ts`)

Generates four scale families from `GeneratorConfig` knobs:

- **Typography** — 9 steps (xs–5xl) using a configurable type ratio
  (`1.2`, `1.25`, or `1.333`), normalised into clean `14px`/`16px`/`18px`
  sizes with matching line heights and letter-spacing.
- **Spacing** — 10 steps (0.5–16) with the same visual language.
- **Radius** — 10 steps driven by `radiusStyle` (`sharp`/`soft`/`round`),
  producing `0px`–`9999px` (pill) extremes.
- **Shadow** — 9 steps (none/sm–2xl) with mode-aware light/dark shadows
  (harder edges in light, softer/larger in dark).

All normalisers are clamped and deterministic. Unit tests cover boundary
values, clamping, ratio math, and the invariants every scale must hold.

## Token engine (`src/lib/design-system/tokens/generate.ts`)

`generateTheme(input, mode)` constructs each mode independently:

- neutrals are tinted with a fraction of the brand chroma (no mechanical greys);
- the primary role uses the brand colour when it passes AA against both the
  background and a foreground candidate, otherwise the nearest passing scale
  step per mode (light mode may pin the source; dark mode typically selects a
  lighter step);
- secondary/accent roles are seeded from muted/hue-rotated variants;
- status colours (success/warning/danger/info) pick white or near-black
  foregrounds by measurement, nudging the value via `fixContrast` when needed;
- every foreground/background pairing in the report is computed, never assumed.

## Export architecture (`src/lib/design-system/exports/`)

```ts
interface ExportAdapter {
  id: string;
  name: string;
  description: string;
  generate(system: DesignSystem): ExportResult;
}
```

Adapters are registered in `registry.ts`; adding SCSS/Material/Flutter later
means adding one file — no changes to generation logic or UI.

Current adapters:

| id       | Output                                                        |
| -------- | ------------------------------------------------------------- |
| `css`    | `:root` + `.dark` custom properties (semantic + primitives)   |
| `json`   | DTCG-style tokens (primitive + semantic.light/dark)           |
| `tailwind` | Tailwind v4 `@theme inline` + primitives (text/radius/shadow) |
| `shadcn` | Current shadcn/ui oklch conventions incl. chart/sidebar/radius |

## Shareable URLs (`share.ts`)

`?primary=` (hex without #), `&strategy=`, `&locked=` (indices),
`&custom=` (`index:hex` pairs), `&radius=` (sharp/soft/round),
`&ratio=` (1.2/1.25/1.333). Parsing is forgiving: junk decodes to safe
defaults. No personal data ever enters the URL.

## Previews (`src/components/generator/previews/`)

`PreviewFrame` injects theme tokens as `--ds-*` custom properties including
radius and shadow scales; preview components are plain markup styled through
those variables, so switching light/dark re-themes instantly with no
recalculation. Content is clearly demonstrative placeholder copy.

## Image extraction (`image-palette.ts`)

Client-side only: the image is drawn to a small canvas, pixels are quantised
into RGB buckets, scored by count × saturation, merged by perceptual distance
and returned as up to eight dominant colours. Transparent pixels are skipped;
monochrome images still produce usable ramps. Nothing is uploaded.

## State flow in the generator

`/design-system` is statically prerendered; shareable-URL config (`?primary=…`)
is hydrated client-side in `useEffect`, so the route stays fully static.

`generator-client.tsx` owns `GeneratorConfig`, the preview mode and optional
per-mode "contrast fix" overrides. It derives the whole UI from
`useMemo(() => buildDesignSystem(config))` and syncs the config into the URL
via `history.replaceState`. When a `?project=` param is present, the config
is loaded from the API on mount and a Save button appears in the toolbar.

## Authentication (Phase 2)

Auth.js (NextAuth) with GitHub and Google OAuth providers. JWT-based sessions
with a Prisma adapter storing users, accounts, sessions and verification
tokens in PostgreSQL. The `SiteHeader` is a server component that reads the
session; `UserMenu` is a client component managing the dropdown.

## Database (Phase 2)

PostgreSQL on the user's VPS, accessed via Prisma ORM with the
`@prisma/adapter-pg` driver adapter. Schema is in `prisma/schema.prisma`;
connection URL is in `prisma.config.ts` (reads `DATABASE_URL` from env).

Key models:

| Model              | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `User`             | Auth.js user record (name, email, image)            |
| `Account`          | OAuth provider links (GitHub, Google)               |
| `Session`          | Active sessions (JWT strategy)                      |
| `VerificationToken`| Email verification (for future email auth)          |
| `Project`          | Saved design system config with visibility          |
| `ProjectVersion`   | Snapshot of config at a point in time               |

## Project API (Phase 2)

| Route                       | Methods          | Auth | Purpose                     |
| --------------------------- | ---------------- | ---- | --------------------------- |
| `/api/projects`             | GET, POST        | Yes  | List / create projects      |
| `/api/projects/[id]`        | GET, PATCH, DELETE| Owner| View / update / delete      |
| `/api/projects/[id]/versions`| GET, POST       | Owner| List / create versions      |
| `/p/[id]`                   | (page)           | Public if visible | Public project view |

## Testing

Vitest (`npx vitest run`) covers the deterministic core:

- conversions against published OKLCH reference values and round-trips
- WCAG ratios against known thresholds (#767676/#777777 boundary)
- scale monotonicity, source pinning, hue preservation, extreme inputs
- palette strategies, locks and overrides
- theme generation guarantees (all 31 tokens present; primary button and
  status pairs pass AA in both modes)
- primitives generation (typography/spacing/radius/shadow normalisers,
  ratio math, clamping, invariants)
- share-codec round trips and hostile-input fallbacks
- every export adapter (structure, determinism, current conventions)
- an end-to-end pipeline test of `buildDesignSystem('#47003A')`

Playwright E2E (`npm run test:e2e`) drives the real critical workflow in
Chromium, Firefox and WebKit against the production build — homepage input,
URL round-trip, dark mode, all four previews, Tailwind/shadcn exports,
share-link restore — and fails on any browser console error.

## Security & privacy posture

- Database-hosted on user's VPS; no third-party database SaaS.
- Auth.js handles OAuth token exchange; no passwords stored.
- Project visibility enforced at API level: private projects return 404 to
  non-owners; public projects are viewable by anyone with the link.
- All colour computation still happens client-side; the database only stores
  the `GeneratorConfig` JSON.
- Vercel Analytics (`@vercel/analytics`) is wired and gated to `process.env.VERCEL`:
  the script only loads on Vercel deployments; local/dev stays silent.

## Deliberate limitations

- Vercel Analytics only loads on Vercel deployments (gated by `process.env.VERCEL`).
- E2E runs in Chromium, Firefox and WebKit; clipboard is stubbed for headless engines.
- Database migrations must be run manually (`npx prisma migrate deploy`) on the VPS.
