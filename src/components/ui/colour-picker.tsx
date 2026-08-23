"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  hexToHsl,
  hslToHex,
  toColourValue,
} from "@/lib/design-system/colour/convert";

/* ------------------------------------------------------------------ */
/* Custom colour picker: saturation canvas + hue slider + hex input    */
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
  const hsl = hexToHsl(value);

  return (
    <div className="space-y-2">
      <label className="sr-only">{label}</label>
      <div
        className={`grid gap-2 ${
          size === "lg" ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_auto]"
        }`}
      >
        <SaturationCanvas h={hsl.h} s={hsl.s} l={hsl.l} onChange={onChange} size={size} />
        <div className="flex flex-col gap-2">
          <HueSlider h={hsl.h} s={hsl.s} l={hsl.l} onChange={onChange} />
          <HexInput value={value} onChange={onChange} />
          <div className="hidden sm:grid grid-cols-2 gap-1">
            <RgbInput value={value} onChange={onChange} />
            <HslInput value={value} onChange={onChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Saturation / Brightness 2D canvas                                   */
/* ------------------------------------------------------------------ */

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hn = (((h % 360) + 360) % 360) / 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const ch = (t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return Math.round((p + (q - p) * 6 * tt) * 255);
    if (tt < 1 / 2) return Math.round(q * 255);
    if (tt < 2 / 3) return Math.round((p + (q - p) * (2 / 3 - tt) * 6) * 255);
    return Math.round(p * 255);
  };
  return { r: ch(hn + 1 / 3), g: ch(hn), b: ch(hn - 1 / 3) };
}

function SaturationCanvas({
  h,
  s,
  l,
  onChange,
  size,
}: {
  h: number;
  s: number;
  l: number;
  onChange: (hex: string) => void;
  size: "md" | "lg";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const w = size === "lg" ? 220 : 180;
  const hgt = size === "lg" ? 160 : 120;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const base = hslToRgb(h, 100, 50);
    ctx.fillStyle = `rgb(${base.r},${base.g},${base.b})`;
    ctx.fillRect(0, 0, w, hgt);

    const white = ctx.createLinearGradient(0, 0, w, 0);
    white.addColorStop(0, "rgba(255,255,255,1)");
    white.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = white;
    ctx.fillRect(0, 0, w, hgt);

    const black = ctx.createLinearGradient(0, 0, 0, hgt);
    black.addColorStop(0, "rgba(0,0,0,0)");
    black.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, w, hgt);
  }, [h, w, hgt]);

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      onChange(hslToHex(h, Math.round(x * 100), Math.round((1 - y) * 100)));
    },
    [h, onChange],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      pick(e.clientX, e.clientY);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pick]);

  return (
    <div
      ref={containerRef}
      className="relative cursor-crosshair overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 select-none"
      style={{ width: w, height: hgt }}
      onMouseDown={(e) => { dragging.current = true; pick(e.clientX, e.clientY); }}
      onTouchStart={(e) => { dragging.current = true; const t = e.touches[0]; pick(t.clientX, t.clientY); }}
    >
      <canvas ref={canvasRef} width={w} height={hgt} className="block" />
      <div
        className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
        style={{ left: `${s}%`, top: `${100 - l}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hue slider                                                          */
/* ------------------------------------------------------------------ */

function HueSlider({
  h,
  s,
  l,
  onChange,
}: {
  h: number;
  s: number;
  l: number;
  onChange: (hex: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(hslToHex(Math.round(x * 360), s, l));
    },
    [s, l, onChange],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      pick(e.clientX);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pick]);

  return (
    <div
      ref={trackRef}
      className="relative h-4 cursor-pointer overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700 select-none"
      style={{ background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}
      onMouseDown={(e) => { dragging.current = true; pick(e.clientX); }}
      onTouchStart={(e) => { dragging.current = true; pick(e.touches[0].clientX); }}
    >
      <div
        className="pointer-events-none absolute top-0 h-full w-1 -translate-x-1/2 rounded-full border border-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"
        style={{ left: `${(h / 360) * 100}%`, backgroundColor: hslToHex(h, 100, 50) }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hex input                                                           */
/* ------------------------------------------------------------------ */

function HexInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const display = editing ?? value.toUpperCase();

  const submit = () => {
    if (editing === null) return;
    const match = editing.match(/^#?([0-9a-f]{6})$/i);
    if (match) onChange(`#${match[1].toLowerCase()}`);
    setEditing(null);
  };

  return (
    <input
      type="text"
      value={display}
      onChange={(e) => setEditing(e.target.value.toUpperCase())}
      onBlur={submit}
      onKeyDown={(e) => e.key === "Enter" && submit()}
      maxLength={7}
      className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-center font-mono text-xs tracking-wider text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      placeholder="#000000"
    />
  );
}

/* ------------------------------------------------------------------ */
/* RGB input — derived from prop, local state only while editing       */
/* ------------------------------------------------------------------ */

function RgbInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const cv = toColourValue(value);
  const [r, setR] = useState<string | null>(null);
  const [g, setG] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);

  const submit = () => {
    const ri = Math.max(0, Math.min(255, parseInt(r ?? String(cv.rgb.r)) || 0));
    const gi = Math.max(0, Math.min(255, parseInt(g ?? String(cv.rgb.g)) || 0));
    const bi = Math.max(0, Math.min(255, parseInt(b ?? String(cv.rgb.b)) || 0));
    onChange(`#${ri.toString(16).padStart(2, "0")}${gi.toString(16).padStart(2, "0")}${bi.toString(16).padStart(2, "0")}`);
    setR(null);
    setG(null);
    setB(null);
  };

  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[9px] font-medium text-zinc-400">RGB</span>
      <input
        type="number" min={0} max={255}
        value={r ?? cv.rgb.r}
        onChange={(e) => setR(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
      <input
        type="number" min={0} max={255}
        value={g ?? cv.rgb.g}
        onChange={(e) => setG(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
      <input
        type="number" min={0} max={255}
        value={b ?? cv.rgb.b}
        onChange={(e) => setB(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HSL input — derived from prop, local state only while editing       */
/* ------------------------------------------------------------------ */

function HslInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const hsl = hexToHsl(value);
  const [h, setH] = useState<string | null>(null);
  const [s, setS] = useState<string | null>(null);
  const [l, setL] = useState<string | null>(null);

  const submit = () => {
    const hi = Math.max(0, Math.min(360, parseInt(h ?? String(Math.round(hsl.h))) || 0));
    const si = Math.max(0, Math.min(100, parseInt(s ?? String(Math.round(hsl.s))) || 0));
    const li = Math.max(0, Math.min(100, parseInt(l ?? String(Math.round(hsl.l))) || 0));
    onChange(hslToHex(hi, si, li));
    setH(null);
    setS(null);
    setL(null);
  };

  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[9px] font-medium text-zinc-400">HSL</span>
      <input
        type="number" min={0} max={360}
        value={h ?? Math.round(hsl.h)}
        onChange={(e) => setH(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
      <input
        type="number" min={0} max={100}
        value={s ?? Math.round(hsl.s)}
        onChange={(e) => setS(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
      <input
        type="number" min={0} max={100}
        value={l ?? Math.round(hsl.l)}
        onChange={(e) => setL(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
    </div>
  );
}
