"use client";

import { useState } from "react";
import {
  PALETTE_STRATEGIES,
} from "@/lib/design-system/palette/generate";
import { parseColour } from "@/lib/design-system/colour/convert";
import type { PaletteColour, PaletteStrategyId } from "@/lib/design-system/types";
import { CopyButton, TabList } from "@/components/ui/primitives";

export function PalettePanel({
  palette,
  strategy,
  paletteSize,
  onStrategyChange,
  onSizeChange,
  onToggleLock,
  onEditSwatch,
}: {
  palette: PaletteColour[];
  strategy: PaletteStrategyId;
  paletteSize: number;
  onStrategyChange: (strategy: PaletteStrategyId) => void;
  onSizeChange: (size: number) => void;
  onToggleLock: (index: number) => void;
  onEditSwatch: (index: number, hex: string | null) => void;
}) {
  return (
    <section aria-labelledby="palette-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="palette-heading" className="panel-title">
          Palette
        </h2>
        {/* Palette size stepper */}
        <div className="flex items-center gap-1" role="group" aria-label="Palette size">
          <button
            type="button"
            onClick={() => onSizeChange(paletteSize - 1)}
            disabled={paletteSize <= 3}
            aria-label="Fewer colours"
            className="grid h-5 w-5 place-items-center rounded border border-zinc-200 text-xs text-zinc-600 transition-colors hover:border-zinc-400 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
          >
            −
          </button>
          <span className="w-10 text-center text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
            {paletteSize} colours
          </span>
          <button
            type="button"
            onClick={() => onSizeChange(paletteSize + 1)}
            disabled={paletteSize >= 10}
            aria-label="More colours"
            className="grid h-5 w-5 place-items-center rounded border border-zinc-200 text-xs text-zinc-600 transition-colors hover:border-zinc-400 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
          >
            +
          </button>
        </div>
      </div>
      <TabList
        label="Palette strategy"
        size="sm"
        options={PALETTE_STRATEGIES.map((s) => ({ id: s.id, label: s.label }))}
        value={strategy}
        onChange={(id) => onStrategyChange(id as PaletteStrategyId)}
      />
      <div className="grid gap-2">
        {palette.map((swatch) => (
          <SwatchRow
            key={swatch.index}
            swatch={swatch}
            onToggleLock={() => onToggleLock(swatch.index)}
            onEdit={(hex) => onEditSwatch(swatch.index, hex)}
          />
        ))}
      </div>
      <p className="text-[11px] leading-4 text-zinc-400">
        Lock swatches to keep them while regenerating, or type a HEX value to
        override one manually.
      </p>
    </section>
  );
}

function SwatchRow({
  swatch,
  onToggleLock,
  onEdit,
}: {
  swatch: PaletteColour;
  onToggleLock: () => void;
  onEdit: (hex: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(swatch.hex);
  const light = luminance(swatch.hex) > 0.5;

  if (editing) {
    return (
      <form
        className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          const resolved = parseColour(draft);
          if (resolved) {
            onEdit(resolved);
            setEditing(false);
          }
        }}
      >
        <label className="sr-only" htmlFor={`swatch-${swatch.index}`}>
          Custom hex for {swatch.role}
        </label>
        <input
          id={`swatch-${swatch.index}`}
          value={draft}
          autoFocus
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const resolved = parseColour(draft);
            if (resolved && resolved !== swatch.hex) {
              onEdit(resolved);
            }
            setEditing(false);
          }}
          className="w-full font-mono text-xs outline-none"
        />
        <button
          type="submit"
          className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white"
        >
          Save
        </button>
      </form>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
      style={{ backgroundColor: swatch.hex, color: light ? "#27272a" : "#fafafa" }}
    >
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold">{swatch.role}</span>
        <span className="font-mono text-[11px] uppercase opacity-80">{swatch.hex}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onToggleLock}
          aria-pressed={swatch.locked}
          title={swatch.locked ? "Unlock swatch" : "Lock swatch"}
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-opacity focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current ${
            swatch.locked ? "opacity-100" : "opacity-50 hover:opacity-90"
          }`}
        >
          {swatch.locked ? "Locked" : "Lock"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(swatch.hex);
            setEditing(true);
          }}
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-50 transition-opacity hover:opacity-90 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
        >
          Edit
        </button>
        <CopyButton
          value={swatch.hex.toUpperCase()}
          label="Copy"
          className="!px-1.5 !py-0.5 text-[10px]"
        />
      </span>
    </div>
  );
}

function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  return (0.2126 * ((n >> 16) & 0xff) + 0.7152 * ((n >> 8) & 0xff) + 0.0722 * (n & 0xff)) / 255;
}
