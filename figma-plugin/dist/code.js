"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/lib/design-system/colour/convert.ts
  var HEX_SHORT = /^#?([0-9a-f]{3})$/i;
  var HEX_LONG = /^#?([0-9a-f]{6})$/i;
  var clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  var round = (v, decimals = 0) => {
    const f = 10 ** decimals;
    return Math.round(v * f) / f;
  };
  function normalizeHex(input) {
    const value = input.trim();
    const short = value.match(HEX_SHORT);
    if (short) {
      const [r, g, b] = short[1].split("");
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    const long = value.match(HEX_LONG);
    if (long) return `#${long[1].toLowerCase()}`;
    return null;
  }
  function hexToRgb(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized) throw new Error(`Invalid hex colour: ${hex}`);
    const n = parseInt(normalized.slice(1), 16);
    return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 };
  }
  function rgbToHex({ r, g, b }) {
    const to2 = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
    return `#${to2(r)}${to2(g)}${to2(b)}`;
  }
  function rgbToHsl({ r, g, b }) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: l * 100 };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
    }
    return { h: round(h, 1), s: round(s * 100, 1), l: round(l * 100, 1) };
  }
  var toLinear = (c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  var toSrgb = (c) => c <= 31308e-7 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  function rgbToOklch({ r, g, b }) {
    const rn = toLinear(r / 255);
    const gn = toLinear(g / 255);
    const bn = toLinear(b / 255);
    const l = 0.4122214708 * rn + 0.5363325363 * gn + 0.0514459929 * bn;
    const m = 0.2119034982 * rn + 0.6806995451 * gn + 0.1073969566 * bn;
    const s = 0.0883024619 * rn + 0.2817188376 * gn + 0.6299787005 * bn;
    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);
    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
    const c = Math.sqrt(A * A + B * B);
    let h = Math.atan2(B, A) * 180 / Math.PI;
    if (h < 0) h += 360;
    return { l: L, c, h: c < 1e-6 ? 0 : round(h, 2) };
  }
  function oklabToLinearSrgb(L, A, B) {
    const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
    const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
    const s_ = L - 0.0894841775 * A - 1.291485548 * B;
    const l = l_ ** 3;
    const m = m_ ** 3;
    const s = s_ ** 3;
    return {
      r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    };
  }
  var isInGamut = ({ r, g, b }, eps = 1e-4) => r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
  function oklchToHex({ l, c, h }) {
    const L = clamp(l, 0, 1);
    const hueRad = h * Math.PI / 180;
    const attempt = (chroma2) => {
      const a = Math.cos(hueRad) * chroma2;
      const b = Math.sin(hueRad) * chroma2;
      return oklabToLinearSrgb(L, a, b);
    };
    let chroma = Math.max(0, c);
    if (!isInGamut(attempt(chroma))) {
      let lo = 0;
      let hi = chroma;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (isInGamut(attempt(mid))) lo = mid;
        else hi = mid;
      }
      chroma = lo;
    }
    const lin = attempt(chroma);
    return rgbToHex({
      r: toSrgb(clamp(lin.r, 0, 1)) * 255,
      g: toSrgb(clamp(lin.g, 0, 1)) * 255,
      b: toSrgb(clamp(lin.b, 0, 1)) * 255
    });
  }
  function oklch(l, c, h) {
    return oklchToHex({ l, c, h });
  }
  function toColourValue(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized) throw new Error(`Invalid hex colour: ${hex}`);
    const rgb = hexToRgb(normalized);
    return {
      hex: normalized,
      rgb,
      hsl: rgbToHsl(rgb),
      oklch: rgbToOklch(rgb)
    };
  }

  // src/lib/design-system/colour/scale.ts
  var SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  var LIGHTNESS_ANCHORS = {
    50: 0.977,
    100: 0.946,
    200: 0.902,
    300: 0.845,
    400: 0.765,
    500: 0.684,
    600: 0.605,
    700: 0.52,
    800: 0.44,
    900: 0.365,
    950: 0.268
  };
  var CHROMA_CURVE = {
    50: 0.32,
    100: 0.48,
    200: 0.64,
    300: 0.8,
    400: 0.92,
    500: 1,
    600: 1.04,
    700: 1,
    800: 0.92,
    900: 0.82,
    950: 0.68
  };
  function targetLightness(step) {
    var _a2;
    return (_a2 = LIGHTNESS_ANCHORS[step]) != null ? _a2 : 0.5;
  }
  function chromaFor(step, baseChroma) {
    var _a2;
    const multiplier = (_a2 = CHROMA_CURVE[step]) != null ? _a2 : 1;
    return baseChroma * multiplier;
  }
  function generateScale(primaryHex) {
    const source = rgbToOklch(hexToRgb(primaryHex));
    let pinnedStep = SCALE_STEPS[0];
    let bestDistance = Infinity;
    for (const step of SCALE_STEPS) {
      const d = Math.abs(LIGHTNESS_ANCHORS[step] - source.l);
      if (d < bestDistance) {
        bestDistance = d;
        pinnedStep = step;
      }
    }
    return SCALE_STEPS.map((step) => {
      if (step === pinnedStep) {
        return { step, hex: oklchToHex(source), oklch: source, isSource: true };
      }
      const requested = {
        l: targetLightness(step),
        c: chromaFor(step, source.c),
        h: source.h
      };
      const hex = oklchToHex(requested);
      return { step, hex, oklch: rgbToOklch(hexToRgb(hex)), isSource: false };
    });
  }

  // src/lib/design-system/colour/refine.ts
  var NEUTRAL_CHROMA = 0.02;
  var ZERO_REFINEMENT = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hueShift: 0,
    temperature: 0
  };
  function clamp2(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }
  function normaliseHue(h) {
    return (h % 360 + 360) % 360;
  }
  function applyRefinement(hex, refinement) {
    const { brightness, contrast, saturation, hueShift, temperature } = refinement;
    const inert = (brightness != null ? brightness : 0) === 0 && (contrast != null ? contrast : 0) === 0 && (saturation != null ? saturation : 0) === 0 && (hueShift != null ? hueShift : 0) === 0 && (temperature != null ? temperature : 0) === 0;
    if (inert) return hex;
    const source = rgbToOklch(hexToRgb(hex));
    let { l, c, h } = source;
    l = clamp2(l + (brightness != null ? brightness : 0) / 100 * 0.5, 0.02, 0.99);
    if ((contrast != null ? contrast : 0) !== 0) {
      l = clamp2(0.5 + (l - 0.5) * (1 + (contrast != null ? contrast : 0) / 100), 0.02, 0.99);
    }
    if ((saturation != null ? saturation : 0) !== 0) {
      c = clamp2(c * (1 + saturation / 100), source.c > NEUTRAL_CHROMA ? 8e-3 : 0, 0.37);
    }
    h = normaliseHue(h + (hueShift != null ? hueShift : 0));
    if ((temperature != null ? temperature : 0) !== 0) {
      const t = temperature / 100;
      const target = t > 0 ? 70 : 260;
      const strength = Math.abs(t) * 40;
      let delta = target - h;
      if (t < 0) delta = ((delta + 180) % 360 + 360) % 360 - 180;
      delta = clamp2(delta, -180, 180);
      h = normaliseHue(h + delta * (strength / 40));
      c = clamp2(c * (1 + Math.abs(t) * 0.15), 0, 0.37);
    }
    return oklchToHex({ l, c, h });
  }

  // src/lib/design-system/colour/companions.ts
  var NEUTRAL_CHROMA2 = 0.035;
  var PALE_LIGHTNESS = 0.78;
  var DEEP_LIGHTNESS = 0.32;
  var normalizeHue = (h) => (h % 360 + 360) % 360;
  var clamp3 = (v, min, max) => Math.min(max, Math.max(min, v));
  function deriveCompanions(primaryHex) {
    const p = rgbToOklch(hexToRgb(primaryHex));
    if (p.c < NEUTRAL_CHROMA2) {
      if (p.l >= 0.5) {
        return {
          secondary: oklch(0.26, 0.03, 260),
          accent: oklch(0.55, 0.19, 25)
        };
      }
      return {
        secondary: oklch(0.55, 0.19, 25),
        accent: oklch(0.56, 0.15, 235)
      };
    }
    const splitA = normalizeHue(p.h + 150);
    const splitB = normalizeHue(p.h + 210);
    const secondaryChroma = clamp3(p.c, 0.09, 0.16);
    const accentChroma = clamp3(p.c * 1.15, 0.13, 0.19);
    let secondaryL;
    let accentL;
    if (p.l >= PALE_LIGHTNESS) {
      secondaryL = 0.3;
      accentL = 0.52;
    } else if (p.l <= DEEP_LIGHTNESS) {
      secondaryL = 0.6;
      accentL = 0.62;
    } else {
      secondaryL = 0.33;
      accentL = 0.56;
    }
    return {
      secondary: oklch(secondaryL, secondaryChroma, splitA),
      accent: oklch(accentL, accentChroma, splitB)
    };
  }

  // src/lib/design-system/palette/generate.ts
  var PALETTE_STRATEGIES = [
    {
      id: "complementary",
      label: "Complementary",
      description: "Two hues opposite each other \u2014 high contrast, energetic.",
      hueOffsets: [0, 180],
      roles: ["Primary", "Complement"]
    },
    {
      id: "analogous",
      label: "Analogous",
      description: "Neighbouring hues \u2014 harmonious and calm.",
      hueOffsets: [-30, 0, 30],
      roles: ["Analogous \u221230\xB0", "Primary", "Analogous +30\xB0"]
    },
    {
      id: "triadic",
      label: "Triadic",
      description: "Three evenly spaced hues \u2014 balanced and vibrant.",
      hueOffsets: [0, 120, 240],
      roles: ["Primary", "Triad +120\xB0", "Triad +240\xB0"]
    },
    {
      id: "split-complementary",
      label: "Split complementary",
      description: "A base plus the two neighbours of its complement.",
      hueOffsets: [0, 150, 210],
      roles: ["Primary", "Split A", "Split B"]
    },
    {
      id: "monochromatic",
      label: "Monochromatic",
      description: "One hue explored through lightness and chroma.",
      hueOffsets: [0, 0, 0],
      roles: ["Tint", "Primary", "Shade"],
      lightnessDeltas: [0.14, 0, -0.14],
      chromaMultipliers: [0.85, 1, 1.05]
    },
    {
      id: "tetradic",
      label: "Tetradic",
      description: "Four hues in a rectangle \u2014 rich but demanding.",
      hueOffsets: [0, 90, 180, 270],
      roles: ["Primary", "Second", "Third", "Fourth"]
    }
  ];
  function getStrategy(id) {
    const found = PALETTE_STRATEGIES.find((s) => s.id === id);
    if (!found) throw new Error(`Unknown palette strategy: ${id}`);
    return found;
  }
  var normalizeHue2 = (h) => (h % 360 + 360) % 360;
  function generatePalette(primaryHex, strategyId, options = {}) {
    var _a2;
    const source = rgbToOklch(hexToRgb(primaryHex));
    const strategy = getStrategy(strategyId);
    const size = Math.max(
      strategy.hueOffsets.length,
      Math.min(10, Math.round((_a2 = options.size) != null ? _a2 : strategy.hueOffsets.length))
    );
    return Array.from({ length: size }, (_, index) => {
      var _a3, _b, _c, _d, _e;
      const override = (_a3 = options.overrides) == null ? void 0 : _a3[index];
      if (override) {
        return { hex: override.toLowerCase(), role: roleFor(strategy, index), index, locked: false, edited: true };
      }
      const cycle = Math.floor(index / strategy.hueOffsets.length);
      const offsetIndex = index % strategy.hueOffsets.length;
      const cycleDelta = cycle % 2 === 0 ? -0.07 * Math.ceil(cycle / 2) : 0.09 * Math.ceil(cycle / 2);
      const l = Math.min(
        0.97,
        Math.max(
          0.12,
          source.l + ((_c = (_b = strategy.lightnessDeltas) == null ? void 0 : _b[offsetIndex]) != null ? _c : 0) + cycleDelta
        )
      );
      const c = source.c * ((_e = (_d = strategy.chromaMultipliers) == null ? void 0 : _d[offsetIndex]) != null ? _e : 1);
      const h = normalizeHue2(source.h + strategy.hueOffsets[offsetIndex]);
      let hex = oklchToHex({ l, c, h });
      if (strategy.id === "monochromatic" && !(offsetIndex === 1 && cycle === 0) && hex.toLowerCase() === oklchToHex({ l: source.l, c: source.c, h: source.h }).toLowerCase()) {
        hex = oklchToHex({
          l,
          c: Math.min(0.32, c * (offsetIndex === 0 ? 0.6 : 1.4) + 0.01),
          h
        });
      }
      return { hex, role: roleFor(strategy, index), index, locked: false, edited: false };
    });
  }
  function roleFor(strategy, index) {
    const base = strategy.roles[index % strategy.roles.length];
    const cycle = Math.floor(index / strategy.roles.length);
    return cycle === 0 ? base : `${base} ${cycle + 1}`;
  }

  // src/lib/design-system/primitives/generate.ts
  var SANS_BODY = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  var MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
  var FONT_PAIRINGS = [
    { id: "system", label: "System", heading: SANS_BODY, body: SANS_BODY },
    {
      id: "grotesque",
      label: "Grotesque",
      heading: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      body: SANS_BODY
    },
    {
      id: "editorial",
      label: "Editorial",
      heading: "Georgia, 'Times New Roman', Cambria, serif",
      body: SANS_BODY
    },
    {
      id: "humanist",
      label: "Humanist",
      heading: "'Trebuchet MS', Candara, Verdana, sans-serif",
      body: "Verdana, Geneva, Tahoma, sans-serif"
    },
    {
      id: "geometric",
      label: "Geometric",
      heading: "'Century Gothic', 'Avant Garde', Futura, 'Segoe UI', sans-serif",
      body: SANS_BODY
    },
    {
      id: "technical",
      label: "Technical",
      heading: MONO,
      body: SANS_BODY
    }
  ];
  function getFontPairing(id) {
    var _a2;
    return (_a2 = FONT_PAIRINGS.find((p) => p.id === id)) != null ? _a2 : FONT_PAIRINGS[0];
  }
  var TYPE_STEPS = [
    "xs",
    "sm",
    "base",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl"
  ];
  var BASE_INDEX = TYPE_STEPS.indexOf("base");
  var BASE_REM = 1;
  var BASE_LINE_HEIGHT = 1.5;
  function generateTypography(ratio, pairingId) {
    const pairing = getFontPairing(pairingId);
    const fontSize = {};
    TYPE_STEPS.forEach((name, index) => {
      const exponent = index - BASE_INDEX;
      const rem = BASE_REM * ratio ** exponent;
      let lineHeight;
      if (exponent <= -1) lineHeight = 1.45;
      else if (exponent === 0) lineHeight = BASE_LINE_HEIGHT;
      else if (exponent === 1) lineHeight = 1.4;
      else if (exponent === 2) lineHeight = 1.3;
      else lineHeight = 1.15;
      const letterSpacing = exponent >= 3 ? "-0.02em" : exponent === 2 ? "-0.01em" : "0em";
      fontSize[name] = {
        size: `${round2(rem)}rem`,
        lineHeight,
        letterSpacing
      };
    });
    return {
      fontFamily: {
        heading: pairing.heading,
        sans: pairing.body,
        mono: MONO
      },
      fontSize
    };
  }
  function round2(rem) {
    return Math.round(rem * 1e3) / 1e3;
  }
  var SPACING_MULTIPLIERS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
  function generateSpacing() {
    const scale = {};
    for (const m of SPACING_MULTIPLIERS) {
      scale[String(m * 4)] = `${m * 0.25}rem`;
    }
    return scale;
  }
  var RADIUS_PRESETS = {
    sharp: { sm: "0.125rem", md: "0.125rem", lg: "0.25rem", xl: "0.25rem" },
    soft: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem" },
    round: { sm: "0.375rem", md: "0.75rem", lg: "1rem", xl: "1.5rem" }
  };
  function generateRadius(style) {
    return __spreadProps(__spreadValues({}, RADIUS_PRESETS[style]), { full: "9999px" });
  }
  function generateShadows() {
    return {
      sm: "0 1px 2px 0 rgb(0 0 / 0.05)",
      md: "0 2px 4px -1px rgb(0 0 / 0.06), 0 4px 10px -2px rgb(0 0 / 0.07)",
      lg: "0 4px 8px -2px rgb(0 0 / 0.08), 0 12px 24px -6px rgb(0 0 / 0.1)",
      xl: "0 8px 16px -4px rgb(0 0 / 0.1), 0 24px 48px -12px rgb(0 0 / 0.14)"
    };
  }

  // src/lib/design-system/colour/contrast.ts
  function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const lin = [r, g, b].map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }
  function contrastRatio(a, b) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const lighter = Math.max(la, lb);
    const darker = Math.min(la, lb);
    return (lighter + 0.05) / (darker + 0.05);
  }
  var AA_NORMAL = 4.5;
  var AA_LARGE = 3;
  var AAA_NORMAL = 7;
  var AAA_LARGE = 4.5;
  function grade(ratio) {
    return {
      ratio,
      aaNormal: ratio >= AA_NORMAL,
      aaLarge: ratio >= AA_LARGE,
      aaaNormal: ratio >= AAA_NORMAL,
      aaaLarge: ratio >= AAA_LARGE
    };
  }
  function fixContrast(hex, against, threshold = AA_NORMAL) {
    var _a2;
    const initialRatio = contrastRatio(hex, against);
    if (initialRatio >= threshold) {
      return { hex, changed: false, ratio: initialRatio, unachievable: false };
    }
    const source = rgbToOklch(hexToRgb(hex));
    const candidateAt = (l) => oklchToHex({ l, c: source.c, h: source.h });
    const passes = (l) => contrastRatio(candidateAt(l), against) >= threshold;
    const searchDown = () => {
      if (!passes(0)) return null;
      let lo = 0;
      let hi = source.l;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (passes(mid)) lo = mid;
        else hi = mid;
      }
      return lo;
    };
    const searchUp = () => {
      if (!passes(1)) return null;
      let lo = source.l;
      let hi = 1;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (passes(mid)) hi = mid;
        else lo = mid;
      }
      return hi;
    };
    const againstIsLight = relativeLuminance(against) > relativeLuminance(hex);
    const primarySearch = againstIsLight ? searchDown : searchUp;
    const fallbackSearch = againstIsLight ? searchUp : searchDown;
    const found = (_a2 = primarySearch()) != null ? _a2 : fallbackSearch();
    if (found !== null) {
      const finalHex = candidateAt(found);
      return {
        hex: finalHex,
        changed: true,
        ratio: contrastRatio(finalHex, against),
        unachievable: false
      };
    }
    for (let step = 1; step <= 10; step++) {
      const reducedC = source.c * (1 - step / 10);
      for (const l of [1, 0]) {
        const candidate = oklchToHex({ l, c: reducedC, h: source.h });
        const ratio = contrastRatio(candidate, against);
        if (ratio >= threshold) {
          return { hex: candidate, changed: true, ratio, unachievable: false };
        }
      }
    }
    return { hex, changed: false, ratio: initialRatio, unachievable: true };
  }

  // src/lib/design-system/tokens/generate.ts
  var clampL = (v) => Math.min(1, Math.max(0, v));
  function setLightness(hex, l) {
    const source = rgbToOklch(hexToRgb(hex));
    return oklch(clampL(l), source.c, source.h);
  }
  function pickClosest(pool, reference, validate) {
    var _a2;
    const ref = rgbToOklch(hexToRgb(reference));
    const scored = pool.map((hex) => ({ hex, l: rgbToOklch(hexToRgb(hex)).l })).sort((a, b) => Math.abs(a.l - ref.l) - Math.abs(b.l - ref.l));
    const passing = scored.find((candidate) => validate(candidate.hex));
    return (_a2 = passing == null ? void 0 : passing.hex) != null ? _a2 : scored[0].hex;
  }
  function pickForeground(candidates, value) {
    for (const candidate of candidates) {
      if (contrastRatio(candidate, value) >= AA_NORMAL) return candidate;
    }
    return [...candidates].sort(
      (a, b) => contrastRatio(b, value) - contrastRatio(a, value)
    )[0];
  }
  var STATUS_SPECS = [
    { id: "success", hue: 145 },
    { id: "warning", hue: 85 },
    { id: "danger", hue: 25 },
    { id: "info", hue: 245 }
  ];
  function statusPair(spec, mode, neutralDarkFg) {
    const value = mode === "light" ? { l: spec.id === "warning" ? 0.795 : 0.585, c: 0.16, h: spec.hue } : { l: spec.id === "warning" ? 0.82 : 0.75, c: 0.15, h: spec.hue };
    const valueHex = oklch(value.l, value.c, value.h);
    const white = "#ffffff";
    if (contrastRatio(valueHex, white) >= AA_NORMAL) {
      return { value: valueHex, foreground: white };
    }
    if (contrastRatio(valueHex, neutralDarkFg) >= AA_NORMAL) {
      return { value: valueHex, foreground: neutralDarkFg };
    }
    const fixedLight = fixContrast(valueHex, white);
    if (!fixedLight.unachievable) {
      return { value: fixedLight.hex, foreground: white };
    }
    const fixedDark = fixContrast(valueHex, neutralDarkFg);
    return { value: fixedDark.hex, foreground: neutralDarkFg };
  }
  function generateTheme(input, mode) {
    var _a2;
    const { primaryHex, scale, accentSeedHex, secondarySeedHex } = input;
    const primaryOklch = rgbToOklch(hexToRgb(primaryHex));
    const h = primaryOklch.h;
    const tint = (fraction, cap = 0.012) => Math.min(cap, primaryOklch.c * fraction);
    const customDark = mode === "dark" && input.darkBackgroundHex ? rgbToOklch(hexToRgb(input.darkBackgroundHex)) : null;
    const darkAnchorL = customDark ? customDark.l : 0.148;
    const darkAnchorC = customDark ? Math.min(0.02, customDark.c) : tint(0.55);
    const neutralH = customDark ? customDark.h : h;
    const background = mode === "light" ? oklch(0.993, tint(0.12), h) : mode === "dark" && input.darkBackgroundHex ? (_a2 = normalizeHex(input.darkBackgroundHex)) != null ? _a2 : oklch(darkAnchorL, darkAnchorC, neutralH) : oklch(darkAnchorL, darkAnchorC, neutralH);
    const backgroundSubtle = mode === "light" ? oklch(0.968, tint(0.2), h) : oklch(Math.min(1, darkAnchorL + 0.03), darkAnchorC, neutralH);
    const surface = mode === "light" ? oklch(0.995, tint(0.06), h) : oklch(Math.min(1, darkAnchorL + 0.048), darkAnchorC, neutralH);
    const surfaceRaised = mode === "light" ? "#ffffff" : oklch(Math.min(1, darkAnchorL + 0.078), darkAnchorC, neutralH);
    const surfaceMuted = mode === "light" ? oklch(0.972, tint(0.22), h) : oklch(Math.min(1, darkAnchorL + 0.024), darkAnchorC * 0.9, neutralH);
    const fgChroma = Math.min(0.03, primaryOklch.c * 0.35);
    const foreground = mode === "light" ? oklch(0.185, Math.min(0.028, fgChroma), h) : oklch(0.945, Math.min(0.014, primaryOklch.c * 0.18), h);
    const foregroundMuted = mode === "light" ? oklch(0.425, Math.min(0.024, fgChroma * 0.85), h) : oklch(0.72, Math.min(0.012, primaryOklch.c * 0.15), h);
    const foregroundSubtle = mode === "light" ? oklch(0.565, Math.min(0.02, fgChroma * 0.7), h) : oklch(0.562, Math.min(0.01, primaryOklch.c * 0.12), h);
    const borderMuted = mode === "light" ? oklch(0.925, tint(0.35, 0.01), h) : oklch(Math.min(1, darkAnchorL + 0.114), darkAnchorC * 0.8, neutralH);
    const border = mode === "light" ? oklch(0.9, tint(0.4, 0.012), h) : oklch(Math.min(1, darkAnchorL + 0.154), darkAnchorC * 0.9, neutralH);
    const borderStrong = mode === "light" ? oklch(0.815, tint(0.5, 0.016), h) : oklch(Math.min(1, darkAnchorL + 0.244), darkAnchorC, neutralH);
    const inputBg = mode === "light" ? "#ffffff" : oklch(Math.min(1, darkAnchorL + 0.048), darkAnchorC, neutralH);
    const scaleHexes = scale.map((s) => s.hex);
    const whiteCandidate = "#ffffff";
    const darkCandidate = mode === "light" ? oklch(0.205, 0.02, h) : oklch(0.165, 0.015, h);
    const fgCandidates = [whiteCandidate, darkCandidate];
    const usableAsRole = (hex) => contrastRatio(hex, background) >= AA_NORMAL && fgCandidates.some((fg) => contrastRatio(fg, hex) >= AA_NORMAL);
    const primaryPool = mode === "light" ? [primaryHex, ...scaleHexes] : [...scaleHexes, primaryHex];
    const primaryBase = pickClosest(primaryPool, primaryHex, usableAsRole);
    const baseL = rgbToOklch(hexToRgb(primaryBase)).l;
    const primaryHover = mode === "light" ? setLightness(primaryBase, baseL - 0.04) : setLightness(primaryBase, baseL + 0.05);
    const primaryActive = mode === "light" ? setLightness(primaryBase, baseL - 0.08) : setLightness(primaryBase, Math.max(0.1, baseL - 0.03));
    const primaryForeground = pickForeground(fgCandidates, primaryBase);
    const secondarySeed = rgbToOklch(hexToRgb(secondarySeedHex));
    const secondaryHue = secondarySeed.c < 8e-3 ? h : secondarySeed.h;
    const secondaryChromaCap = mode === "light" ? 0.22 : 0.24;
    const secondaryChroma = Math.min(
      secondaryChromaCap,
      Math.max(0.04, secondarySeed.c)
    );
    const secondaryPool = [];
    for (let i = 0; i <= 16; i++) {
      const l = mode === "light" ? 0.18 + i * 0.045 : 0.26 + i * 0.04;
      secondaryPool.push(oklch(clampL(l), secondaryChroma, secondaryHue));
    }
    const secondaryUsable = (hex) => contrastRatio(hex, background) >= AA_LARGE && fgCandidates.some((fg) => contrastRatio(fg, hex) >= AA_NORMAL);
    const secondaryReferenceL = mode === "light" ? Math.min(0.9, Math.max(0.2, secondarySeed.l)) : Math.min(0.86, Math.max(0.28, secondarySeed.l));
    const secondaryReference = oklch(
      secondaryReferenceL,
      secondaryChroma,
      secondaryHue
    );
    const secondary = pickClosest(secondaryPool, secondaryReference, secondaryUsable);
    const secondaryForeground = pickForeground(
      [whiteCandidate, darkCandidate],
      secondary
    );
    const hoverHex = (baseHex) => {
      const base = rgbToOklch(hexToRgb(baseHex));
      const step = mode === "light" ? -0.06 : 0.06;
      const canonical = oklch(clampL(base.l + step), base.c, base.h);
      if (contrastRatio(canonical, secondaryForeground) >= AA_NORMAL) return canonical;
      const opposite = oklch(clampL(base.l - step), base.c, base.h);
      return contrastRatio(opposite, secondaryForeground) >= AA_NORMAL ? opposite : baseHex;
    };
    const secondaryHover = hoverHex(secondary);
    const accentSeed = rgbToOklch(hexToRgb(accentSeedHex));
    const accentChromaCap = mode === "light" ? 0.24 : 0.26;
    const accentChroma = Math.min(accentChromaCap, Math.max(0.04, accentSeed.c));
    const accentHue = accentSeed.c < 8e-3 ? h : accentSeed.h;
    const accentPool = [];
    for (let i = 0; i <= 14; i++) {
      const l = mode === "light" ? 0.22 + i * 0.049 : 0.3 + i * 0.043;
      accentPool.push(oklch(clampL(l), accentChroma, accentHue));
    }
    const accentReferenceL = mode === "light" ? Math.min(0.9, Math.max(0.24, accentSeed.l)) : Math.min(0.88, Math.max(0.32, accentSeed.l));
    const accentReference = oklch(accentReferenceL, accentChroma, accentHue);
    const accent = pickClosest(accentPool, accentReference, usableAsRole);
    const accentForeground = pickForeground(fgCandidates, accent);
    const success = statusPair(STATUS_SPECS[0], mode, darkCandidate);
    const warning = statusPair(STATUS_SPECS[1], mode, darkCandidate);
    const danger = statusPair(STATUS_SPECS[2], mode, darkCandidate);
    const info = statusPair(STATUS_SPECS[3], mode, darkCandidate);
    return {
      background,
      "background-subtle": backgroundSubtle,
      surface,
      "surface-raised": surfaceRaised,
      "surface-muted": surfaceMuted,
      foreground,
      "foreground-muted": foregroundMuted,
      "foreground-subtle": foregroundSubtle,
      primary: primaryBase,
      "primary-hover": primaryHover,
      "primary-active": primaryActive,
      "primary-foreground": primaryForeground,
      secondary,
      "secondary-hover": secondaryHover,
      "secondary-foreground": secondaryForeground,
      accent,
      "accent-foreground": accentForeground,
      border,
      "border-muted": borderMuted,
      "border-strong": borderStrong,
      input: inputBg,
      "input-border": border,
      "focus-ring": primaryBase,
      success: success.value,
      "success-foreground": success.foreground,
      warning: warning.value,
      "warning-foreground": warning.foreground,
      danger: danger.value,
      "danger-foreground": danger.foreground,
      info: info.value,
      "info-foreground": info.foreground
    };
  }
  var CHECK_PAIRS = [
    { id: "body", label: "Body text on page background", fg: "foreground", bg: "background" },
    { id: "muted-text", label: "Muted text on page background", fg: "foreground-muted", bg: "background" },
    { id: "card-text", label: "Body text on cards", fg: "foreground", bg: "surface" },
    { id: "primary-button", label: "Primary button", fg: "primary-foreground", bg: "primary" },
    { id: "secondary-button", label: "Secondary button", fg: "secondary-foreground", bg: "secondary" },
    { id: "accent-element", label: "Accent element", fg: "accent-foreground", bg: "accent" },
    { id: "success-badge", label: "Success badge", fg: "success-foreground", bg: "success" },
    { id: "warning-badge", label: "Warning badge", fg: "warning-foreground", bg: "warning" },
    { id: "danger-badge", label: "Danger badge", fg: "danger-foreground", bg: "danger" },
    { id: "info-badge", label: "Info badge", fg: "info-foreground", bg: "info" }
  ];
  var CHECK_PAIR_TOKENS = Object.fromEntries(
    CHECK_PAIRS.map((p) => [p.id, { fg: p.fg, bg: p.bg }])
  );
  function buildAccessibilityReport(themes) {
    const checks = [];
    const summary = {
      light: { passed: true, failing: 0 },
      dark: { passed: true, failing: 0 }
    };
    for (const mode of ["light", "dark"]) {
      const tokens = themes[mode];
      for (const pair of CHECK_PAIRS) {
        const foregroundHex = tokens[pair.fg];
        const backgroundHex = tokens[pair.bg];
        checks.push({
          id: `${pair.id}-${mode}`,
          label: pair.label,
          foregroundHex,
          backgroundHex,
          mode,
          grade: grade(contrastRatio(foregroundHex, backgroundHex))
        });
      }
      const failing = checks.filter((c) => c.mode === mode && !c.grade.aaNormal).length;
      summary[mode] = { passed: failing === 0, failing };
    }
    return { checks, summary };
  }

  // src/lib/design-system/share.ts
  var DARK_BACKGROUNDS = ["tinted", "solid-black", "custom"];
  var FONT_PAIRING_IDS = [
    "system",
    "grotesque",
    "editorial",
    "humanist",
    "geometric",
    "technical"
  ];
  var DEFAULT_CONFIG = {
    primary: "#47003a",
    paletteStrategy: "complementary",
    paletteSize: 6,
    lockedIndices: [],
    paletteOverrides: {},
    radiusStyle: "soft",
    typeRatio: 1.25,
    refinement: __spreadValues({}, ZERO_REFINEMENT),
    darkBackground: "tinted",
    customDarkBg: void 0,
    fontPairing: "system"
  };
  function normaliseConfig(config) {
    var _a2, _b, _c;
    return __spreadProps(__spreadValues(__spreadValues({}, DEFAULT_CONFIG), config), {
      secondary: config.secondary || void 0,
      accent: config.accent || void 0,
      lockedIndices: Array.isArray(config.lockedIndices) ? config.lockedIndices : [],
      paletteOverrides: (_a2 = config.paletteOverrides) != null ? _a2 : {},
      paletteSize: Math.min(10, Math.max(3, Math.round((_b = config.paletteSize) != null ? _b : DEFAULT_CONFIG.paletteSize))),
      refinement: __spreadValues(__spreadValues({}, ZERO_REFINEMENT), (_c = config.refinement) != null ? _c : {}),
      darkBackground: config.darkBackground && DARK_BACKGROUNDS.includes(config.darkBackground) ? config.darkBackground : DEFAULT_CONFIG.darkBackground,
      fontPairing: config.fontPairing && FONT_PAIRING_IDS.includes(config.fontPairing) ? config.fontPairing : DEFAULT_CONFIG.fontPairing
    });
  }

  // src/lib/design-system/index.ts
  var GENERATOR_VERSION = "1.3.0";
  function refinedSeeds(config) {
    const r = config.refinement;
    return {
      primary: applyRefinement(config.primary, r),
      secondary: config.secondary ? applyRefinement(config.secondary, r) : void 0,
      accent: config.accent ? applyRefinement(config.accent, r) : void 0
    };
  }
  function resolveDarkBackgroundHex(config) {
    if (config.darkBackground === "solid-black") return "#000000";
    if (config.darkBackground === "custom" && config.customDarkBg) {
      try {
        return toColourValue(config.customDarkBg).hex;
      } catch (e) {
        return void 0;
      }
    }
    return void 0;
  }
  function buildDesignSystem(input) {
    var _a2, _b;
    const config = normaliseConfig(input);
    const seeds = refinedSeeds(config);
    const primaryValue = toColourValue(seeds.primary);
    const scale = generateScale(primaryValue.hex);
    const basePalette = generatePalette(
      toColourValue(config.primary).hex,
      config.paletteStrategy,
      { overrides: config.paletteOverrides, size: config.paletteSize }
    );
    const refinedPalette = generatePalette(primaryValue.hex, config.paletteStrategy, {
      overrides: config.paletteOverrides,
      size: config.paletteSize
    });
    const palette = basePalette.map((swatch, index) => {
      if (config.lockedIndices.includes(index) || config.paletteOverrides[index]) {
        return swatch;
      }
      return refinedPalette[index];
    });
    const companions = deriveCompanions(primaryValue.hex);
    const secondaryHex = (_a2 = seeds.secondary) != null ? _a2 : companions.secondary;
    const accentHex = (_b = seeds.accent) != null ? _b : companions.accent;
    const themes = {
      light: generateTheme(
        { primaryHex: primaryValue.hex, scale, accentSeedHex: accentHex, secondarySeedHex: secondaryHex },
        "light"
      ),
      dark: generateTheme(
        {
          primaryHex: primaryValue.hex,
          scale,
          accentSeedHex: accentHex,
          secondarySeedHex: secondaryHex,
          darkBackgroundHex: resolveDarkBackgroundHex(config)
        },
        "dark"
      )
    };
    const accessibility = buildAccessibilityReport(themes);
    return {
      metadata: {
        name: `Design system ${primaryValue.hex.toUpperCase()}`,
        sourceKind: "hex",
        generatorVersion: GENERATOR_VERSION
      },
      source: {
        input: config.primary,
        primary: primaryValue
      },
      configuration: config,
      primitives: {
        colors: {
          scale,
          palette,
          secondarySeed: toColourValue(secondaryHex),
          accentSeed: toColourValue(accentHex)
        },
        typography: generateTypography(config.typeRatio, config.fontPairing),
        spacing: generateSpacing(),
        radius: generateRadius(config.radiusStyle),
        shadows: generateShadows()
      },
      themes,
      accessibility
    };
  }

  // figma-plugin/src/token-plan.ts
  var TOKEN_PLAN_MODES = ["Light", "Dark"];
  function slugify(label) {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return slug || "colour";
  }
  function buildTokenPlan(designSystem) {
    var _a2;
    const variables = [];
    const taken = /* @__PURE__ */ new Set();
    const claim = (base) => {
      let name = base;
      for (let suffix = 2; taken.has(name); suffix += 1) name = `${base}-${suffix}`;
      taken.add(name);
      return name;
    };
    const both = (hex) => ({ Light: hex, Dark: hex });
    for (const step of designSystem.primitives.colors.scale) {
      variables.push({ name: claim(`scale/${step.step}`), values: both(step.hex) });
    }
    for (const swatch of designSystem.primitives.colors.palette) {
      variables.push({ name: claim(`palette/${slugify(swatch.role)}`), values: both(swatch.hex) });
    }
    const { light, dark } = designSystem.themes;
    for (const [tokenId, lightHex] of Object.entries(light)) {
      variables.push({
        name: claim(`semantic/${tokenId}`),
        values: { Light: lightHex, Dark: (_a2 = dark[tokenId]) != null ? _a2 : lightHex }
      });
    }
    return {
      collectionName: `ChromaBrew ${designSystem.source.primary.hex.toUpperCase()}`,
      modes: TOKEN_PLAN_MODES,
      variables
    };
  }

  // figma-plugin/src/code.ts
  figma.showUI(__html__, { width: 300, height: 176, themeColors: true });
  function selectedSolidHex() {
    try {
      const node = figma.currentPage.selection[0];
      if (!node || !("fills" in node) || !Array.isArray(node.fills)) return null;
      const solid = node.fills.find((fill) => fill.type === "SOLID" && fill.visible !== false);
      if (!solid || solid.type !== "SOLID") return null;
      const { r, g, b } = solid.color;
      return `#${[r, g, b].map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0")).join("")}`;
    } catch (e) {
      return null;
    }
  }
  function toRgba(hex) {
    const bare = hex.replace(/^#/, "");
    const full = bare.length === 3 ? bare.split("").map((c) => c + c).join("") : bare;
    const int = Number.parseInt(full, 16);
    if (Number.isNaN(int)) throw new Error(`Cannot parse "${hex}" as a colour`);
    return {
      r: (int >> 16 & 255) / 255,
      g: (int >> 8 & 255) / 255,
      b: (int & 255) / 255,
      a: 1
    };
  }
  function modeIdFor(collection, name) {
    const existing = collection.modes.find((mode) => mode.name === name);
    if (existing) return existing.modeId;
    if (name === "Light") {
      const fallback = collection.modes[0];
      if (fallback) {
        collection.renameMode(fallback.modeId, "Light");
        return fallback.modeId;
      }
    }
    return collection.addMode(name);
  }
  function applyTokenPlan(plan) {
    var _a2;
    const collection = (_a2 = figma.variables.getLocalVariableCollections().find((candidate) => candidate.name === plan.collectionName)) != null ? _a2 : figma.variables.createVariableCollection(plan.collectionName);
    const modeIds = new Map(plan.modes.map((mode) => [mode, modeIdFor(collection, mode)]));
    const locals = figma.variables.getLocalVariables("COLOR");
    for (const planned of plan.variables) {
      const existing = locals.find(
        (variable2) => variable2.variableCollectionId === collection.id && variable2.name === planned.name
      );
      const variable = existing != null ? existing : figma.variables.createVariable(planned.name, collection, "COLOR");
      for (const mode of plan.modes) {
        variable.setValueForMode(modeIds.get(mode), toRgba(planned.values[mode]));
      }
    }
    return plan.variables.length;
  }
  var _a;
  figma.ui.postMessage({ type: "prefill", hex: (_a = selectedSolidHex()) != null ? _a : DEFAULT_CONFIG.primary });
  figma.ui.onmessage = (raw) => {
    const message = raw;
    if ((message == null ? void 0 : message.type) !== "generate") return;
    try {
      const hex = normalizeHex(message.hex);
      if (!hex) {
        figma.ui.postMessage({
          type: "error",
          message: `"${message.hex}" is not a valid hex colour \u2014 try #47003a.`
        });
        return;
      }
      const designSystem = buildDesignSystem(__spreadProps(__spreadValues({}, DEFAULT_CONFIG), { primary: hex }));
      const plan = buildTokenPlan(designSystem);
      const count = applyTokenPlan(plan);
      figma.notify(
        `ChromaBrew: ${count} variables added to "${plan.collectionName}" (Light + Dark)`
      );
      figma.closePlugin();
    } catch (error) {
      figma.ui.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Generation failed."
      });
    }
  };
})();
