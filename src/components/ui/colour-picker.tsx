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
  const [h, s, l] = [hsl.h, hsl.s, hsl.l];

  return (
    <div className="space-y-2">
      <label className="sr-only">{label}</label>
      <div
        className={`grid gap-2 ${
          size === "lg" ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_auto]"
        }`}
      >
        {/* Saturation-brightness canvas */}
        <SaturationCanvas h={h} s={s} l={l} onChange={onChange} size={size} />

        {/* Side panel: hue slider + hex input */}
        <div className="flex flex-col gap-2">
          <HueSlider h={h} s={s} l={l} onChange={onChange} />
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

  // Draw the saturation/brightness gradient
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Base colour at current hue, full saturation, 50% lightness
    const baseRgb = hslToRgb(h, 100, 50);

    // Fill with the base hue
    ctx.fillStyle = `rgb(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b})`;
    ctx.fillRect(0, 0, w, hgt);

    // White gradient (left to right = white to transparent)
    const whiteGrad = ctx.createLinearGradient(0, 0, w, 0);
    whiteGrad.addColorStop(0, "rgba(255,255,255,1)");
    whiteGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, w, hgt);

    // Black gradient (top to bottom = transparent to black)
    const blackGrad = ctx.createLinearGradient(0, 0, 0, hgt);
    blackGrad.addColorStop(0, "rgba(0,0,0,0)");
    blackGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, w, hgt);
  }, [h, w, hgt]);

  // Convert HSL to position on canvas
  const satX = s; // 0-100
  const litY = 100 - l; // inverted for visual

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const newS = Math.round(x * 100);
      const newL = Math.round((1 - y) * 100);
      onChange(hslToHex(h, newS, newL));
    },
    [h, onChange],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      pick(e.clientX, e.clientY);
    };
    const onUp = () => {
      dragging.current = false;
    };
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
      onMouseDown={(e) => {
        dragging.current = true;
        pick(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        dragging.current = true;
        const t = e.touches[0];
        pick(t.clientX, t.clientY);
      }}
    >
      <canvas ref={canvasRef} width={w} height={hgt} className="block" />
      {/* Crosshair indicator */}
      <div
        className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
        style={{ left: `${satX}%`, top: `${litY}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HSL to RGB helper (inline to avoid circular imports)                */
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
  const channel = (t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return Math.round((p + (q - p) * 6 * tt) * 255);
    if (tt < 1 / 2) return Math.round(q * 255);
    if (tt < 2 / 3) return Math.round((p + (q - p) * (2 / 3 - tt) * 6) * 255);
    return Math.round(p * 255);
  };

  return {
    r: channel(hn + 1 / 3),
    g: channel(hn),
    b: channel(hn - 1 / 3),
  };
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
      const newH = Math.round(x * 360);
      onChange(hslToHex(newH, s, l));
    },
    [s, l, onChange],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      pick(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
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
      style={{
        background:
          "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
      }}
      onMouseDown={(e) => {
        dragging.current = true;
        pick(e.clientX);
      }}
      onTouchStart={(e) => {
        dragging.current = true;
        pick(e.touches[0].clientX);
      }}
    >
      {/* Thumb */}
      <div
        className="pointer-events-none absolute top-0 h-full w-1 -translate-x-1/2 rounded-full border border-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"
        style={{
          left: `${(h / 360) * 100}%`,
          backgroundColor: hslToHex(h, 100, 50),
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hex input                                                           */
/* ------------------------------------------------------------------ */

function HexInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [raw, setRaw] = useState(value.toUpperCase());

  useEffect(() => {
    setRaw(value.toUpperCase()); // eslint-disable-line react-hooks/set-state-in-effect -- sync external prop to local state
  }, [value]);

  const submit = () => {
    const match = raw.match(/^#?([0-9a-f]{6})$/i);
    if (match) {
      onChange(`#${match[1].toLowerCase()}`);
    } else {
      setRaw(value.toUpperCase());
    }
  };

  return (
    <input
      type="text"
      value={raw}
      onChange={(e) => setRaw(e.target.value.toUpperCase())}
      onBlur={submit}
      onKeyDown={(e) => e.key === "Enter" && submit()}
      maxLength={7}
      className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-center font-mono text-xs tracking-wider text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      placeholder="#000000"
    />
  );
}

/* ------------------------------------------------------------------ */
/* RGB input                                                           */
/* ------------------------------------------------------------------ */

function RgbInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const cv = toColourValue(value);
  const [r, setR] = useState(String(cv.rgb.r));
  const [g, setG] = useState(String(cv.rgb.g));
  const [b, setB] = useState(String(cv.rgb.b));

  useEffect(() => {
    setR(String(cv.rgb.r)); // eslint-disable-line react-hooks/set-state-in-effect -- sync external prop to local state
    setG(String(cv.rgb.g));
    setB(String(cv.rgb.b));
  }, [cv.rgb.r, cv.rgb.g, cv.rgb.b]);

  const submit = () => {
    const ri = Math.max(0, Math.min(255, parseInt(r) || 0));
    const gi = Math.max(0, Math.min(255, parseInt(g) || 0));
    const bi = Math.max(0, Math.min(255, parseInt(b) || 0));
    const hex = `#${ri.toString(16).padStart(2, "0")}${gi.toString(16).padStart(2, "0")}${bi.toString(16).padStart(2, "0")}`;
    onChange(hex);
  };

  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[9px] font-medium text-zinc-400">RGB</span>
      <input
        type="number"
        min={0}
        max={255}
        value={r}
        onChange={(e) => setR(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
      <input
        type="number"
        min={0}
        max={255}
        value={g}
        onChange={(e) => setG(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
      <input
        type="number"
        min={0}
        max={255}
        value={b}
        onChange={(e) => setB(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HSL input                                                           */
/* ------------------------------------------------------------------ */

function HslInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const hsl = hexToHsl(value);
  const [h, setH] = useState(String(Math.round(hsl.h)));
  const [s, setS] = useState(String(Math.round(hsl.s)));
  const [l, setL] = useState(String(Math.round(hsl.l)));

  useEffect(() => {
    setH(String(Math.round(hsl.h))); // eslint-disable-line react-hooks/set-state-in-effect -- sync external prop to local state
    setS(String(Math.round(hsl.s)));
    setL(String(Math.round(hsl.l)));
  }, [hsl.h, hsl.s, hsl.l]);

  const submit = () => {
    const hi = Math.max(0, Math.min(360, parseInt(h) || 0));
    const si = Math.max(0, Math.min(100, parseInt(s) || 0));
    const li = Math.max(0, Math.min(100, parseInt(l) || 0));
    onChange(hslToHex(hi, si, li));
  };

  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[9px] font-medium text-zinc-400">HSL</span>
      <input
        type="number"
        min={0}
        max={360}
        value={h}
        onChange={(e) => setH(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
      <input
        type="number"
        min={0}
        max={100}
        value={s}
        onChange={(e) => setS(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
      <input
        type="number"
        min={0}
        max={100}
        value={l}
        onChange={(e) => setL(e.target.value)}
        onBlur={submit}
        className="w-8 rounded border border-zinc-200 bg-white px-0.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      />
    </div>
  );
}
