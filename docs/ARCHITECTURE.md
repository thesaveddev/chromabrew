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
      ├── accessibility    → WCAG report over key UI pairs
      ↓
Previews (consume themes via --ds-* CSS variables)
Export adapters (consume the same DesignSystem)
```

All previews and exports consume the canonical `DesignSystem`. No component
recalculates colours independently.

## Canonical data model

`src/lib/design-system/types.ts` defines:

- `DesignSystem` — metadata, source, configuration, primitives, themes,
  accessibility report. This is the single source of truth.
- `ThemeTokens` — `Record<SemanticTokenId, string>` for each of
  `light` / `dark` (31 semantic tokens).
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
| `css`    | `:root` + `.dark` custom properties                           |
| `json`   | DTCG-style tokens (primitive + semantic.light/dark)           |
| `tailwind` | Tailwind v4 `@theme inline` + `@custom-variant dark`        |
| `shadcn` | Current shadcn/ui oklch conventions incl. chart/sidebar/radius |

## Shareable URLs (`share.ts`)

`?primary=` (hex without #), `&strategy=`, `&locked=` (indices),
`&custom=` (`index:hex` pairs). Parsing is forgiving: junk decodes to safe
defaults. No personal data ever enters the URL.

## Previews (`src/components/generator/previews/`)

`PreviewFrame` injects theme tokens as `--ds-*` custom properties; preview
components are plain markup styled through those variables, so switching
light/dark re-themes instantly with no recalculation. Content is clearly
demonstrative placeholder copy.

## Image extraction (`image-palette.ts`)

Client-side only: the image is drawn to a small canvas, pixels are quantised
into RGB buckets, scored by count × saturation, merged by perceptual distance
and returned as up to eight dominant colours. Transparent pixels are skipped;
monochrome images still produce usable ramps. Nothing is uploaded.

## State flow in the generator

`generator-client.tsx` owns `GeneratorConfig`, the preview mode and optional
per-mode "contrast fix" overrides. It derives the whole UI from
`useMemo(() => buildDesignSystem(config))` and syncs the config into the URL
via `history.replaceState`.

## Testing

Vitest (`npx vitest run`) covers the deterministic core:

- conversions against published OKLCH reference values and round-trips
- WCAG ratios against known thresholds (#767676/#777777 boundary)
- scale monotonicity, source pinning, hue preservation, extreme inputs
- palette strategies, locks and overrides
- theme generation guarantees (all 31 tokens present; primary button and
  status pairs pass AA in both modes)
- share-codec round trips and hostile-input fallbacks
- every export adapter (structure, determinism, current conventions)
- an end-to-end pipeline test of `buildDesignSystem('#47003A')`

Playwright E2E (`npm run test:e2e`) drives the real critical workflow in
Chromium against the production build — homepage input, URL round-trip,
dark mode, all four previews, Tailwind/shadcn exports, share-link restore —
and fails on any browser console error.

## Security & privacy posture (Phase 1)

- No database, no accounts, no secrets, no server-side state.
- All computation happens in the browser; uploads never leave the device.
- File validation: type allow-list and 8 MB size cap before processing.
- No third-party scripts or invasive analytics; `src/lib/analytics.ts` is a
  no-op sink with typed events ready for a future provider.

## Deliberate limitations (Phase 1)

- App chrome is light-only; generated systems support light **and** dark.
- Typography/spacing/radius/shadow tokens are out of scope until a later phase.
- The generator page renders dynamically because configuration lives in the
  URL; everything else is statically prerendered.
