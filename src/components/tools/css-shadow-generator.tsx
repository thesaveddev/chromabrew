"use client";

import { useMemo, useState } from "react";
import { parseColour, hexToRgb, rgbToHex } from "@/lib/design-system/colour/convert";
import { CopyButton } from "@/components/ui/primitives";

type ShadowType = "box" | "text";

interface ShadowConfig {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  alpha: number;
}

function buildShadow(type: ShadowType, config: ShadowConfig): string {
  const rgb = hexToRgb(config.color);
  const rgba = `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${config.alpha})`;
  if (type === "box") {
    return `${config.offsetX}px ${config.offsetY}px ${config.blur}px ${config.spread}px ${rgba}`;
  }
  return `${config.offsetX}px ${config.offsetY}px ${config.blur}px ${rgba}`;
}

function ShadowControls({
  config,
  onChange,
  type,
}: {
  config: ShadowConfig;
  onChange: (c: Partial<ShadowConfig>) => void;
  type: ShadowType;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 w-16">Color</label>
        <input
          type="color"
          value={config.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={config.color}
          onChange={(e) => {
            if (parseColour(e.target.value)) onChange({ color: parseColour(e.target.value)! });
          }}
          className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
        />
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] text-zinc-400">α</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={config.alpha}
            onChange={(e) => onChange({ alpha: Math.max(0, Math.min(1, Number(e.target.value))) })}
            className="w-16 rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 w-12">X</label>
          <input
            type="range"
            min={-50}
            max={50}
            value={config.offsetX}
            onChange={(e) => onChange({ offsetX: Number(e.target.value) })}
            className="flex-1 accent-zinc-900 dark:accent-zinc-100"
          />
          <span className="w-8 text-right font-mono text-[10px] text-zinc-500">{config.offsetX}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 w-12">Y</label>
          <input
            type="range"
            min={-50}
            max={50}
            value={config.offsetY}
            onChange={(e) => onChange({ offsetY: Number(e.target.value) })}
            className="flex-1 accent-zinc-900 dark:accent-zinc-100"
          />
          <span className="w-8 text-right font-mono text-[10px] text-zinc-500">{config.offsetY}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 w-12">Blur</label>
          <input
            type="range"
            min={0}
            max={100}
            value={config.blur}
            onChange={(e) => onChange({ blur: Number(e.target.value) })}
            className="flex-1 accent-zinc-900 dark:accent-zinc-100"
          />
          <span className="w-8 text-right font-mono text-[10px] text-zinc-500">{config.blur}</span>
        </div>
        {type === "box" && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500 w-12">Spread</label>
            <input
              type="range"
              min={-50}
              max={50}
              value={config.spread}
              onChange={(e) => onChange({ spread: Number(e.target.value) })}
              className="flex-1 accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="w-8 text-right font-mono text-[10px] text-zinc-500">{config.spread}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CssShadowGenerator() {
  const [type, setType] = useState<ShadowType>("box");
  const [boxShadow, setBoxShadow] = useState<ShadowConfig>({
    offsetX: 0,
    offsetY: 4,
    blur: 6,
    spread: -1,
    color: "#000000",
    alpha: 0.1,
  });
  const [textShadow, setTextShadow] = useState<ShadowConfig>({
    offsetX: 0,
    offsetY: 2,
    blur: 4,
    spread: 0,
    color: "#000000",
    alpha: 0.3,
  });

  const config = type === "box" ? boxShadow : textShadow;
  const shadow = buildShadow(type, config);
  const css = type === "box" ? `box-shadow: ${shadow};` : `text-shadow: ${shadow};`;

  const update = (partial: Partial<ShadowConfig>) => {
    if (type === "box") {
      setBoxShadow((prev) => ({ ...prev, ...partial }));
    } else {
      setTextShadow((prev) => ({ ...prev, ...partial }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1">
        {(["box", "text"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              type === t
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {t === "box" ? "Box shadow" : "Text shadow"}
          </button>
        ))}
      </div>

      <ShadowControls config={config} onChange={update} type={type} />

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 flex items-center justify-center min-h-[200px]">
        {type === "box" ? (
          <div
            className="h-24 w-48 rounded-xl bg-white dark:bg-zinc-100"
            style={{ boxShadow: shadow }}
          />
        ) : (
          <p
            className="text-2xl font-bold text-zinc-900 dark:text-zinc-100"
            style={{ textShadow: shadow }}
          >
            Sample text
          </p>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <pre className="min-w-0 flex-1 overflow-auto rounded-lg bg-zinc-950 p-3 text-[11px] leading-5 text-zinc-100">
          <code>{css}</code>
        </pre>
        <CopyButton value={css} label="Copy CSS" className="shrink-0 px-2.5 py-1 text-xs" />
      </div>
    </div>
  );
}
