"use client";

import type { PaletteColour, Refinement } from "@/lib/design-system/types";
import { Button } from "@/components/ui/primitives";

const SLIDERS: Array<{
  key: keyof Refinement;
  label: string;
  min: number;
  max: number;
  unit: string;
}> = [
  { key: "brightness", label: "Brightness", min: -50, max: 50, unit: "%" },
  { key: "saturation", label: "Saturation", min: -50, max: 50, unit: "%" },
  { key: "hueShift", label: "Hue Shift", min: -180, max: 180, unit: "°" },
  { key: "temperature", label: "Temperature", min: -50, max: 50, unit: "%" },
];

/**
 * Post-generation fine tuning. Locked swatches are exempt from
 * refinement — they keep their colour while everything else shifts.
 */
export function RefinementPanel({
  refinement,
  palette,
  onChange,
}: {
  refinement: Refinement;
  palette: PaletteColour[];
  onChange: (refinement: Refinement) => void;
}) {
  const active = SLIDERS.some(({ key }) => refinement[key] !== 0);
  const lockedCount = palette.filter((s) => s.locked).length;

  return (
    <section aria-labelledby="refine-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="refine-heading" className="panel-title">
          Refinement
        </h2>
        {active ? (
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-0.5 text-[11px]"
            onClick={() =>
              onChange({ brightness: 0, saturation: 0, hueShift: 0, temperature: 0 })
            }
          >
            Reset
          </Button>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800">
        {SLIDERS.map(({ key, label, min, max, unit }) => {
          const value = refinement[key];
          return (
            <div key={key}>
              <div className="mb-1 flex items-baseline justify-between">
                <label htmlFor={`refine-${key}`} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {label}
                </label>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    value === 0 ? "text-zinc-400" : "font-semibold text-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  {value > 0 ? "+" : ""}
                  {value}
                  {unit}
                </span>
              </div>
              <input
                id={`refine-${key}`}
                type="range"
                min={min}
                max={max}
                step={key === "hueShift" ? 5 : 1}
                value={value}
                onChange={(e) =>
                  onChange({ ...refinement, [key]: Number(e.target.value) })
                }
                className="w-full accent-zinc-900 dark:accent-zinc-100"
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] leading-4 text-zinc-400">
        Locked colours won&apos;t be affected by refinement
        {lockedCount > 0 ? ` — ${lockedCount} locked` : ""}.
      </p>
    </section>
  );
}
