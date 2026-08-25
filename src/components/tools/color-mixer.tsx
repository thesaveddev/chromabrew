"use client";

import { useMemo, useState } from "react";
import { hexToRgb, rgbToHex, rgbToHsl, hslToHex, parseColour } from "@/lib/design-system/colour/convert";
import { CopyButton } from "@/components/ui/primitives";

function mixHex(a: string, b: string, ratio: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({
    r: Math.round(ca.r + (cb.r - ca.r) * ratio),
    g: Math.round(ca.g + (cb.g - ca.g) * ratio),
    b: Math.round(ca.b + (cb.b - ca.b) * ratio),
  });
}

export function ColorMixer() {
  const [colorA, setColorA] = useState("#ff006e");
  const [colorB, setColorB] = useState("#3a86ff");
  const [ratio, setRatio] = useState(50);

  const ratioDecimal = ratio / 100;
  const mixed = useMemo(() => mixHex(colorA, colorB, ratioDecimal), [colorA, colorB, ratioDecimal]);
  const mixedRgb = hexToRgb(mixed);
  const mixedHsl = rgbToHsl(mixedRgb);

  const output = useMemo(
    () => ({
      hex: mixed,
      rgb: `rgb(${Math.round(mixedRgb.r)}, ${Math.round(mixedRgb.g)}, ${Math.round(mixedRgb.b)})`,
      hsl: `hsl(${Math.round(mixedHsl.h)}, ${Math.round(mixedHsl.s)}%, ${Math.round(mixedHsl.l)}%)`,
    }),
    [mixed, mixedRgb, mixedHsl],
  );

  const steps = useMemo(() => {
    const result: { ratio: number; hex: string }[] = [];
    for (let i = 0; i <= 10; i++) {
      const r = i / 10;
      result.push({ ratio: Math.round(r * 100), hex: mixHex(colorA, colorB, r) });
    }
    return result;
  }, [colorA, colorB]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Color A</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorA}
              onChange={(e) => setColorA(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
            />
            <input
              type="text"
              value={colorA}
              onChange={(e) => {
                if (parseColour(e.target.value)) setColorA(parseColour(e.target.value)!);
              }}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Color B</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorB}
              onChange={(e) => setColorB(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
            />
            <input
              type="text"
              value={colorB}
              onChange={(e) => {
                if (parseColour(e.target.value)) setColorB(parseColour(e.target.value)!);
              }}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="mix-ratio" className="text-xs text-zinc-500">Mix ratio</label>
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{ratio}% A / {100 - ratio}% B</span>
        </div>
        <input
          id="mix-ratio"
          type="range"
          min={0}
          max={100}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-zinc-100"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="h-24" style={{ backgroundColor: mixed }} />
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-10">HEX</span>
            <code className="flex-1 rounded-lg bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-100">{output.hex}</code>
            <CopyButton value={output.hex} label="Copy" className="px-2 py-1 text-xs" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-10">RGB</span>
            <code className="flex-1 rounded-lg bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-100">{output.rgb}</code>
            <CopyButton value={output.rgb} label="Copy" className="px-2 py-1 text-xs" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-10">HSL</span>
            <code className="flex-1 rounded-lg bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-100">{output.hsl}</code>
            <CopyButton value={output.hsl} label="Copy" className="px-2 py-1 text-xs" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-zinc-500">11-step blend scale</p>
        <div className="flex h-12 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {steps.map((step) => (
            <div
              key={step.ratio}
              className="flex-1 group relative cursor-pointer"
              style={{ backgroundColor: step.hex }}
              title={`${step.hex} (${step.ratio}% A)`}
            >
              <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[9px] font-mono text-white opacity-0 transition-opacity group-hover:opacity-100">
                {step.hex}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
