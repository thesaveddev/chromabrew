# ChromaBrew Figma plugin

Turn a brand colour into Figma variables without leaving Figma. Enter or
select a hex → the plugin runs ChromaBrew's real design-system engine
(bundled from `src/lib/design-system`, no network access) and creates or
updates a local variable collection:

| Group | Contents | Modes |
| --- | --- | --- |
| `scale/…` | the perceptual 50–950 ramp (11 steps) | Light = Dark |
| `palette/…` | harmony swatches by role | Light = Dark |
| `semantic/…` | every semantic token id from the engine | Light ≠ Dark |

This is v1 of the distribution play in [`docs/LAUNCH_PLAN.md`](../docs/LAUNCH_PLAN.md)
§5 — a free companion that routes designers back to chromabrew.com, not a
paid product (Figma's native payments take 15% and Pro entitlement already
lives on the web).

## Develop

```bash
npm run build:figma       # bundle → figma-plugin/dist/code.js (esbuild, ~37 kb)
npm run typecheck:figma   # tsc with @figma/plugin-typings
npm test                  # includes figma-plugin/src/token-plan.test.ts
```

`src/token-plan.ts` is the pure half (DesignSystem → variable plan) and is
unit-tested; `src/code.ts` only performs Figma API calls.

## Import & test manually

Figma desktop → **Plugins → Development → Import plugin from manifest…** →
select `figma-plugin/manifest.json`, then:

1. Nothing selected → the input prefills `#47003a`; press Generate →
   49 variables appear in a "ChromaBrew #47003A" collection with Light and
   Dark modes.
2. Select a shape with a solid fill first → input prefills from that fill.
3. Enter `notacolor` → inline error, plugin stays open.
4. Run Generate twice with the same colour → still one collection, no
   duplicate variables (plan names are matched idempotently).
5. Spot-check: a semantic variable (e.g. `semantic/background`) has
   different Light/Dark values; `scale/50` is identical in both.

Steps 3–5 are covered by unit tests where the logic is pure; step 1–2 need a
real Figma session and have **not** been exercised in this environment.

## Not in v1

- Publishing to Figma Community (listing copy, screenshots — LAUNCH_PLAN §5)
- Typography/spacing/radius tokens (Figma variables are colour-only today;
  text styles are a later pass)
- Web → Figma bridge (pulling a saved project from chromabrew.com)
