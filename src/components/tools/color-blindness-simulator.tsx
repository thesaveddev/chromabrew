"use client";

import { useMemo, useState } from "react";
import { parseColour, formatRgb, formatHsl, formatOklch, toColourValue } from "@/lib/design-system/colour/convert";
import { ColourInput } from "@/components/ui/colour";
import { CopyButton } from "@/components/ui/primitives";
/**
 * Color blindness simulation matrices.
 * Based on Machado, Oliveira & Fernandes (2009) — the standard
 * matrices used by major accessibility tools.
 */
const MATRICES: Record<string, number[][]> = {
  normal: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900],
  ],
  achromatopsia: [
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
  ],
};

const TYPES = [
  { id: "normal", label: "Normal vision", desc: "Full trichromatic color vision" },
  { id: "protanopia", label: "Protanopia", desc: "No red cones (~1.3% of males)" },
  { id: "deuteranopia", label: "Deuteranopia", desc: "No green cones (~1.2% of males)" },
  { id: "tritanopia", label: "Tritanopia", desc: "No blue cones (~0.01% of population)" },
  { id: "achromatopsia", label: "Achromatopsia", desc: "Total color blindness (~0.003%)" },
] as const;

function simulate(hex: string, type: string): string {
  const m = MATRICES[type] ?? MATRICES.normal;
  const v = toColourValue(hex);
  const rn = v.rgb.r / 255;
  const gn = v.rgb.g / 255;
  const bn = v.rgb.b / 255;
  const sr = Math.round(Math.max(0, Math.min(1, m[0][0] * rn + m[0][1] * gn + m[0][2] * bn)) * 255);
  const sg = Math.round(Math.max(0, Math.min(1, m[1][0] * rn + m[1][1] * gn + m[1][2] * bn)) * 255);
  const sb = Math.round(Math.max(0, Math.min(1, m[2][0] * rn + m[2][1] * gn + m[2][2] * bn)) * 255);
  return `#${[sr, sg, sb].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** WCAG 2.x contrast ratio between two hex colors. */
function contrastRatio(a: string, b: string): number {
  const luma = (hex: string) => {
    const [r, g, b] = toRgb(hex).map((c) => c / 255).map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = luma(a);
  const l2 = luma(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Perceptual difference score 0–100 between two hex colors. */
function differenceScore(a: string, b: string): number {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  const dist = Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
  return Math.min(100, (dist / 441) * 100);
}

export function ColorBlindnessSimulator({ initial = "#47003a" }: { initial?: string }) {
  const [raw, setRaw] = useState(initial);
  const [color, setColor] = useState(initial);

  const value = useMemo(() => {
    const v = parseColour(color);
    return v ? toColourValue(v) : null;
  }, [color]);

  const simulations = useMemo(
    () => TYPES.map((t) => ({ ...t, hex: simulate(color, t.id) })),
    [color],
  );

  return (
    <div className="space-y-5">
      <ColourInput
        id="cb-sim-colour"
        label="Color to simulate"
        size="lg"
        value={raw}
        invalid={!parseColour(color) && raw.trim().length > 0}
        errorMessage="Enter a valid HEX, rgb() or hsl() color."
        onChange={(next) => {
          setRaw(next);
          const resolved = parseColour(next);
          if (resolved) setColor(resolved);
        }}
        onSubmit={(hex) => hex && setColor(hex)}
      />

      {value && (
        <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <dt className="font-medium text-zinc-500">HEX</dt>
            <dd className="mt-1 flex items-center justify-between gap-2">
              <code className="font-mono uppercase">{color}</code>
              <CopyButton value={color.toUpperCase()} className="!px-2 !py-0.5 text-[11px]" />
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <dt className="font-medium text-zinc-500">RGB</dt>
            <dd className="mt-1 font-mono">{formatRgb(value.rgb)}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <dt className="font-medium text-zinc-500">HSL</dt>
            <dd className="mt-1 font-mono">{formatHsl(value.hsl)}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <dt className="font-medium text-zinc-500">OKLCH</dt>
            <dd className="mt-1 font-mono">{formatOklch(value.oklch)}</dd>
          </div>
        </dl>
      )}

      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-500">Simulation results</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {simulations.map((sim) => (
            <div key={sim.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex">
                <div className="h-14 flex-1" style={{ backgroundColor: color }} />
                <div className="h-14 flex-1" style={{ backgroundColor: sim.hex }} />
              </div>
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{sim.label}</p>
                  <code className="font-mono text-[10px] text-zinc-500">{sim.hex.toUpperCase()}</code>
                </div>
                <p className="mt-0.5 text-[10px] text-zinc-500">{sim.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Simulations use the Machado et al. (2009) matrices — the same
        transform used by major accessibility tools. Roughly 8% of men and
        0.5% of women have some form of color vision deficiency.
      </p>

      <ColorPairChecker />
    </div>
  );
}

/**
 * Pair check: does a foreground/background combo stay distinguishable
 * under each color vision condition? Contrast ratio alone isn't enough —
 * two colors that differ only in hue can collapse together.
 */
function ColorPairChecker({
  initialA = "#ff6b6b",
  initialB = "#ffffff",
}: {
  initialA?: string;
  initialB?: string;
}) {
  const [rawA, setRawA] = useState(initialA);
  const [rawB, setRawB] = useState(initialB);
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);

  const validA = parseColour(a);
  const validB = parseColour(b);

  const pairs = useMemo(() => {
    if (!validA || !validB) return null;
    return TYPES.map((t) => {
      const simA = simulate(a, t.id);
      const simB = simulate(b, t.id);
      const diff = differenceScore(simA, simB);
      return {
        ...t,
        simA,
        simB,
        simContrast: contrastRatio(simA, simB),
        diff,
        passes: diff >= 30,
      };
    });
  }, [a, b, validA, validB]);

  return (
    <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Are two colors distinguishable?
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Contrast ratio measures lightness, not hue. Two colors can pass WCAG contrast yet differ only
        in hue and collapse into the same tone for someone with a color vision deficiency. Check a
        text and background pair below to confirm they stay readable to everyone.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ColourInput
          id="cb-a"
          label="Foreground color"
          size="lg"
          value={rawA}
          invalid={rawA.trim().length > 0 && !validA}
          errorMessage="Enter a valid HEX, rgb() or hsl() color."
          onChange={(next) => {
            setRawA(next);
            const resolved = parseColour(next);
            if (resolved) setA(resolved);
          }}
          onSubmit={(hex) => hex && setA(hex)}
        />
        <ColourInput
          id="cb-b"
          label="Background color"
          size="lg"
          value={rawB}
          invalid={rawB.trim().length > 0 && !validB}
          errorMessage="Enter a valid HEX, rgb() or hsl() color."
          onChange={(next) => {
            setRawB(next);
            const resolved = parseColour(next);
            if (resolved) setB(resolved);
          }}
          onSubmit={(hex) => hex && setB(hex)}
        />
      </div>

      {pairs && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Baseline contrast (WCAG)
              </p>
              <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-sm font-semibold dark:bg-zinc-800">
                {contrastRatio(a, b).toFixed(2)}:1
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Necessary, but not sufficient on its own — keep reading to see whether the pair stays
              distinguishable after each simulation.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pairs.map((pair) => (
              <div key={pair.id} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="relative flex h-20 items-center justify-center" style={{ backgroundColor: pair.simB }}>
                  <span className="px-3 py-1 text-sm font-semibold" style={{ color: pair.simA }}>
                    Sample text
                  </span>
                  <button
                    type="button"
                    title="Copy simulated foreground"
                    className="absolute left-2 top-2 rounded bg-white/70 px-1.5 py-0.5 font-mono text-[10px] text-zinc-700 backdrop-blur dark:bg-zinc-900/70 dark:text-zinc-200"
                    onClick={() => navigator.clipboard?.writeText(pair.simA)}
                  >
                    {pair.simA.toUpperCase()}
                  </button>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{pair.label}</p>
                    <p className="text-[10px] text-zinc-500">{pair.desc}</p>
                  </div>
                  <div
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      pair.passes
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {pair.passes ? "Distinguishable" : "Hard to tell apart"}
                  </div>
                </div>
                <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Color difference</span>
                    <span className="font-mono">{pair.diff.toFixed(0)} / 100</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${pair.passes ? "bg-emerald-500" : "bg-red-500"}`}
                      style={{ width: `${pair.diff}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-zinc-500">
                    Contrast {pair.simContrast.toFixed(2)}:1 after simulation
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-500">
            Color difference is the perceptual distance between the simulated pair on a 0–100 scale.
            Below roughly 30, the two are hard to tell apart even when the contrast ratio looks fine.
          </p>
        </div>
      )}
    </section>
  );
}
