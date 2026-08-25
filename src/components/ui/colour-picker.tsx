"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  hexToHsl,
  hslToHex,
  hexToRgb,
  rgbToHex,
  toColourValue,
} from "@/lib/design-system/colour/convert";

/* ------------------------------------------------------------------ */
/* HSV helpers — the canvas maps saturation (x) × value (y)            */
/* ------------------------------------------------------------------ */

interface Hsv { h: number; s: number; v: number }

function hexToHsv(hex: string): Hsv {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return { h, s, v };
}

function hsvToHex(h: number, s: number, v: number): string {
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const vn = Math.max(0, Math.min(100, v)) / 100;
  const hn = (((h % 360) + 360) % 360) / 60;
  const c = vn * sn;
  const x = c * (1 - Math.abs((hn % 2) - 1));
  const m = vn - c;
  let r = 0, g = 0, b = 0;
  if (hn < 1) { r = c; g = x; }
  else if (hn < 2) { r = x; g = c; }
  else if (hn < 3) { g = c; b = x; }
  else if (hn < 4) { g = x; b = c; }
  else if (hn < 5) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex({
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  });
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

export function ColourPicker({
  value,
  onChange,
  label = "Colour",
  size = "md",
}: {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  size?: "md" | "lg";
}) {
  const hsv = hexToHsv(value);

  return (
    <div className="space-y-2">
      <label className="sr-only">{label}</label>
      <div className="flex gap-2">
        <SaturationCanvas
          h={hsv.h}
          s={hsv.s}
          v={hsv.v}
          onChange={onChange}
          size={size}
          className="min-w-0 flex-1"
        />
        <HueSlider h={hsv.h} s={hsv.s} v={hsv.v} onChange={onChange} />
      </div>
      <HexInput value={value} onChange={onChange} />
      <div className="grid grid-cols-2 gap-2">
        <RgbInput value={value} onChange={onChange} />
        <HslInput value={value} onChange={onChange} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Saturation × Value canvas                                           */
/* ------------------------------------------------------------------ */

function SaturationCanvas({
  h, s, v, onChange, size, className = "",
}: {
  h: number; s: number; v: number;
  onChange: (hex: string) => void;
  size: "md" | "lg";
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const height = size === "lg" ? 150 : 110;

  /* Redraw on hue change and whenever the element resizes */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = Math.max(1, Math.round(parent.clientWidth));
      canvas.width = w;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      /* Base: fully saturated hue at max brightness */
      const base = hsvToRgb(h, 100, 100);
      ctx.fillStyle = `rgb(${base.r},${base.g},${base.b})`;
      ctx.fillRect(0, 0, w, height);
      /* White gradient left→right (desaturates) */
      const white = ctx.createLinearGradient(0, 0, w, 0);
      white.addColorStop(0, "rgba(255,255,255,1)");
      white.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = white;
      ctx.fillRect(0, 0, w, height);
      /* Black gradient top→bottom (darkens) */
      const black = ctx.createLinearGradient(0, 0, 0, height);
      black.addColorStop(0, "rgba(0,0,0,0)");
      black.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = black;
      ctx.fillRect(0, 0, w, height);
    };
    draw();
    const observer = new ResizeObserver(draw);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [h, height]);

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      onChange(hsvToHex(h, Math.round(x * 100), Math.round((1 - y) * 100)));
    },
    [h, onChange],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (!dragging.current) return; e.preventDefault(); pick(e.clientX, e.clientY); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [pick]);

  return (
    <div
      ref={containerRef}
      className={`relative cursor-crosshair overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 select-none ${className}`}
      style={{ height }}
      onMouseDown={(e) => { dragging.current = true; pick(e.clientX, e.clientY); }}
      onTouchStart={(e) => { dragging.current = true; const t = e.touches[0]; pick(t.clientX, t.clientY); }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div
        className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
        style={{ left: `${s}%`, top: `${100 - v}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hue slider — vertical strip                                         */
/* ------------------------------------------------------------------ */

function HueSlider({ h, s, v, onChange }: { h: number; s: number; v: number; onChange: (hex: string) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      onChange(hsvToHex(Math.round(y * 360) % 360, s, v));
    },
    [s, v, onChange],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (!dragging.current) return; e.preventDefault(); pick(e.clientY); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [pick]);

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(h)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") onChange(hsvToHex((h + 357) % 360, s, v));
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") onChange(hsvToHex((h + 3) % 360, s, v));
      }}
      className="relative w-4 cursor-pointer overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
      style={{ background: "linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}
      onMouseDown={(e) => { dragging.current = true; pick(e.clientY); }}
      onTouchStart={(e) => { dragging.current = true; const t = e.touches[0]; pick(t.clientY); }}
    >
      <div
        className="pointer-events-none absolute left-0 h-1 w-full -translate-y-1/2 rounded-full border border-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"
        style={{ top: `${(h / 360) * 100}%`, backgroundColor: hsvToHex(h, 100, 100) }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RGB → HSV helper (used by canvas base)                              */
/* ------------------------------------------------------------------ */

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const vn = Math.max(0, Math.min(100, v)) / 100;
  const hn = (((h % 360) + 360) % 360) / 60;
  const c = vn * sn;
  const x = c * (1 - Math.abs((hn % 2) - 1));
  const m = vn - c;
  let r = 0, g = 0, b = 0;
  if (hn < 1) { r = c; g = x; }
  else if (hn < 2) { r = x; g = c; }
  else if (hn < 3) { g = c; b = x; }
  else if (hn < 4) { g = x; b = c; }
  else if (hn < 5) { r = x; b = c; }
  else { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/* ------------------------------------------------------------------ */
/* Hex input                                                           */
/* ------------------------------------------------------------------ */

function HexInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  const submit = () => {
    if (draft === null) return;
    const match = draft.match(/^#?([0-9a-f]{6})$/i);
    if (match) onChange(`#${match[1].toLowerCase()}`);
    setDraft(null);
  };

  return (
    <input
      type="text"
      value={(draft ?? value).toUpperCase()}
      onChange={(e) => setDraft(e.target.value.toUpperCase())}
      onBlur={submit}
      onKeyDown={(e) => e.key === "Enter" && submit()}
      maxLength={7}
      className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-center font-mono text-xs tracking-wider text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
      placeholder="#000000"
    />
  );
}

/* ------------------------------------------------------------------ */
/* RGB input — always shows current value, submits on blur             */
/* ------------------------------------------------------------------ */

function RgbInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  let r: number, g: number, b: number;
  try {
    const cv = toColourValue(value);
    r = cv.rgb.r;
    g = cv.rgb.g;
    b = cv.rgb.b;
  } catch {
    r = 0; g = 0; b = 0;
  }

  const submit = () => {
    if (draft === null) return;
    const parts = draft.split(",").map((s) => parseInt(s.trim(), 10));
    if (parts.length === 3 && parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
      const hex = `#${parts.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
      onChange(hex);
    }
    setDraft(null);
  };

  const display = draft !== null ? draft.split(",") : [String(r), String(g), String(b)];

  return (
    <div className="flex w-full items-center gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">RGB</span>
      {[0, 1, 2].map((i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          aria-label={["Red", "Green", "Blue"][i]}
          value={display[i] ?? ""}
          onChange={(e) => {
            setDraft((prev) => {
              const current = prev ?? `${r},${g},${b}`;
              const parts = current.split(",");
              parts[i] = e.target.value;
              return parts.join(",");
            });
          }}
          onBlur={submit}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full min-w-0 rounded-md border border-zinc-200 bg-white px-1 py-1 text-center font-mono text-[11px] text-zinc-700 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:focus:border-zinc-500"
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HSL input — always shows current value, submits on blur             */
/* ------------------------------------------------------------------ */

function HslInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  const hsl = hexToHsl(value);
  const h = Math.round(hsl.h);
  const s = Math.round(hsl.s);
  const l = Math.round(hsl.l);

  const submit = () => {
    if (draft === null) return;
    const parts = draft.split(",").map((s) => parseInt(s.trim(), 10));
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      const [hh, ss, ll] = parts;
      onChange(hslToHex(
        Math.max(0, Math.min(360, hh)),
        Math.max(0, Math.min(100, ss)),
        Math.max(0, Math.min(100, ll)),
      ));
    }
    setDraft(null);
  };

  const display = draft !== null ? draft.split(",") : [String(h), String(s), String(l)];

  return (
    <div className="flex w-full items-center gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">HSL</span>
      {[0, 1, 2].map((i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          aria-label={["Hue", "Saturation", "Lightness"][i]}
          value={display[i] ?? ""}
          onChange={(e) => {
            setDraft((prev) => {
              const current = prev ?? `${h},${s},${l}`;
              const parts = current.split(",");
              parts[i] = e.target.value;
              return parts.join(",");
            });
          }}
          onBlur={submit}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full min-w-0 rounded-md border border-zinc-200 bg-white px-1 py-1 text-center font-mono text-[11px] text-zinc-700 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:focus:border-zinc-500"
        />
      ))}
    </div>
  );
}
