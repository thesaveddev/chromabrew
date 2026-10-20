# Brag Plan: ChromaBrew

## What is this app?
ChromaBrew is a free web tool that turns a single color into a complete, accessible design system —
perceptual 50–950 OKLCH scales, semantic light/dark tokens, WCAG AA/AAA checks, live interface
previews, and production-ready CSS / Tailwind v4 / shadcn/ui exports. No account. Everything in the browser.

## The angle
The magic trick: *one color in, a whole design system out.* The video is a quiet, premium product
film that dramatizes the pipeline — a single hex value blooming into scales, tokens, themes, checks,
and code. The claim is real, so the tone stays calm and confident: no hype, just the transformation.

## Hook (first 2-3 seconds)
A single giant color swatch (#47003A — the site's demo brand color) on a near-black canvas, with the
line **"Turn one color"** set in a light display face. One swatch, five words. The promise.

## Key moments (the middle)
- The **50–950 scale** builds left to right, swatch by swatch — the perceptual engine made visible.
- The **palette row** (complementary / analogous / triadic swatches) slides in beneath the scale.
- **Semantic token chips** (background, surface, primary, accent, on-primary) snap in, then a live
  **SaaS dashboard preview** renders with those tokens — the generator working, not describing.

## Outro / punchline
Wordmark **ChromaBrew** slams onto a malformed-tagline layer: **"One color. Entire design system."**
with `chromabrew.app` beneath. Music settles, the logo holds on a dark frame.

## User flow worth showing
**Entry → key action → result:**
1. **Entry:** a hex chip `#47003A` is on screen (the hook swatch).
2. **Key action:** the pipeline blooms — scale, palette, tokens — all recomputing from that one color.
3. **Result:** a real SaaS dashboard preview renders from the tokens, and a **light → dark theme flip**
   happens live (toggle clicked), then an **AA** accessibility pass confirms. That closing motion is the
   "ship it" moment: tokens you can trust, themes that work, code ready to copy.

## Tone
- Preset: `polished`
- Creative direction: quiet premium product film — a color blooming into a design system.
- Interpretation: Fewer scenes, longer holds, light/medium-weight type, generous letter-spacing, slow
  crossfades, restrained SFX. Confidence through restraint. No slang, no caps except the brand mark.

## Format: landscape — 1920x1080
## Duration: 19.0 seconds

## Visual identity (from the project)
- Background: near-black, tinted toward the brand (#0B0C11) — ChromaBrew's dark app chrome is zinc-950.
- Accent: #C87CB3 (the brand rose; favicon dot) and #47003A (deep plum; the demo seed color).
- Text: #F4F4F5 (zinc-100) primary, #A1A1AA (zinc-400) muted, monospace hex values #C87CB3.
- Display font: Geist (site uses Geist Sans / Geist Mono) — shipped locally as woff2.
- Body font: Geist (lighter weight); monospace for hex values (Geist Mono).
- Strongest visual element: the OKLCH scale strip (50 → 950) and the seeded #47003A swatch.

## Share copy (draft)
ChromaBrew — turn one color into an entire design system. Scales, semantic tokens, light & dark
themes, WCAG checks, production code. Free, no account. chromabrew.app

## Audio direction
- Role: warm, steady, professional bed with a few restrained accents.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (109.96 BPM, steady and clean).
- Music treatment: fade in at 0s at ~0.30, hold steady, duck slightly under the first and second big
  announces, no fade-out crash — settle naturally into the final 2s.
- Music cue guidance: bundled preset read from
  `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`.
  Tempo ~110 BPM. Targeting strong cue **8.74s** (scale completes), **13.11s** (dark-theme flip lands),
  **17.47s** (logo slam). Beat grid ~0.55s for staggered scale swatches (arrive every ~0.55s, non-text
  swatches may ride beats; token *chips* hold to readable floors).
- Audio-reactive treatment: subtle; use music RMS/bass to make the hero swatch glow breathe and the
  dashboard card presence breathe. No waveform/equalizer visuals.
- SFX posture: sparse and tasteful (polished tone). ~3-4 low-risk cues.
- Audio-coupled moments:
  - Hook swatch pop-in ~0.6s — soft drop.
  - Scale completes at 8.74s — warm soft-medium announce (the payoff of the build).
  - Light → dark toggle at ~13.0s — a soft switch/click at the flip moment.
  - Logo at ~17.5s — a restrained bell/announce, then the music settles.
- Restraint rule: nothing spikey or digital; no aggressive hits; a coherent warm-soft palette.

## Storyboard

Reading floors: headline ~0.3s/word; chips hold ~0.8s each. Entrances 0.3-0.5s, fast-in, then hold.

### Scene 1 — One color — 3.5s (0.0 → 3.5)
Night canvas. Top-left small wordmark "ChromaBrew" in serial-mono caps. Center-left giant display text
**"Turn one color"**; beneath it a large rounded swatch #47003A with its hex set in mono beneath,
glowing faintly. Line 2 of the hook is *not* shown here — that's Scene 2's entrance line.
Sequential/interaction: no — one swatch, one headline, immediate.
Audio intent: establish warmth; the swatch pop-in is the first breath.
Audio-coupled idea: single soft drop as the swatch pops in at ~0.6s.
Music: full bed in (faded up by 0.5s).
Transition mood: slow crossfade (0.6s) → Scene 2.

### Scene 2 — The pipeline blooms — 5.1s (3.5 → 8.6)
Headline line completes: **"into an entire design system."** enters (0.6s). A horizontal **50–950 scale
strip** of ten swatches (magenta → rose) builds left to right, one swatch per ~0.55s (riding the track's
beat grid: first at ~4.39s, finishing ~8.74s — the payoff lands on the strong cue). A **palette row**
of five strategy swatches (complementary / analogous / triadic / split-complementary / monochromatic)
slides in beneath. Then **semantic token chips** snap in with short labels: background · surface ·
primary · accent · on-primary (+ their tiny mono hexes).
Sequential/interaction: yes — the scale fills swatch by swatch; palette row slides as a unit; token
chips appear one by one but each holds ≥0.8s.
Audio intent: the build feels inevitable; the strong-cue announce at 8.74s pays off the motion.
Audio-coupled idea: scale swatches tick; token chips each drop softly.
Music: bed steady, slight lift into 8.74s.
Transition mood: dramatic-but-clean crossfade (0.6s) → Scene 3.

### Scene 3 — The generator working — 5.0s (8.6 → 13.6)
Now a **generator workspace** mock: left rail with the source panel (hex #47003A), a compact scale
strip, and the palette; right side a **live SaaS dashboard preview** rendered in the brand tokens —
sidebar, stat cards, a chart, buttons — all light theme. A cursor **clicks the "Dark" toggle**; the
dashboard re-themes to dark (the tokens swap live, keyed to tokens from Scene 2). An **AA** pass chip
and "AA — passes" line confirm accessibility. Copy shown sparingly: "light / dark themes", "AA / AAA,
measured, never assumed" as small exact lines.
Sequential/interaction: yes — the cursor click + theme flip is the centerpiece.
Audio intent: quiet, then a soft confirmation when AA lands.
Audio-coupled idea: switch/click at the flip (~13.0s, near strong cue 13.11s); tiny success ping on AA.
Music: steady bed, ducking slightly under the toggle.
Transition mood: slow crossfade (0.6s) → Scene 4.

### Scene 4 — Outro — 5.4s (13.6 → 19.0)
Clean dark frame. The **ChromaBrew** wordmark (Geist, light weight, "Chroma" in ivory, "Brew" in the
brand rose, or a rose dot) slams in on the strong cue at 17.47s with a restrained bell. Beneath it:
**"One color. Entire design system."** and `chromabrew.app`. Hold. Music settles naturally, no crash.
Sequential/interaction: no — one landing.
Audio intent: one restrained payoff, then settle.
Audio-coupled idea: logo announce at ~17.47s; soft settle after.
Music: bed holds through the logo, no hard stop.

**Music mood for this video:** steady, clean, quietly confident (vol-12).
**Audio summary:** a warm, steady bed with a soft-drop breath at the hook, a satisfying announce when
the scale completes, a gentle switch-click on the dark-theme flip, and a restrained bell on the logo —
settling into the final wordmark like a site going dark.