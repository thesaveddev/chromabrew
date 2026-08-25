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
    </div>
  );
}
