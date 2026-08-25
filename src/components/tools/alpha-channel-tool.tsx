"use client";

import { useMemo, useState } from "react";
import { hexToRgb, rgbToHex, parseColour } from "@/lib/design-system/colour/convert";
import { CopyButton } from "@/components/ui/primitives";

function toHex8(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

function hex8ToHexAndAlpha(hex8: string): { hex: string; alpha: number } | null {
  const cleaned = hex8.replace("#", "");
  if (cleaned.length === 8) {
    const hex = `#${cleaned.slice(0, 6)}`;
    const a = parseInt(cleaned.slice(6, 8), 16) / 255;
    if (parseColour(hex)) return { hex, alpha: Math.round(a * 1000) / 1000 };
  }
  if (cleaned.length === 6) {
    const hex = `#${cleaned}`;
    if (parseColour(hex)) return { hex, alpha: 1 };
  }
  return null;
}

export function AlphaChannelTool() {
  const [color, setColor] = useState("#3a86ff");
  const [alpha, setAlpha] = useState(50);
  const [input, setInput] = useState("#3a86ff80");

  const alphaDecimal = alpha / 100;
  const rgb = hexToRgb(color);
  const hex8 = toHex8(color, alphaDecimal);
  const rgba = `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alphaDecimal})`;
  const percent = `${Math.round(alphaDecimal * 100)}%`;

  const presets = [100, 90, 80, 75, 60, 50, 40, 25, 10, 5, 0];

  const handleInputChange = (value: string) => {
    setInput(value);
    const parsed = hex8ToHexAndAlpha(value);
    if (parsed) {
      setColor(parsed.hex);
      setAlpha(Math.round(parsed.alpha * 100));
    }
  };

  const handleColorChange = (value: string) => {
    setColor(value);
    setInput(toHex8(value, alphaDecimal));
  };

  const handleAlphaChange = (value: number) => {
    setAlpha(value);
    setInput(toHex8(color, value / 100));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="h-12 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="alpha-slider" className="text-xs text-zinc-500">Opacity</label>
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{alpha}%</span>
        </div>
        <input
          id="alpha-slider"
          type="range"
          min={0}
          max={100}
          value={alpha}
          onChange={(e) => handleAlphaChange(Number(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-zinc-100"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div
          className="h-24"
          style={{
            backgroundColor: color,
            opacity: alphaDecimal,
          }}
        />
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-10">HEX</span>
            <code className="flex-1 rounded-lg bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-100">{hex8}</code>
            <CopyButton value={hex8} label="Copy" className="px-2 py-1 text-xs" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-10">RGBA</span>
            <code className="flex-1 rounded-lg bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-100">{rgba}</code>
            <CopyButton value={rgba} label="Copy" className="px-2 py-1 text-xs" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-10">Alpha</span>
            <code className="flex-1 rounded-lg bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-100">{percent}</code>
            <CopyButton value={percent} label="Copy" className="px-2 py-1 text-xs" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-zinc-500">Quick presets</p>
        <div className="flex h-10 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleAlphaChange(p)}
              className={`flex-1 flex items-center justify-center text-[10px] font-mono transition-colors ${
                alpha === p
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
              title={`${p}% opacity`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-zinc-500">Preview on common backgrounds</p>
        <div className="grid grid-cols-3 gap-2">
          {["#ffffff", "#f5f5f5", "#000000"].map((bg) => (
            <div
              key={bg}
              className="h-16 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800"
              style={{ backgroundColor: bg }}
            >
              <div
                className="h-10 w-10 rounded"
                style={{ backgroundColor: color, opacity: alphaDecimal }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
