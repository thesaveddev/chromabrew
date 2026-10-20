# Hyperframes Composition Brief: ChromaBrew

## Objective
Create a short, polished launch-style brag video for ChromaBrew — the free design system generator
that turns one color into a complete accessible design system.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 19.0 seconds

## Source Material
- Project root: `C:\Users\Opeyemi Olorunfemi\apps\colors`
- Primary files read: `src/app/page.tsx` (hero, pipeline, features, live demo), `src/app/design-system/page.tsx`
  + `src/components/generator/generator-client.tsx` (working generator), `src/app/layout.tsx` + `globals.css`,
  `README.md`, `public/favicon.svg`, `src/lib/design-system/share.ts` (DEFAULT_CONFIG).
- Product name: ChromaBrew
- Tagline / strongest claim: **"Turn one color into an entire design system."**
- Key UI or visual moment to recreate: the generator workspace — source hex → 50–950 scale strip →
  palette row → semantic token chips → live SaaS dashboard preview that flips light→dark on a click
  → AA accessibility pass.
- Copy that must appear verbatim:
  - "Turn one color into an entire design system."
  - "AA / AAA measured, never assumed"
  - Brand: "ChromaBrew" / "chromabrew.app"
  - Seed hex: `#47003A`

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film — a single color
  blooming into scales, tokens, themes, checks, and code.
- Interpretation: Fewer scenes, longer holds, light/medium-weight type, generous letter-spacing, slow
  crossfades (~0.6s), restrained SFX. Confidence through restraint; product speaks for itself.
- Angle: One color in → a whole design system out. The transformation is the video.
- Hook: A single giant #47003A swatch with the line "Turn one color" — five words, one swatch, the promise.
- Outro / punchline: ChromaBrew wordmark + "One color. Entire design system." + chromabrew.app.
- Avoid:
  - Generic SaaS language ("streamline your workflow" is banned)
  - Abstract filler visuals / gradient-only slop
  - Unrelated visual redesign of the brand (brand zinc/ivory + plum/rose palette is sacred)

## Visual Identity
- Background: near-black #0B0C11 (brand zinc-950 dark chrome, tinted)
- Text: #F4F4F5 primary, #A1A1AA muted, #C87CB3 rose (mono hex values)
- Accent: #C87CB3 (favicon rose) + #47003A (deep plum seed color)
- Display font: Geist (shipped locally as woff2)
- Body font: Geist light weight; Geist Mono for hex values
- Visual references from the project: the OKLCH 50–950 scale strip, the #47003A swatch, the
  zinc/ivory + rose brand skein, favicon rose dot.

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary (19.0s total):
1. One color — 3.5s (0.0→3.5) — wordmark, "Turn one color" headline, giant #47003A swatch w/ hex.
2. The pipeline blooms — 5.1s (3.5→8.6) — "into an entire design system." + 50–950 scale builds
   left→right on beat (~4.39s first swatch → completes ~8.74s strong cue), palette row slides in,
   semantic token chips pop in with holds ≥0.8s.
3. The generator working — 5.0s (8.6→13.6) — generator workspace: source panel + light SaaS preview;
   cursor clicks Dark toggle (~13.0s, near strong cue 13.11s) → preview re-themes to dark; AA pass chip.
4. Outro — 5.4s (13.6→19.0) — ChromaBrew wordmark slams in on strong cue 17.47s; "One color. Entire
   design system."; chromabrew.app. Hold to 19.0s.

## Audio
- Audio role: warm, steady professional bed with a few restrained accents.
- Audio arc: breath in with the hook → satisfying build payoff at 8.74s → quiet confirmation on the
  dark flip → restrained bell on the logo → natural settle.
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: start at 0s, fade-up ~0.5s, hold ~0.30; no crash stop — settle into final 2s.
- Music cue guidance: bundled preset `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`
  (~110 BPM). Strong cues to target: 8.74s (scale completes), 13.11s (dark flip), 17.47s (logo). Beat
  grid ~0.55s for scale swatches; token chips hold readable floors (every other beat / ≥0.8s holds).
- Audio-reactive treatment: subtle if extraction available; music RMS/bass to breathe the hero swatch
  glow and dashboard card presence. Re-check at composition time; if the extractor is unavailable,
  document and skip — beat-lock carries the musicality.
- Audio-coupled moments:
  - Hook swatch pop-in ~0.6s — soft drop.
  - Scale completion 8.74s — warm soft announce.
  - Dark toggle ~13.0s — soft switch click.
  - Logo 17.47s — restrained bell announce.
- SFX selection guidance: polished tone — sparse, low/medium high-frequency-risk picks, volumes
  0.55–0.75; `interface/drop_*` for pop-in, `impact/impactSoft_medium_*` for the 8.74s payoff,
  `interface/switch_*` for the theme flip, `impact/impactBell_heavy_000` (low volume) for the logo.
- SFX analysis guidance: read `assets/sfx/sfx-analysis.json`; prefer warm low/medium HF files.
- Exact SFX choice: choose filenames/timestamps/density/volume against the implemented animation.
- Audio files: copy chosen music + SFX into `brag-output/composition/assets/`.

## Hyperframes Instructions
Load hyperframes-core, hyperframes-animation, hyperframes-creative, hyperframes-keyframes,
hyperframes-cli. /brag workflow: do not enter the hyperframes entry-point intent interview; do not
route to the generic promo/launch-video workflow.

Requirements:
- Show at least one real UI, copy, or visual element from ChromaBrew (the generator workspace scene
  with the real seed color, brand palette, and verbatim taglines).
- Keep all text readable in the final render (headline ~0.3s/word, chips ≥0.8s settled).
- Keep the video within 15–25s (target 19.0s).
- Include the planned music/SFX layer.
- Treat /brag audio notes as guidance, not a fixed cue sheet.
- Major reveals may move toward nearby strong cues within ~0.15s; smaller entrances within ~0.10s.
- Use SFX to support motion: drops on pop-ins, announce at 8.74s, switch on the theme flip, bell on logo.
- Honor music treatment; settle naturally at the end.
- If audio-reactive extraction is available, wire subtle brand-specific response (glow/card presence)
  from RMS/bass; never waveform/equalizer visuals.
- Use local assets (fonts woff2, music mp3, SFX ogg) — relative paths only.
- Run `npx hyperframes check` before render (single gate).

## Fonts note
Geist Sans (400/500/600) + Geist Mono (400/500). If local woff2 files cannot be fetched, fall back to
a bundled system-adjacent sans (Inter woff2 shipped locally) but keep pairing distinct (mono for hex).