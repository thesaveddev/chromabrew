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
import { Button, TabList, copyToClipboard } from "@/components/ui/primitives";

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
const FIRST_PAINT_PALETTE = ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"];

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

  // What the user sees: tuning applied deterministically, keepers untouched.
  const colors = useMemo(
    () => applyPaletteSettings(base, locked, settings),
    [base, locked, settings],
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
    // Locks are all-false in both branches, so only the palette moves.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time bootstrap from window state after hydration
    setBase(next);
  }, []);

  // Keep the URL shareable: every palette is a link to itself.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("c", serializeQuickPalette(colors));
    window.history.replaceState(null, "", url.toString());
  }, [colors]);

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        e.code !== "Space" ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA"
      ) {
        return;
      }
      e.preventDefault();
      shuffle();
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

  const copyColor = async (hex: string) => {
    if (await copyToClipboard(hex.toUpperCase())) {
      setCopied(hex);
      window.setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1200);
    }
  };

  const addColor = () => {
    setBase((prev) => (prev.length >= 8 ? prev : [...prev, randomPleasantColour()]));
    setLocked((prev) => (prev.length >= 8 ? prev : [...prev, false]));
  };
  const removeColor = () => {
    setBase((prev) => (prev.length <= 2 ? prev : prev.slice(0, -1)));
    setLocked((prev) => (prev.length <= 2 ? prev : prev.slice(0, -1)));
  };

  const copyLink = async () => {
    if (await copyToClipboard(window.location.href)) {
      setCopied("link");
      window.setTimeout(() => setCopied((c) => (c === "link" ? null : c)), 1200);
    }
  };

  const tuningActive = !settingsAreDefault(settings);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Title + toolbar — one slim row so the palette keeps the viewport. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-200 px-4 py-2.5 sm:px-6 dark:border-zinc-800">
        <div className="mr-auto min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Instant palettes
          </p>
          <h1 className="truncate text-lg font-bold tracking-tight text-zinc-900 sm:text-xl dark:text-zinc-100">
            Press space. Keep the good ones.
          </h1>
        </div>
        <button
          type="button"
          onClick={() => shuffle()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Shuffle&nbsp;<kbd className="rounded bg-white/20 px-1.5 py-0.5 text-xs dark:bg-zinc-900/10">space</kbd>
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
        >
          {copied === "link" ? "Link copied" : "Copy link"}
        </button>
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
          <span className="min-w-14 text-center tabular-nums">
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

      {/* Controls — harmony picks the family, sliders tune the current one. */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-zinc-200 px-4 py-3 sm:px-6 dark:border-zinc-800">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Harmony
          </span>
          <TabList
            label="Palette harmony"
            size="sm"
            options={STRATEGY_OPTIONS}
            value={strategy}
            onChange={chooseStrategy}
          />
        </div>
        <div className="grid w-full flex-1 grid-cols-2 gap-x-5 gap-y-2 sm:flex sm:w-auto sm:items-end">
          {SLIDERS.map(({ key, label, min, max, step, unit, neutral, signed }) => {
            const value = settings[key];
            const active = value !== neutral;
            const display =
              signed || active
                ? `${value > 0 ? "+" : ""}${value}${unit}`
                : `${value}${unit}`;
            return (
              <div key={key} className="min-w-0 sm:w-40">
                <div className="mb-0.5 flex items-baseline justify-between gap-2">
                  <label
                    htmlFor={`palette-ctl-${key}`}
                    className="truncate text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    {label}
                  </label>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      active
                        ? "font-semibold text-zinc-700 dark:text-zinc-200"
                        : "text-zinc-400"
                    }`}
                  >
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
          {tuningActive ? (
            <Button
              type="button"
              variant="secondary"
              className="px-2 py-1 text-xs"
              onClick={() => setSettings({ ...DEFAULT_PALETTE_SETTINGS })}
            >
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      {/* The palette owns the rest of the viewport; small screens scroll it. */}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:flex-row sm:overflow-hidden"
        role="list"
        aria-label="Generated palette"
      >
        {colors.map((hex, i) => (
          <div
            key={`${i}-${colors.length}`}
            role="listitem"
            className="group relative flex min-h-24 flex-1 items-end justify-center pb-5 transition-[flex] sm:min-h-0 sm:items-center sm:pb-0"
            style={{ backgroundColor: hex }}
          >
            <div className="flex flex-col items-center gap-2 text-white mix-blend-difference">
              <button
                type="button"
                onClick={() => copyColor(hex)}
                className="rounded-md px-2 py-1 font-mono text-sm font-semibold uppercase tracking-wider hover:bg-white/20 sm:text-base"
                aria-label={`Copy ${hex}`}
              >
                {copied === hex ? "Copied!" : hex.replace("#", "")}
              </button>
              <button
                type="button"
                onClick={() => toggleLock(i)}
                aria-pressed={locked[i]}
                aria-label={locked[i] ? `Unlock color ${i + 1}` : `Lock color ${i + 1}`}
                className="rounded-md px-2 py-1 text-xs font-medium uppercase tracking-widest opacity-70 hover:bg-white/20 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-70 sm:focus-visible:opacity-100"
              >
                {locked[i] ? "🔒 Locked" : "🔓 Lock"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="border-t border-zinc-200 px-4 py-2.5 text-center text-xs text-zinc-500 sm:px-6 dark:border-zinc-800 dark:text-zinc-400">
        Press space to generate · drag the sliders to tune hue, brightness,
        vibrance and contrast · click a hex to copy · lock the keepers ·{" "}
        <a
          href={`/design-system?primary=${colors[0]?.replace("#", "") ?? ""}`}
          className="font-medium underline underline-offset-4"
        >
          open this palette in the design system generator
        </a>
      </p>
    </div>
  );
}
