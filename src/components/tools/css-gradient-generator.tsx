"use client";

import { useCallback, useMemo, useState } from "react";
import { parseColour } from "@/lib/design-system/colour/convert";
import { CopyButton } from "@/components/ui/primitives";

type Stop = { color: string; position: number };
type GradientType = "linear" | "radial" | "conic";

function buildGradient(type: GradientType, angle: number, stops: Stop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const list = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  switch (type) {
    case "linear":
      return `linear-gradient(${angle}deg, ${list})`;
    case "radial":
      return `radial-gradient(circle, ${list})`;
    case "conic":
      return `conic-gradient(from ${angle}deg, ${list})`;
  }
}

let nextId = 3;

export function CssGradientGenerator() {
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<Stop[]>([
    { color: "#ff006e", position: 0 },
    { color: "#3a86ff", position: 50 },
    { color: "#8338ec", position: 100 },
  ]);
  const [barRef, setBarRef] = useState<HTMLDivElement | null>(null);

  const gradient = useMemo(() => buildGradient(type, angle, stops), [type, angle, stops]);
  const css = useMemo(() => `background: ${gradient};`, [gradient]);

  const updateColor = useCallback((index: number, color: string) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, color } : s)));
  }, []);

  const updatePosition = useCallback((index: number, position: number) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, position: Math.max(0, Math.min(100, position)) } : s)));
  }, []);

  const addStop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const position = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      setStops((prev) => [...prev, { color: "#888888", position }].sort((a, b) => a.position - b.position));
    },
    [],
  );

  const removeStop = useCallback((index: number) => {
    setStops((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  return (
    <div className="space-y-5">
      {/* Type selector */}
      <div className="flex gap-1">
        {(["linear", "radial", "conic"] as const).map((t) => (
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
            {t}
          </button>
        ))}
      </div>

      {/* Angle (for linear and conic) */}
      {(type === "linear" || type === "conic") && (
        <div className="flex items-center gap-3">
          <label htmlFor="gradient-angle" className="text-xs text-zinc-500">Angle</label>
          <input
            id="gradient-angle"
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="flex-1 accent-zinc-900 dark:accent-zinc-100"
          />
          <span className="w-10 text-right font-mono text-xs text-zinc-600 dark:text-zinc-400">{angle}°</span>
        </div>
      )}

      {/* Gradient bar */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">Click the bar to add a stop</p>
        <div
          ref={setBarRef}
          role="button"
          tabIndex={0}
          onClick={addStop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
            }
          }}
          className="relative h-10 cursor-crosshair rounded-lg border border-zinc-200 dark:border-zinc-800"
          style={{ background: gradient }}
        >
          {stops.map((stop, i) => (
            <button
              key={`${stop.color}-${stop.position}-${i}`}
              type="button"
              title={`${stop.color} at ${stop.position}%`}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${stop.position}%` }}
            >
              <span
                className="block h-4 w-4 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125"
                style={{ backgroundColor: stop.color }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Stop controls */}
      <div className="space-y-2">
        {stops.map((stop, i) => (
          <div key={`${stop.color}-${stop.position}-${i}`} className="flex items-center gap-2">
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateColor(i, e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <input
              type="text"
              value={stop.color}
              onChange={(e) => {
                if (parseColour(e.target.value)) updateColor(i, e.target.value);
              }}
              className="w-20 rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={stop.position}
              onChange={(e) => updatePosition(i, Number(e.target.value))}
              className="flex-1 accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="w-8 text-right font-mono text-[10px] text-zinc-500">{stop.position}%</span>
            {stops.length > 2 && (
              <button
                type="button"
                onClick={() => removeStop(i)}
                className="rounded p-0.5 text-zinc-400 hover:text-red-500"
                aria-label={`Remove stop ${i + 1}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="h-32" style={{ background: gradient }} />
      </div>

      {/* Output */}
      <div className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <pre className="min-w-0 flex-1 overflow-auto rounded-lg bg-zinc-950 p-3 text-[11px] leading-5 text-zinc-100">
          <code>{css}</code>
        </pre>
        <CopyButton value={css} label="Copy CSS" className="shrink-0 px-2.5 py-1 text-xs" />
      </div>
    </div>
  );
}
