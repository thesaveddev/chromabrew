"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_PALETTE_SETTINGS,
  applyPaletteSettings,
  parseQuickPalette,
  quickPalette,
  randomPleasantColour,
  serializeQuickPalette,
  settingsAreDefault,
  type PaletteSettings,
  type StrategyChoice,
} from "@/lib/quick-palette";
import { PALETTE_STRATEGIES } from "@/lib/design-system/palette/generate";
import { closestNamedColour } from "@/lib/css-colors";
import { contrastRatio } from "@/lib/design-system/colour/contrast";
import {
  hexToRgb,
  rgbToCmyk,
  rgbToHsl,
  rgbToOklch,
  oklchToHex,
  normalizeHex,
} from "@/lib/design-system/colour/convert";
import { Button, LockIcon, TabList, copyToClipboard } from "@/components/ui/primitives";

const STRATEGY_OPTIONS: { id: StrategyChoice; label: string }[] = [
  { id: "random", label: "Random" },
  ...PALETTE_STRATEGIES.map((s) => ({ id: s.id as StrategyChoice, label: s.label })),
];

const SLIDERS: Array<{
  key: keyof PaletteSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  neutral: number;
  signed: boolean;
}> = [
  { key: "hueShift", label: "Hue", min: -180, max: 180, step: 5, unit: "°", neutral: 0, signed: true },
  { key: "brightness", label: "Brightness", min: -100, max: 100, step: 1, unit: "%", neutral: 0, signed: true },
  { key: "vibrance", label: "Vibrance", min: 0, max: 200, step: 5, unit: "%", neutral: 100, signed: false },
  { key: "contrast", label: "Contrast", min: 0, max: 200, step: 5, unit: "%", neutral: 100, signed: false },
];

/**
 * The fixed first-paint palette. Server HTML and the first client render must
 * agree byte-for-byte; a random palette in a useState initializer can never
 * match the prerendered one, which is how this page earned a hydration
 * error. The real palette — from the share URL or a fresh shuffle — is
 * adopted right after hydration, mirroring how the design-system workspace
 * adopts URL config post-mount.
 */
const FIRST_PAINT_PALETTE = ["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

/**
 * Legible ink for text sitting directly on a swatch: near-black on light
 * colours, white on dark ones, plus a soft pill wash behind floating
 * controls so they read at rest instead of only on hover.
 */
function inkOn(hex: string): { color: string; pill: string; shadow: string } {
  const n = parseInt(hex.replace("#", ""), 16);
  const lum =
    (0.2126 * ((n >> 16) & 0xff) +
      0.7152 * ((n >> 8) & 0xff) +
      0.0722 * (n & 0xff)) /
    255;
  return lum > 0.42
    ? { color: "#18181b", pill: "rgba(0,0,0,0.10)", shadow: "none" }
    : {
        color: "#fafafa",
        pill: "rgba(255,255,255,0.18)",
        shadow: "0 1px 10px rgba(0,0,0,0.35)",
      };
}

/* ------------------------------------------------------------------ */
/* Human color names                                                   */
/* ------------------------------------------------------------------ */

/** Morphemes the 148 CSS names are built from, longest-first for greedy segmentation. */
const NAME_WORDS = [
  "blanched", "chartreuse", "cornflower", "floral", "goldenrod", "honeydew", "indian",
  "lavender", "lemon", "midnight", "motion", "navajo", "old", "papaya", "powder",
  "rebecca", "rosy", "saddle", "sandy", "slate", "spring", "steel", "thistle",
  "alice", "antique", "aqua", "azure", "beige", "bisque", "black", "blue", "brown",
  "burly", "cadet", "chocolate", "coral", "corn", "crimson", "cyan", "dark", "deep",
  "dim", "dodger", "fire", "forest", "fuchsia", "gainsboro", "ghost", "gold", "gray",
  "green", "grey", "hot", "indigo", "ivory", "khaki", "lawn", "light", "lime", "linen",
  "magenta", "maroon", "medium", "mint", "misty", "moccasin", "navy", "olive", "orange",
  "orchid", "pale", "peach", "peru", "pink", "plum", "purple", "red", "royal",
  "salmon", "sea", "shell", "sienna", "silver", "sky", "snow", "tan", "teal",
  "tomato", "turquoise", "violet", "wheat", "white", "smoke", "yellow", "brick",
  "drab", "almond", "chiffon", "cress", "dodge", "wood", "silk", "whip", "weed",
].sort((a, b) => b.length - a.length);

const WORD_SET = new Set(NAME_WORDS);

/** "darkslategray" → "Dark Slate Gray". Unknown runs fall back to capitalised. */
export function humanizeColorName(name: string): string {
  const lower = name.toLowerCase();
  const parts: string[] = [];
  let rest = lower;
  let guard = 0;
  while (rest.length > 0 && guard++ < 12) {
    let matched = "";
    for (const word of NAME_WORDS) {
      if (rest.startsWith(word) && word.length > matched.length) matched = word;
    }
    if (!matched) {
      // No morpheme matches: take the whole remainder so we always terminate.
      parts.push(rest);
      break;
    }
    parts.push(matched);
    rest = rest.slice(matched.length);
  }
  // Tiny glue words ("de", "la") are not in the table; if segmentation left
  // a stub under 2 chars, rejoin it so we never render "Dodge R Blue"-style junk.
  const cleaned = parts
    .map((p) => (WORD_SET.has(p) || p.length > 2 ? p : null))
    .filter(Boolean) as string[];
  const words = cleaned.length > 0 ? cleaned : parts;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/* ------------------------------------------------------------------ */
/* Colour helpers                                                      */
/* ------------------------------------------------------------------ */

function rgbString(hex: string): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `${r}, ${g}, ${b}`;
  } catch {
    return "";
  }
}

function hslString(hex: string): string {
  try {
    const { h, s, l } = rgbToHsl(hexToRgb(hex));
    return `${Math.round(h)}°, ${Math.round(s)}%, ${Math.round(l)}%`;
  } catch {
    return "";
  }
}

function cmykString(hex: string): string {
  try {
    const { c, m, y, k } = rgbToCmyk(hexToRgb(hex));
    return `${Math.round(c)} · ${Math.round(m)} · ${Math.round(y)} · ${Math.round(k)}`;
  } catch {
    return "";
  }
}

/** Twelve tints/shades of a colour across the OKLCH lightness axis. */
function shadesOf(hex: string): string[] {
  try {
    const { c, h } = rgbToOklch(hexToRgb(hex));
    return Array.from({ length: 12 }, (_, k) =>
      oklchToHex({ l: 0.1 + ((0.95 - 0.1) * k) / 11, c: Math.min(c, 0.28), h }),
    );
  } catch {
    return [hex];
  }
}

function oklchString(hex: string): string {
  try {
    const { l, c, h } = rgbToOklch(hexToRgb(hex));
    return `${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)}°`;
  } catch {
    return "";
  }
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function CopyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="7" y="7" width="9" height="9" rx="2.5" />
      <path d="M13 7V5.5A2.5 2.5 0 0 0 10.5 3h-5A2.5 2.5 0 0 0 3 5.5v5A2.5 2.5 0 0 0 5.5 13H7" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

function ShadesIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden>
      <rect x="2.5" y="2.5" width="15" height="4" rx="2" opacity="0.45" />
      <rect x="2.5" y="8" width="15" height="4" rx="2" opacity="0.7" />
      <rect x="2.5" y="13.5" width="15" height="4" rx="2" />
    </svg>
  );
}

function ContrastIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 2.5a7.5 7.5 0 0 1 0 15z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PencilIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 16.5 4.6 13l9.5-9.5a1.8 1.8 0 0 1 2.6 0l.3.3a1.8 1.8 0 0 1 0 2.6L7.5 16z" />
      <path d="M12.5 5.5c.8-.8 1.7-1.5 2.8-2M5 19h14" />
    </svg>
  );
}

function PipetteIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m2.5 17.5 1-4L13 4l3.5 3.5L7 17z" />
      <path d="M14 3.5l2.5 2.5" />
    </svg>
  );
}

/** Keyboard — type a hex value (distinct from the pipette picker). */
function TypeHexIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="5.5" width="16" height="10" rx="2.5" />
      <path d="M5.2 8.6h1.6M8.4 8.6h1.6M11.6 8.6h1.6M14.4 8.6h.4M5.2 11.4h1.6M8.4 11.4h4.4M14.4 11.4h.4M7 13.4h6" strokeWidth={1.4} />
    </svg>
  );
}

function InfoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9.3V14" />
      <circle cx="10" cy="6.8" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BookmarkIcon({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5.5 3h9a1 1 0 0 1 1 1v12.5L10 13.5l-5.5 3V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function PlusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function DragIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden>
      <circle cx="7" cy="4.5" r="1.6" />
      <circle cx="13" cy="4.5" r="1.6" />
      <circle cx="7" cy="10" r="1.6" />
      <circle cx="13" cy="10" r="1.6" />
      <circle cx="7" cy="15.5" r="1.6" />
      <circle cx="13" cy="15.5" r="1.6" />
    </svg>
  );
}

type ValueFormat = "rgb" | "hsl" | "cmyk";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function FastGenerator() {
  // One lazy init for both — two separate initializers would disagree about
  // what is on screen.
  const [initial] = useState(() => ({
    colors: FIRST_PAINT_PALETTE,
    locked: FIRST_PAINT_PALETTE.map(() => false),
  }));
  /** The raw generated palette — sliders transform it, they never own it. */
  const [base, setBase] = useState<string[]>(initial.colors);
  const [locked, setLocked] = useState<boolean[]>(initial.locked);
  const [settings, setSettings] = useState<PaletteSettings>({ ...DEFAULT_PALETTE_SETTINGS });
  const [strategy, setStrategy] = useState<StrategyChoice>("random");
  const [copied, setCopied] = useState<string | null>(null);

  // Overlays: only one open at a time.
  const [tuneOpen, setTuneOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"gradient" | "list" | "contrast">("gradient");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTab, setExportTab] = useState<"share" | "code" | "image">("share");
  const [codeFormat, setCodeFormat] = useState<"css" | "tailwind" | "json" | "hex" | "rgb" | "svg">("css");
  const [imgSize, setImgSize] = useState<"s" | "m" | "l">("m");
  const [imgLabels, setImgLabels] = useState(true);
  const [valueFormat, setValueFormat] = useState<ValueFormat>("rgb");
  const [savedOpen, setSavedOpen] = useState(false);
  interface SavedEntry {
    id: string;
    name: string;
    kind: "palette" | "color";
    colors: string[];
    color?: string;
    createdAt: string;
  }
  const [savedList, setSavedList] = useState<SavedEntry[]>([]);
  const [infoFor, setInfoFor] = useState<number | null>(null);

  // Per-column popovers.
  const [shadesFor, setShadesFor] = useState<number | null>(null);
  const [contrastFor, setContrastFor] = useState<number | null>(null);
  const [editingHex, setEditingHex] = useState<number | null>(null);
  const [hexDraft, setHexDraft] = useState("");
  const [hexError, setHexError] = useState(false);
  const dragFrom = useRef<number | null>(null);
  /** Column under the pointer — the target for the hover + L lock shortcut. */
  const hoveredRef = useRef<number | null>(null);
  const colorsRef = useRef<string[]>([]);
  const lockedRef = useRef<boolean[]>([]);
  useEffect(() => {
    colorsRef.current = colors;
    lockedRef.current = locked;
  });

  const closeOverlays = useCallback(() => {
    setTuneOpen(false);
    setViewOpen(false);
    setExportOpen(false);
    setShadesFor(null);
    setContrastFor(null);
    setEditingHex(null);
    setSavedOpen(false);
    setInfoFor(null);
  }, []);

  // What the user sees: tuning applied deterministically, keepers untouched.
  const colors = useMemo(
    () => applyPaletteSettings(base, locked, settings),
    [base, locked, settings],
  );

  // Closest CSS named colour per swatch — recomputed as sliders move.
  const names = useMemo(() => colors.map((c) => closestNamedColour(c)), [colors]);
  const displayNames = useMemo(
    () => names.map((n, i) => (n ? humanizeColorName(n.name) : `Color ${i + 1}`)),
    [names],
  );

  // Adopt the real palette strictly after hydration: the share URL wins,
  // otherwise roll a fresh one. Runs once.
  const adopted = useRef(false);
  useEffect(() => {
    if (adopted.current) return;
    adopted.current = true;
    const fromUrl = parseQuickPalette(
      new URLSearchParams(window.location.search).get("c"),
    );
    const next = fromUrl ?? quickPalette(FIRST_PAINT_PALETTE.length, []);
    // Locks are all-false in both branches; size the lock array to the
    // adopted palette so every column (not just the first five) can lock.
    setBase(next);
    setLocked(next.map(() => false));
  }, []);

  // Keep the URL shareable: every palette is a link to itself.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("c", serializeQuickPalette(colors));
    window.history.replaceState(null, "", url.toString());
  }, [colors]);

  // Escape closes any overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlays();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeOverlays]);

  const shuffle = useCallback(
    (forced?: StrategyChoice) => {
      const choice = forced ?? strategy;
      setBase((prev) => {
        const keep: (string | null)[] = prev.map((c, i) =>
          locked[i] ? c : null,
        );
        // When the count changed, locked slots beyond the palette are dropped.
        return quickPalette(prev.length, keep, choice);
      });
    },
    [locked, strategy],
  );

  // Spacebar generates — the signature interaction. Ignored while typing or
  // while a slider (a native input) holds focus, where space is the control's.
  // Hover + L toggles the lock on the column under the pointer (same guards:
  // never while typing, and never with a dialog open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";
      if (e.code === "Space" && !typing) {
        e.preventDefault();
        shuffle();
        return;
      }
      if (
        (e.key === "l" || e.key === "L") &&
        !typing &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        const index = hoveredRef.current;
        if (index === null || document.querySelector('[role="dialog"]')) return;
        e.preventDefault();
        const shown = colorsRef.current[index];
        if (!lockedRef.current[index] && shown) {
          setBase((prev) => prev.map((c, i) => (i === index ? shown : c)));
        }
        setLocked((prev) => prev.map((v, i) => (i === index ? !v : v)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shuffle]);

  const chooseStrategy = (next: StrategyChoice) => {
    setStrategy(next);
    // Picking a harmony is itself a generation: unlocked colours re-roll in
    // that strategy immediately instead of waiting for the next shuffle.
    shuffle(next);
  };

  const setControl = (key: keyof PaletteSettings, value: number) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const toggleLock = (index: number) => {
    if (!locked[index]) {
      // Freeze the colour exactly as it appears right now, tuning included —
      // unlocking later resumes tuning from this baked value.
      const shown = colors[index];
      setBase((prev) => prev.map((c, i) => (i === index ? shown : c)));
    }
    setLocked((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const setColorAt = (index: number, hex: string) => {
    const norm = normalizeHex(hex);
    if (!norm) return false;
    setBase((prev) => prev.map((c, i) => (i === index ? norm : c)));
    return true;
  };

  const editColor = (index: number, hex: string) => {
    setColorAt(index, hex);
  };

  const commitHexDraft = (index: number) => {
    if (setColorAt(index, hexDraft)) {
      setEditingHex(null);
      setHexError(false);
    } else {
      setHexError(true);
    }
  };

  const removeAt = (index: number) => {
    if (base.length <= 2) return;
    setBase((prev) => prev.filter((_, i) => i !== index));
    setLocked((prev) => prev.filter((_, i) => i !== index));
    setShadesFor(null);
    setContrastFor(null);
  };

  const reorder = useCallback((from: number, to: number) => {
    if (from === to || to < 0) return;
    setBase((prev) => {
      if (to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setLocked((prev) => {
      if (to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const flashCopied = (key: string) => {
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1400);
  };

  const copyColor = async (hex: string) => {
    if (await copyToClipboard(hex.toUpperCase())) flashCopied(hex);
  };

  const copyText = async (text: string, key: string) => {
    if (await copyToClipboard(text)) flashCopied(key);
  };

  const addColor = () => {
    setBase((prev) => (prev.length >= 8 ? prev : [...prev, randomPleasantColour()]));
    setLocked((prev) => (prev.length >= 8 ? prev : [...prev, false]));
  };
  const insertAt = (index: number) => {
    if (base.length >= 8) return;
    const color = randomPleasantColour();
    setBase((prev) => [...prev.slice(0, index), color, ...prev.slice(index)]);
    setLocked((prev) => [...prev.slice(0, index), false, ...prev.slice(index)]);
  };

  /* ---- saved palettes (local library, no account needed) --------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("chromabrew-saved-palettes");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedList(parsed.filter((e) => e && Array.isArray(e.colors)));
      }
    } catch {
      /* corrupted storage — start fresh */
    }
  }, []);

  const persistSaved = (next: SavedEntry[]) => {
    setSavedList(next);
    try {
      localStorage.setItem("chromabrew-saved-palettes", JSON.stringify(next));
    } catch {
      /* storage full or blocked — library just stays in memory */
    }
  };

  const saveCurrent = () => {
    const entry: SavedEntry = {
      id: `${Date.now()}`,
      name: colors.length > 1 ? `${displayNames[0]} +${colors.length - 1}` : displayNames[0],
      kind: "palette",
      colors: [...colors],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persistSaved([entry, ...savedList].slice(0, 48));
    flashCopied("saved");
  };

  const isColorSaved = (hex: string) =>
    savedList.some((e) => e.kind === "color" && e.color?.toLowerCase() === hex.toLowerCase());

  const toggleSaveColor = (index: number) => {
    const hex = colors[index].toLowerCase();
    if (isColorSaved(hex)) {
      persistSaved(savedList.filter((e) => !(e.kind === "color" && e.color?.toLowerCase() === hex)));
    } else {
      const entry: SavedEntry = {
        id: `${Date.now()}`,
        name: displayNames[index],
        kind: "color",
        colors: [],
        color: hex,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      persistSaved([entry, ...savedList].slice(0, 48));
      flashCopied("saved");
    }
  };

  const applySaved = (entry: SavedEntry) => {
    if (entry.kind === "color" && entry.color) {
      copyColor(entry.color);
      setSavedOpen(false);
      return;
    }
    setBase([...entry.colors]);
    setLocked(entry.colors.map(() => false));
    setSavedOpen(false);
  };
  const removeColor = () => {
    setBase((prev) => (prev.length <= 2 ? prev : prev.slice(0, -1)));
    setLocked((prev) => (prev.length <= 2 ? prev : prev.slice(0, -1)));
  };

  /* ---- share / export content -------------------------------------- */

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("c", serializeQuickPalette(colors));
    return url.toString();
  }, [colors]);

  const gradientCss = useMemo(
    () => `background: linear-gradient(135deg, ${colors.map((c) => c.toUpperCase()).join(", ")});`,
    [colors],
  );

  const codeSnippet = useMemo(() => {
    switch (codeFormat) {
      case "css":
        return `:root {\n${colors.map((c, i) => `  --color-${displayNames[i].toLowerCase().replace(/[^a-z0-9]+/g, "-")}: ${c.toUpperCase()};`).join("\n")}\n}`;
      case "tailwind":
        return `theme: {\n  extend: {\n    colors: {\n${colors.map((c, i) => `      "${displayNames[i].toLowerCase().replace(/[^a-z0-9]+/g, "-")}": "${c.toUpperCase()}",`).join("\n")}\n    },\n  },\n}`;
      case "json":
        return JSON.stringify(
          colors.map((hex, i) => ({
            name: displayNames[i],
            hex: hex.toUpperCase(),
            rgb: rgbString(hex),
            hsl: hslString(hex),
          })),
          null,
          2,
        );
      case "hex":
        return colors.map((c) => c.toUpperCase()).join("\n");
      case "rgb":
        return colors.map((c) => `rgb(${rgbString(c)})`).join("\n");
      case "svg": {
        const w = 160;
        const h = 320;
        const rects = colors
          .map((c, i) => `  <rect x="${i * w}" y="0" width="${w}" height="${h}" fill="${c}"/>`)
          .join("\n");
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${colors.length * w}" height="${h}" viewBox="0 0 ${colors.length * w} ${h}">\n${rects}\n</svg>`;
      }
    }
  }, [codeFormat, colors, displayNames]);

  const codeFilename = useMemo(() => {
    const slug = serializeQuickPalette(colors).slice(0, 24) || "palette";
    switch (codeFormat) {
      case "css":
        return `${slug}.css`;
      case "tailwind":
        return "tailwind-snippet.txt";
      case "json":
        return `${slug}.json`;
      case "svg":
        return `${slug}.svg`;
      default:
        return `${slug}.txt`;
    }
  }, [codeFormat, colors]);

  const codeMime = codeFormat === "svg" ? "image/svg+xml" : codeFormat === "json" ? "application/json" : "text/plain;charset=utf-8";

  const embedSnippet = useMemo(() => {
    const cells = colors
      .map((c) => `<div style="flex:1;background:${c}"></div>`)
      .join("");
    return `<div style="display:flex;height:96px;border-radius:12px;overflow:hidden">${cells}</div>`;
  }, [colors]);

  const downloadPng = (scale: "s" | "m" | "l") => {
    const w = scale === "s" ? 200 : scale === "m" ? 320 : 480;
    const h = scale === "s" ? 200 : scale === "m" ? 320 : 480;
    const labelH = imgLabels ? 44 : 0;
    const canvas = document.createElement("canvas");
    canvas.width = colors.length * w;
    canvas.height = h + labelH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * w, 0, w, h);
      if (imgLabels) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(i * w, h, w, labelH);
        ctx.fillStyle = "#18181b";
        ctx.font = `${Math.round(w / 11)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(displayNames[i], i * w + w / 2, h + labelH / 2 - 2);
        ctx.fillStyle = "#52525b";
        ctx.font = `${Math.round(w / 13)}px monospace`;
        ctx.fillText(c.toUpperCase(), i * w + w / 2, h + labelH - 8);
      }
    });
    const anchor = document.createElement("a");
    anchor.download = "chromabrew-palette.png";
    anchor.href = canvas.toDataURL("image/png");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    flashCopied("png");
  };

  // Carry the whole palette over: first color leads, next two follow as
  // secondary + accent so the design system starts from what you see here.
  const generatorHref = useMemo(() => {
    const params = new URLSearchParams();
    if (colors[0]) params.set("primary", colors[0].replace("#", ""));
    if (colors[1]) params.set("secondary", colors[1].replace("#", ""));
    if (colors[2]) params.set("accent", colors[2].replace("#", ""));
    return `/design-system?${params.toString()}`;
  }, [colors]);

  const tuningActive = !settingsAreDefault(settings);
  const anyOverlay = tuneOpen || viewOpen || exportOpen || savedOpen || shadesFor !== null || contrastFor !== null || infoFor !== null;
  const tuningLabel = [
    strategy === "random" ? null : STRATEGY_OPTIONS.find((o) => o.id === strategy)?.label,
    tuningActive ? "tuned" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const valueLine = (hex: string) =>
    valueFormat === "hsl" ? `hsl(${hslString(hex)})` : valueFormat === "cmyk" ? `cmyk(${cmykString(hex)})` : `rgb(${rgbString(hex)})`;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-950">
      {/* Single toolbar: Shuffle is the hero; View / Tune / Export answer "what now?". */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-zinc-200 px-4 py-2.5 sm:gap-x-3 sm:px-8 dark:border-zinc-800 lg:px-12">
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-100">
            Press space. <span className="font-medium text-zinc-500 dark:text-zinc-400">Keep the good ones.</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => shuffle()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Shuffle&nbsp;<kbd className="rounded bg-white/20 px-1.5 py-0.5 text-xs dark:bg-zinc-900/10">space</kbd>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewOpen(true);
              setExportOpen(false);
              setTuneOpen(false);
              setSavedOpen(false);
            }}
            className="rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => {
              setTuneOpen((o) => !o);
              setViewOpen(false);
              setExportOpen(false);
              setSavedOpen(false);
            }}
            aria-expanded={tuneOpen}
            className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors dark:border-zinc-700 ${
              tuningActive || strategy !== "random"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-zinc-300 text-zinc-700 hover:border-zinc-500 dark:text-zinc-300"
            }`}
          >
            Tune{tuningLabel ? ` · ${tuningLabel}` : ""}
          </button>
          <button
            type="button"
            onClick={() => {
              setExportOpen(true);
              setViewOpen(false);
              setTuneOpen(false);
              setSavedOpen(false);
            }}
            className="rounded-lg border border-zinc-900 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {copied === "exported" ? "Exported ✓" : "Export · Share"}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSavedOpen((o) => !o);
                setViewOpen(false);
                setExportOpen(false);
                setTuneOpen(false);
              }}
              aria-expanded={savedOpen}
              className="rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
            >
              {copied === "saved" ? "Saved ✓" : savedList.length ? `Saved (${savedList.length})` : "Save"}
            </button>
            {savedOpen ? (
              <>
                <button type="button" aria-label="Close saved palettes" className="fixed inset-0 z-30 cursor-default" onClick={() => setSavedOpen(false)} />
                <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="p-3">
                    <Button type="button" variant="primary" className="w-full px-3 py-2 text-sm" onClick={saveCurrent}>
                      Save current palette
                    </Button>
                    <p className="mt-1.5 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
                      Kept in this browser — no account needed. Open any saved palette to keep shuffling from it.
                    </p>
                  </div>
                  {savedList.length ? (
                    <ul className="max-h-64 overflow-y-auto border-t border-zinc-200 dark:border-zinc-700">
                      {savedList.map((entry) => (
                        <li key={entry.id} className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                          <button
                            type="button"
                            onClick={() => applySaved(entry)}
                            title={entry.kind === "color" ? `Copy ${entry.color?.toUpperCase()}` : `Open ${entry.name}`}
                            className="min-w-0 flex-1 text-left"
                          >
                            {entry.kind === "color" && entry.color ? (
                              <span className="flex items-center gap-2">
                                <span className="h-7 w-7 shrink-0 rounded-md ring-1 ring-black/10" style={{ backgroundColor: entry.color }} aria-hidden />
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">{entry.name}</span>
                                  <span className="block font-mono text-[11px] uppercase text-zinc-400">{entry.color.toUpperCase()} · {entry.createdAt}</span>
                                </span>
                              </span>
                            ) : (
                              <>
                                <span className="flex h-7 overflow-hidden rounded-md ring-1 ring-black/10" aria-hidden>
                                  {entry.colors.map((c) => (
                                    <span key={c} className="h-full flex-1" style={{ backgroundColor: c }} />
                                  ))}
                                </span>
                                <span className="mt-1 block truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                  {entry.name} <span className="font-normal text-zinc-400">· {entry.createdAt}</span>
                                </span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => persistSaved(savedList.filter((e) => e.id !== entry.id))}
                            aria-label={`Delete ${entry.name}`}
                            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                          >
                            <CloseIcon />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={removeColor}
            disabled={colors.length <= 2}
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 font-medium hover:border-zinc-500 disabled:opacity-40 dark:border-zinc-700"
            aria-label="Remove last color"
          >
            −
          </button>
          <span className="min-w-14 text-center tabular-nums" aria-live="polite">
            {colors.length} colors
          </span>
          <button
            type="button"
            onClick={addColor}
            disabled={colors.length >= 8}
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 font-medium hover:border-zinc-500 disabled:opacity-40 dark:border-zinc-700"
            aria-label="Add a color"
          >
            +
          </button>
        </div>
      </div>

      {/* The palette owns the rest of the viewport; small screens scroll it. */}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:flex-row sm:overflow-hidden"
        role="list"
        aria-label="Generated palette"
      >
        {colors.map((hex, i) => {
          const ink = inkOn(hex);
          const named = names[i];
          const shades = shadesFor === i ? shadesOf(hex) : null;
          const shadeTargetL = shades ? (() => { try { return rgbToOklch(hexToRgb(hex)).l; } catch { return 0.5; } })() : 0.5;
          const nearestShade = shades
            ? shades.reduce((best, s, k) => {
                try {
                  const l = rgbToOklch(hexToRgb(s)).l;
                  const bl = rgbToOklch(hexToRgb(shades[best])).l;
                  return Math.abs(l - shadeTargetL) < Math.abs(bl - shadeTargetL) ? k : best;
                } catch { return best; }
              }, 0)
            : -1;
          const colorSaved = isColorSaved(hex);
          const showContrast = contrastFor === i;
          const ratioWhite = contrastRatio(hex, "#ffffff");
          const ratioBlack = contrastRatio(hex, "#000000");
          const bestOn = ratioWhite >= ratioBlack ? "#ffffff" : "#000000";
          return (
          <div
            key={`${i}-${colors.length}`}
            role="listitem"
            onMouseEnter={() => {
              hoveredRef.current = i;
            }}
            onMouseLeave={() => {
              if (hoveredRef.current === i) hoveredRef.current = null;
            }}
            draggable={shadesFor !== i && !showContrast}
            onDragStart={() => {
              dragFrom.current = i;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom.current !== null) {
                reorder(dragFrom.current, i);
                dragFrom.current = null;
              }
            }}
            className="group relative flex min-h-40 flex-1 flex-col items-center justify-center gap-1 px-3 py-6 text-center transition-[flex] sm:min-h-0 sm:py-0"
            style={{ backgroundColor: hex }}
          >
            {/* Hover action rail: reorder, shades, contrast, remove. */}
            <div
              className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/10 px-1.5 py-1 opacity-100 backdrop-blur-sm transition-opacity sm:top-5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:bg-white/15"
              style={{ color: ink.color }}
            >
              <span
                title="Drag to reorder"
                className="cursor-grab rounded-full p-2 opacity-70"
                aria-hidden
              >
                <DragIcon />
              </span>
              <button
                type="button"
                onClick={() => {
                  setShadesFor(shadesFor === i ? null : i);
                  setContrastFor(null);
                }}
                aria-label={shadesFor === i ? `Hide shades of color ${i + 1}` : `Show shades of color ${i + 1}`}
                aria-pressed={shadesFor === i}
                title="Shades — pick a tint or shade"
                className={`rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/20 ${shadesFor === i ? "bg-black/15 dark:bg-white/25" : ""}`}
              >
                <ShadesIcon />
              </button>
              <button
                type="button"
                onClick={() => {
                  setContrastFor(showContrast ? null : i);
                  setShadesFor(null);
                }}
                aria-label={showContrast ? `Hide contrast for color ${i + 1}` : `Check contrast for color ${i + 1}`}
                aria-pressed={showContrast}
                title="Contrast — text readability"
                className={`rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/20 ${showContrast ? "bg-black/15 dark:bg-white/25" : ""}`}
              >
                <ContrastIcon />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingHex(i);
                  setHexDraft(hex.replace("#", ""));
                  setHexError(false);
                }}
                aria-label={`Type a hex value for color ${i + 1}`}
                title="Type a hex value"
                className="rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/20"
              >
                <TypeHexIcon />
              </button>
              <label
                title="Pick a custom color"
                className="relative hidden cursor-pointer overflow-hidden rounded-full p-2 hover:bg-black/10 sm:block dark:hover:bg-white/20"
              >
                <PipetteIcon />
                <span className="sr-only">{`Pick color ${i + 1}`}</span>
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => editColor(i, e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label={`Pick color ${i + 1}`}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setInfoFor(infoFor === i ? null : i);
                  setShadesFor(null);
                  setContrastFor(null);
                }}
                aria-label={infoFor === i ? `Hide color info for color ${i + 1}` : `Show color info for color ${i + 1}`}
                aria-pressed={infoFor === i}
                title="Color info — values, name, best text"
                className={`rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/20 ${infoFor === i ? "bg-black/15 dark:bg-white/25" : ""}`}
              >
                <InfoIcon />
              </button>
              <button
                type="button"
                onClick={() => toggleSaveColor(i)}
                aria-label={colorSaved ? `Remove color ${i + 1} from saved` : `Save color ${i + 1}`}
                aria-pressed={colorSaved}
                title={colorSaved ? "Saved — click to remove" : "Save this color"}
                className="rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/20"
              >
                <BookmarkIcon filled={colorSaved} />
              </button>
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={colors.length <= 2}
                aria-label={`Remove color ${i + 1}`}
                title="Remove"
                className="rounded-full p-2 hover:bg-black/10 disabled:opacity-30 dark:hover:bg-white/20"
              >
                <CloseIcon />
              </button>
            </div>
            {i < colors.length - 1 && colors.length < 8 ? (
              <button
                type="button"
                onClick={() => insertAt(i + 1)}
                aria-label={`Insert a color after position ${i + 1}`}
                title="Insert a color here"
                className="absolute -right-3.5 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-700 opacity-0 shadow-md ring-1 ring-black/10 transition-all hover:bg-zinc-900 hover:text-white group-hover:opacity-100 sm:flex dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/20 dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            ) : null}

            {/* Shades popover */}
            {shades ? (
              <>
                <button
                  type="button"
                  aria-label="Close shades"
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShadesFor(null)}
                />
                <div className="absolute inset-x-3 top-12 z-40 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/10 sm:top-14 dark:bg-zinc-900 dark:ring-white/15">
                  <p className="px-3 pb-1 pt-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                    Shades of {displayNames[i]} · <span className="normal-case tracking-normal">◆ marks current</span>
                  </p>
                  <div className="flex px-3 pb-1">
                    {shades.map((shade, k) => {
                      let light = 0;
                      try { light = Math.round(rgbToOklch(hexToRgb(shade)).l * 100); } catch { /* keep 0 */ }
                      const current = k === nearestShade;
                      return (
                        <button
                          key={`${shade}-${k}`}
                          type="button"
                          onClick={() => {
                            setColorAt(i, shade);
                            setShadesFor(null);
                          }}
                          title={`${shade.toUpperCase()} · lightness ${light}% — click to use`}
                          className="group/sh flex-1"
                        >
                          <span
                            className={`block h-12 transition-transform group-hover/sh:scale-y-110 ${current ? "ring-2 ring-inset ring-white/90 dark:ring-black/60" : ""}`}
                            style={{ backgroundColor: shade }}
                          >
                            {current ? (
                              <span className="flex h-full items-center justify-center text-[10px]" style={{ color: inkOn(shade).color }} aria-hidden>◆</span>
                            ) : null}
                          </span>
                          <span className={`block py-1 text-center font-mono text-[9px] tabular-nums ${current ? "font-bold text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                            {light}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="border-t border-zinc-100 px-3 py-2 text-left font-mono text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    12 steps · click a shade to use it
                  </p>
                </div>
              </>
            ) : null}

            {/* Contrast popover */}
            {showContrast ? (
              <>
                <button
                  type="button"
                  aria-label="Close contrast"
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setContrastFor(null)}
                />
                <div className="absolute inset-x-3 top-12 z-40 rounded-xl bg-white p-3 text-left shadow-xl ring-1 ring-black/10 sm:top-14 dark:bg-zinc-900 dark:ring-white/15">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                    Contrast
                  </p>
                  {[
                    { bg: "#ffffff", label: "on white", ratio: ratioWhite },
                    { bg: "#000000", label: "on black", ratio: ratioBlack },
                  ].map(({ bg, label, ratio }) => (
                    <div key={label} className="mt-1.5 flex items-center justify-between gap-2 text-sm">
                      <span className="rounded px-2 py-0.5 font-semibold" style={{ backgroundColor: hex, color: bg }}>
                        Aa
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
                      <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                        {ratio.toFixed(2)}:1
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          ratio >= 4.5
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                            : ratio >= 3
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {ratio >= 4.5 ? "AA" : ratio >= 3 ? "Large" : "Fail"}
                      </span>
                    </div>
                  ))}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Best text:{" "}
                    <button
                      type="button"
                      className="font-mono font-semibold underline underline-offset-2"
                      onClick={() => copyText(bestOn.toUpperCase(), `best-${i}`)}
                    >
                      {copied === `best-${i}` ? "Copied!" : bestOn.toUpperCase()}
                    </button>{" "}
                    ·{" "}
                    <a href="/tools/contrast-checker" className="font-medium underline underline-offset-2">
                      Full checker →
                    </a>
                  </p>
                </div>
              </>
            ) : null}

            {/* Color info modal */}
            {infoFor === i ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Color info for ${displayNames[i]}`}>
                <button type="button" aria-label="Close color info" className="absolute inset-0 cursor-default bg-black/50" onClick={() => setInfoFor(null)} />
                <div className="relative w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
                  <div className="flex items-center gap-3 p-4" style={{ backgroundColor: hex }}>
                    <span className="h-12 w-12 shrink-0 rounded-xl ring-2 ring-white/60" style={{ backgroundColor: hex }} aria-hidden />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-base font-bold" style={{ color: ink.color }}>{displayNames[i]}</span>
                      <span className="block font-mono text-sm uppercase opacity-80" style={{ color: ink.color }}>{hex.toUpperCase()}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setInfoFor(null)}
                      aria-label="Close color info"
                      className="rounded-full p-1.5 hover:bg-black/10 dark:hover:bg-white/20"
                      style={{ color: ink.color }}
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <dl className="space-y-1 px-4 py-3 text-sm">
                    {["HEX", "RGB", "HSL", "CMYK", "OKLCH"].map((fmt) => {
                      const value =
                        fmt === "HEX" ? hex.toUpperCase()
                        : fmt === "RGB" ? rgbString(hex)
                        : fmt === "HSL" ? hslString(hex)
                        : fmt === "CMYK" ? cmykString(hex)
                        : oklchString(hex);
                      return (
                        <div key={fmt} className="flex items-center justify-between gap-2">
                          <dt className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{fmt}</dt>
                          <dd className="min-w-0 flex-1 truncate font-mono text-[13px] text-zinc-800 dark:text-zinc-200">{value}</dd>
                          <button
                            type="button"
                            onClick={() => copyText(value, `info-${i}-${fmt}`)}
                            aria-label={`Copy ${fmt} value`}
                            title={`Copy ${fmt}`}
                            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          >
                            {copied === `info-${i}-${fmt}` ? <span className="text-[11px] font-bold">✓</span> : <CopyIcon className="h-4 w-4" />}
                          </button>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Best text</dt>
                      <dd>
                        <button
                          type="button"
                          className="rounded px-2 py-0.5 font-mono text-[13px] font-semibold"
                          style={{ backgroundColor: hex, color: bestOn }}
                          onClick={() => copyText(bestOn.toUpperCase(), `info-${i}-text`)}
                          title="Copy best text color"
                        >
                          {copied === `info-${i}-text` ? "Copied!" : bestOn.toUpperCase()}
                        </button>
                      </dd>
                    </div>
                  </dl>
                  <div className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800">
                    <Button type="button" variant="primary" className="flex-1 px-3 py-2 text-sm" onClick={() => toggleSaveColor(i)}>
                      {colorSaved ? "Remove from saved" : "Save this color"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => copyColor(hex)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      {copied === hex ? "Copied!" : "Copy hex"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => copyText(displayNames[i], `name-${i}`)}
              title={named ? `Closest CSS name: ${named.name} (${named.hex.toUpperCase()}) — click to copy` : "Copy color name"}
              className="max-w-full truncate rounded px-2 py-0.5 text-sm font-semibold tracking-wide opacity-90 transition-colors hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/20"
              style={{ color: ink.color, textShadow: ink.shadow }}
            >
              {copied === `name-${i}` ? "Copied!" : displayNames[i]}
            </button>

            {editingHex === i ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  commitHexDraft(i);
                }}
                className="flex items-center gap-1"
              >
                <span className="font-mono text-xl font-semibold" style={{ color: ink.color }}>#</span>
                <input
                  autoFocus
                  value={hexDraft}
                  onChange={(e) => {
                    setHexDraft(e.target.value.replace(/#/g, ""));
                    setHexError(false);
                  }}
                  onBlur={() => commitHexDraft(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingHex(null);
                  }}
                  maxLength={6}
                  spellCheck={false}
                  autoComplete="off"
                  aria-label={`Type a hex value for color ${i + 1}`}
                  className={`w-24 rounded-md bg-transparent px-1 py-1 text-center font-mono text-xl font-semibold uppercase tracking-wider outline-none ring-2 ${
                    hexError ? "ring-red-500" : "ring-current"
                  }`}
                  style={{ color: ink.color }}
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => copyColor(hex)}
                onDoubleClick={() => {
                  setEditingHex(i);
                  setHexDraft(hex.replace("#", ""));
                  setHexError(false);
                }}
                className="rounded-md px-2 py-1 font-mono text-xl font-semibold uppercase tracking-wider transition-colors hover:bg-black/10 sm:text-2xl dark:hover:bg-white/20"
                style={{ color: ink.color, textShadow: ink.shadow }}
                aria-label={`Copy ${hex}`}
                title="Click to copy · double-click (or keyboard icon) to type a hex"
              >
                {copied === hex ? "Copied!" : hex.replace("#", "")}
              </button>
            )}
            <button
              type="button"
              onClick={() => copyColor(hex)}
              className="rounded px-2 font-mono text-[11px] tabular-nums opacity-70 transition-opacity hover:opacity-100"
              style={{ color: ink.color }}
              title={`Click to copy (${valueFormat.toUpperCase()}) · change format in Tune`}
            >
              {valueLine(hex)}
            </button>
            <div className="mt-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleLock(i)}
                aria-pressed={locked[i]}
                aria-label={locked[i] ? `Unlock color ${i + 1}` : `Lock color ${i + 1}`}
                style={{
                  color: ink.color,
                  backgroundColor: locked[i] ? ink.pill : undefined,
                }}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium uppercase tracking-widest opacity-80 transition-all hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-80 sm:focus-visible:opacity-100"
              >
                <LockIcon locked={locked[i]} className="h-4 w-4" />
                {locked[i] ? "Locked" : "Lock"}
              </button>
              <button
                type="button"
                onClick={() => copyColor(hex)}
                aria-label={`Copy hex for color ${i + 1}`}
                title="Copy hex"
                style={{ color: ink.color }}
                className="rounded-md p-1.5 opacity-80 transition-all hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-80 sm:focus-visible:opacity-100"
              >
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
            {locked[i] ? (
              <span
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: ink.color, backgroundColor: ink.pill }}
              >
                Keeper
              </span>
            ) : null}
          </div>
          );
        })}
      </div>

      {/* Next steps: what to do with the palette. */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500 sm:px-8 dark:border-zinc-800 dark:text-zinc-400 lg:px-12">
        <span className="hidden lg:inline">
          Space shuffles · click hex to copy · hover + L to lock · drag to reorder
        </span>
        <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <a href={generatorHref} className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
            Open in full generator →
          </a>
          <a href="/tools/contrast-checker" className="font-medium underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
            Check contrast
          </a>
          <a href="/palettes" className="font-medium underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
            Browse gallery
          </a>
          <button type="button" onClick={() => copyText(colors.join(", ").toUpperCase(), "all")} className="font-medium underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
            {copied === "all" ? "Copied!" : "Copy all hex"}
          </button>
        </span>
      </div>

      {/* Tune popover: harmony + sliders + value format. */}
      {tuneOpen ? (
        <>
          <button type="button" aria-label="Close tuning" className="fixed inset-0 z-30 cursor-default" onClick={() => setTuneOpen(false)} />
          <div className="absolute left-1/2 top-16 z-40 w-[min(94vw,44rem)] -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:top-[4.5rem] dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tune this palette</p>
              <div className="flex items-center gap-2">
                {tuningActive ? (
                  <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => setSettings({ ...DEFAULT_PALETTE_SETTINGS })}>
                    Reset sliders
                  </Button>
                ) : null}
                <button type="button" onClick={() => setTuneOpen(false)} aria-label="Close tuning" className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <CloseIcon />
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Harmony picks the family · sliders tune the current one · locked colors never move.</p>
            <div className="mt-3 flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Harmony</span>
              <TabList label="Palette harmony" size="sm" options={STRATEGY_OPTIONS} value={strategy} onChange={chooseStrategy} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
              {SLIDERS.map(({ key, label, min, max, step, unit, neutral, signed }) => {
                const value = settings[key];
                const active = value !== neutral;
                const display =
                  signed || active
                    ? `${value > 0 ? "+" : ""}${value}${unit}`
                    : `${value}${unit}`;
                return (
                  <div key={key} className="min-w-0">
                    <div className="mb-0.5 flex items-baseline justify-between gap-2">
                      <label htmlFor={`palette-ctl-${key}`} className="truncate text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {label}
                      </label>
                      <span className={`font-mono text-[11px] tabular-nums ${active ? "font-semibold text-zinc-700 dark:text-zinc-200" : "text-zinc-400"}`}>
                        {display}
                      </span>
                    </div>
                    <input
                      id={`palette-ctl-${key}`}
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={(e) => setControl(key, Number(e.target.value))}
                      className="w-full accent-zinc-900 dark:accent-zinc-100"
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Values show</span>
              {(["rgb", "hsl", "cmyk"] as ValueFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setValueFormat(f)}
                  aria-pressed={valueFormat === f}
                  className={`rounded-md px-2.5 py-1 font-mono text-xs uppercase ${valueFormat === f ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* View modal: gradient / list / contrast visualizations. */}
      {viewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Visualize palette">
          <button type="button" aria-label="Close view" className="absolute inset-0 bg-black/50" onClick={() => setViewOpen(false)} />
          <div className="relative max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">View palette</h2>
              <button type="button" onClick={() => setViewOpen(false)} aria-label="Close view" className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <CloseIcon />
              </button>
            </div>
            <div className="mt-3 flex gap-1.5">
              {([["gradient", "Gradient"], ["list", "List"], ["contrast", "Contrast"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewTab(id)}
                  aria-pressed={viewTab === id}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${viewTab === id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {viewTab === "gradient" ? (
              <div className="mt-4">
                <div className="h-40 overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${colors.join(", ")})` }} />
                <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">{gradientCss}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" className="text-xs" onClick={() => copyText(gradientCss, "gradient")}>
                    {copied === "gradient" ? "Copied!" : "Copy gradient CSS"}
                  </Button>
                  <a href={generatorHref} className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300">
                    Use in full generator →
                  </a>
                </div>
              </div>
            ) : null}

            {viewTab === "list" ? (
              <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                {colors.map((hex, i) => (
                  <li key={`${hex}-${i}`} className="flex items-center gap-3 px-3 py-2">
                    <span className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-black/10" style={{ backgroundColor: hex }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{displayNames[i]}</p>
                      <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {hex.toUpperCase()} · rgb({rgbString(hex)}) · hsl({hslString(hex)})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(hex.toUpperCase(), `list-${i}`)}
                      className="rounded-md border border-zinc-300 px-2 py-1 font-mono text-xs text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      {copied === `list-${i}` ? "✓" : "Copy"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {viewTab === "contrast" ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-96 border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                      <th className="pb-2 pr-2 font-medium">Color</th>
                      <th className="pb-2 pr-2 font-medium">on white</th>
                      <th className="pb-2 pr-2 font-medium">on black</th>
                      <th className="pb-2 font-medium">Best text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colors.map((hex, i) => {
                      const w = contrastRatio(hex, "#ffffff");
                      const b = contrastRatio(hex, "#000000");
                      return (
                        <tr key={`${hex}-${i}`} className="border-t border-zinc-200 dark:border-zinc-800">
                          <td className="py-2 pr-2">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-6 w-6 rounded-md ring-1 ring-black/10" style={{ backgroundColor: hex }} />
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">{displayNames[i]}</span>
                            </span>
                          </td>
                          <td className="py-2 pr-2 font-mono tabular-nums text-zinc-700 dark:text-zinc-300">{w.toFixed(2)}{w >= 4.5 ? " ✓" : ""}</td>
                          <td className="py-2 pr-2 font-mono tabular-nums text-zinc-700 dark:text-zinc-300">{b.toFixed(2)}{b >= 4.5 ? " ✓" : ""}</td>
                          <td className="py-2 font-mono text-zinc-700 dark:text-zinc-300">{w >= b ? "#FFF" : "#000"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <a href="/tools/wcag-palette-checker" className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
                  Audit every pair in the WCAG palette checker →
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Export dialog: share / code / image. */}
      {exportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Export palette">
          <button type="button" aria-label="Close export" className="absolute inset-0 bg-black/50" onClick={() => setExportOpen(false)} />
          <div className="relative max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Export · Share</h2>
              <button type="button" onClick={() => setExportOpen(false)} aria-label="Close export" className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <CloseIcon />
              </button>
            </div>
            <div className="mt-3 flex gap-1.5">
              {([["share", "Share"], ["code", "Code"], ["image", "Image"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setExportTab(id)}
                  aria-pressed={exportTab === id}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${exportTab === id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {exportTab === "share" ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2 pl-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-600 dark:text-zinc-300">{shareUrl}</span>
                  <Button type="button" variant="secondary" className="shrink-0 px-3 py-1.5 text-xs" onClick={() => copyText(shareUrl, "share-link")}>
                    {copied === "share-link" ? "Copied!" : "Copy link"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Palette: ${displayNames.join(", ")}`)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Post to X
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://pinterest.com/pin/create/button/?description=${encodeURIComponent(`Palette: ${displayNames.join(", ")}`)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Pinterest
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Embed strip</p>
                  <pre className="mt-1 max-h-28 overflow-auto rounded-lg bg-zinc-100 p-3 font-mono text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{embedSnippet}</pre>
                  <Button type="button" variant="secondary" className="mt-2 px-3 py-1.5 text-xs" onClick={() => copyText(embedSnippet, "embed")}>
                    {copied === "embed" ? "Copied!" : "Copy embed HTML"}
                  </Button>
                </div>
              </div>
            ) : null}

            {exportTab === "code" ? (
              <div className="mt-4">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Code format">
                  {([["css", "CSS"], ["tailwind", "Tailwind"], ["json", "JSON"], ["hex", "HEX"], ["rgb", "RGB"], ["svg", "SVG"]] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={codeFormat === id}
                      onClick={() => setCodeFormat(id)}
                      className={`rounded-lg px-3 py-1.5 font-mono text-xs ${codeFormat === id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-5 text-zinc-100 dark:bg-black dark:ring-1 dark:ring-zinc-800">{codeSnippet}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="primary" className="px-3 py-1.5 text-xs" onClick={() => copyText(codeSnippet, "code-copy")}>
                    {copied === "code-copy" ? "Copied!" : "Copy code"}
                  </Button>
                  <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => { downloadFile(codeFilename, codeSnippet, codeMime); flashCopied("exported"); }}>
                    Download file
                  </Button>
                </div>
              </div>
            ) : null}

            {exportTab === "image" ? (
              <div className="mt-4">
                <div className="flex h-32 overflow-hidden rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-700" aria-hidden>
                  {colors.map((c) => (
                    <div key={c} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Size</span>
                  {([["s", "Small"], ["m", "Medium"], ["l", "Large"]] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setImgSize(id)}
                      aria-pressed={imgSize === id}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${imgSize === id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                  <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <input type="checkbox" checked={imgLabels} onChange={(e) => setImgLabels(e.target.checked)} className="accent-zinc-900 dark:accent-zinc-100" />
                    Names + hex labels
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="primary" className="px-3 py-1.5 text-xs" onClick={() => downloadPng(imgSize)}>
                    {copied === "png" ? "Saved!" : "Download PNG"}
                  </Button>
                  <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => { setCodeFormat("svg"); downloadFile(codeFilename.replace(/\.txt$/, ".svg"), codeSnippet, "image/svg+xml"); flashCopied("exported"); }}>
                    Download SVG
                  </Button>
                </div>
                <a href={generatorHref} className="mt-4 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
                  Need design tokens? Open in the full generator →
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Dim the toolbar controls hint while any overlay is open (a11y focus stays in dialog). */}
      {anyOverlay ? <span className="sr-only">A dialog is open. Press Escape to close it.</span> : null}
    </div>
  );
}
