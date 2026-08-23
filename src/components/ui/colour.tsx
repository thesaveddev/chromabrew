"use client";

import {
  formatHsl,
  formatOklch,
  formatRgb,
  toColourValue,
} from "@/lib/design-system/colour/convert";
import { CopyButton } from "./primitives";

/** Read-only colour chip with copyable formats. */
export function ColourChip({ hex, label }: { hex: string; label?: string }) {
  const value = toColourValue(hex);
  const isLight = relativeLuma(hex) > 0.45;
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
      style={{ backgroundColor: hex }}
    >
      <div
        className={`flex flex-col gap-0.5 p-3 font-mono text-[11px] leading-4 ${
          isLight ? "text-zinc-800 dark:text-zinc-200" : "text-white"
        }`}
      >
        {label ? <span className="font-sans text-[11px] font-medium opacity-80">{label}</span> : null}
        <span className="uppercase">{hex}</span>
        <span className="opacity-70">{formatRgb(value.rgb)}</span>
        <span className="opacity-70">{formatOklch(value.oklch)}</span>
      </div>
      <CopyButton
        value={hex.toUpperCase()}
        label="Copy HEX"
        variant={isLight ? "secondary" : "primary"}
        className="absolute right-2 top-2 px-2 py-1 text-xs opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      />
    </div>
  );
}

export function ColourFormatsTable({ hex }: { hex: string }) {
  const value = toColourValue(hex);
  const rows = [
    { format: "HEX", code: hex.toUpperCase() },
    { format: "RGB", code: formatRgb(value.rgb) },
    { format: "HSL", code: formatHsl(value.hsl) },
    { format: "OKLCH", code: formatOklch(value.oklch) },
  ];
  return (
    <dl className="divide-y divide-zinc-100">
      {rows.map((row) => (
        <div key={row.format} className="flex items-center justify-between gap-3 py-1.5">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {row.format}
          </dt>
          <dd className="flex items-center gap-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">
            <code>{row.code}</code>
            <CopyButton value={row.code} label="Copy" className="px-2 py-0.5 text-xs" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function relativeLuma(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/* ------------------------------------------------------------------ */
/* Live colour input field                                             */
/* ------------------------------------------------------------------ */

export function ColourInput({
  id,
  value,
  onChange,
  onSubmit,
  label = "Colour",
  invalid = false,
  errorMessage,
  size = "md",
}: {
  id: string;
  value: string;
  onChange: (raw: string) => void;
  onSubmit?: (hex: string | null) => void;
  label?: string;
  invalid?: boolean;
  errorMessage?: string;
  size?: "md" | "lg";
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
    <div
      className={`flex items-stretch overflow-hidden rounded-lg border bg-white transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-zinc-900 dark:bg-zinc-950 dark:focus-within:outline-zinc-100 ${
        invalid ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
      }`}
    >
      <input
        type="color"
        aria-label={`${label} picker`}
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
        onChange={(event) => {
          onChange(event.target.value);
          onSubmit?.(event.target.value);
        }}
        className={`cursor-pointer border-r border-zinc-200 dark:border-zinc-800 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950 ${
          size === "lg" ? "h-14 w-14" : "h-10 w-10"
        }`}
      />
        <input
          id={id}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="#47003A, rgb(71,0,58), hsl(Ã¢â‚¬Â¦)"
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && onSubmit) {
              event.preventDefault();
              onSubmit(value);
            }
          }}
          className={`w-full bg-transparent font-mono tracking-wide outline-none placeholder:text-zinc-400 ${
            size === "lg" ? "px-4 text-base" : "px-3 text-sm"
          }`}
        />
      </div>
      {invalid && errorMessage ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
