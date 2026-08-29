"use client";

import { useRef, useState } from "react";
import {
  extractDominantColours,
  ImagePaletteError,
  type ExtractedColour,
} from "@/lib/design-system/image-palette";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/primitives";
import { ColourPicker } from "@/components/ui/colour-picker";

type SlotId = "primary" | "secondary" | "accent";

const SLOT_META: Array<{ id: SlotId; label: string; description: string }> = [
  { id: "primary", label: "Primary", description: "Main brand colour" },
  { id: "secondary", label: "Secondary", description: "Supporting colour" },
  { id: "accent", label: "Accent", description: "Highlight colour" },
];

export function SourcePanel({
  primary,
  secondary,
  accent,
  derivedSecondary,
  derivedAccent,
  onApply,
  onRemoveSecondary,
  onRemoveAccent,
  onRandomize,
}: {
  primary: string;
  secondary?: string;
  accent?: string;
  /** Auto-derived secondary/accent from the palette (when the user hasn't chosen one). */
  derivedSecondary?: string;
  derivedAccent?: string;
  /** Commit a colour -- the whole system updates instantly. */
  onApply: (next: { primary?: string; secondary?: string; accent?: string }) => void;
  onRemoveSecondary?: () => void;
  onRemoveAccent?: () => void;
  onRandomize: () => void;
}) {
  const [extracted, setExtracted] = useState<ExtractedColour[] | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotId>("primary");
  const fileRef = useRef<HTMLInputElement>(null);

  const values: Partial<Record<SlotId, string>> = { primary, secondary, accent };

  const applySlot = (slot: SlotId, hex: string) => {
    onApply({ [slot]: hex });
    track("design_system_generated", { source: "picker" });
  };

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setImageError(null);
    setBusy(true);
    try {
      const colours = await extractDominantColours(file);
      setExtracted(colours);
      track("image_palette_generated");
    } catch (error) {
      setImageError(
        error instanceof ImagePaletteError
          ? error.message
          : "Something went wrong reading that image.",
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const hasSecondary = Boolean(secondary);
  const hasAccent = Boolean(accent);

  return (
    <section aria-labelledby="source-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="source-heading" className="panel-title">
          Colours
        </h2>
        <button
          type="button"
          onClick={onRandomize}
          title="Generate a random palette"
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          Random
        </button>
      </div>

      {/* Colour slots */}
      <div className="space-y-3">
        <ColourSlot
          {...SLOT_META[0]}
          value={values.primary!}
          isActive={activeSlot === "primary"}
          onChange={(hex) => applySlot("primary", hex)}
          onSelect={() => setActiveSlot("primary")}
        />
        {hasSecondary ? (
          <ColourSlot
            {...SLOT_META[1]}
            value={secondary!}
            isActive={activeSlot === "secondary"}
            onChange={(hex) => applySlot("secondary", hex)}
            onSelect={() => setActiveSlot("secondary")}
            onRemove={onRemoveSecondary}
          />
        ) : derivedSecondary ? (
          <ColourSlot
            {...SLOT_META[1]}
            value={derivedSecondary}
            isActive={activeSlot === "secondary"}
            auto
            onChange={(hex) => applySlot("secondary", hex)}
            onSelect={() => setActiveSlot("secondary")}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setActiveSlot("secondary");
              onApply({ secondary: "#7c3aed" });
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-3 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-lg dark:border-zinc-700">+</span>
            <span>
              <span className="font-medium">Add secondary</span>
              <span className="block text-[11px]">Supporting colour for buttons and badges</span>
            </span>
          </button>
        )}
        {hasAccent ? (
          <ColourSlot
            {...SLOT_META[2]}
            value={accent!}
            isActive={activeSlot === "accent"}
            onChange={(hex) => applySlot("accent", hex)}
            onSelect={() => setActiveSlot("accent")}
            onRemove={onRemoveAccent}
          />
        ) : derivedAccent ? (
          <ColourSlot
            {...SLOT_META[2]}
            value={derivedAccent}
            isActive={activeSlot === "accent"}
            auto
            onChange={(hex) => applySlot("accent", hex)}
            onSelect={() => setActiveSlot("accent")}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setActiveSlot("accent");
              onApply({ accent: "#f59e0b" });
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-3 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-lg dark:border-zinc-700">+</span>
            <span>
              <span className="font-medium">Add accent</span>
              <span className="block text-[11px]">Highlight colour for CTAs and alerts</span>
            </span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
          Extract from image
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          aria-label="Upload an image to extract colours"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      {busy ? (
        <p className="text-xs text-zinc-500" role="status">
          Reading image...
        </p>
      ) : null}
      {imageError ? (
        <p className="text-xs text-red-600" role="alert">
          {imageError}
        </p>
      ) : null}

      {/* Extracted colours */}
      {extracted ? (
        <fieldset className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <legend className="px-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Dominant colours - filling: {activeSlot}
          </legend>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {extracted.map((colour) => (
              <button
                key={colour.hex}
                type="button"
                title={`${colour.hex} (${Math.round(colour.weight * 100)}% of image)`}
                onClick={() => applySlot(activeSlot, colour.hex)}
                className="group relative aspect-square rounded-md border-2 border-transparent transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                style={{ backgroundColor: colour.hex }}
              >
                <span className="sr-only">Use {colour.hex}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1">
            {SLOT_META.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setActiveSlot(slot.id)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  activeSlot === slot.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {slot.id}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-zinc-400">
            Images are processed entirely in your browser and never uploaded.
          </p>
        </fieldset>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Individual colour slot                                              */
/* ------------------------------------------------------------------ */

function ColourSlot({
  label,
  description,
  value,
  isActive,
  auto,
  onChange,
  onSelect,
  onRemove,
}: {
  label: string;
  description: string;
  value: string;
  isActive: boolean;
  /** When true, this value is auto-derived from the primary rather than user-picked. */
  auto?: boolean;
  onChange: (hex: string) => void;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        isActive
          ? "border-zinc-300 bg-zinc-50 shadow-sm dark:border-zinc-600 dark:bg-zinc-800/60"
          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/30"
      }`}
    >
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={() => {
            onSelect();
            setExpanded(!expanded);
          }}
          aria-expanded={expanded}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className="relative shrink-0">
            <span
              className="block h-9 w-9 rounded-lg border border-black/10 dark:border-white/15"
              style={{ backgroundColor: value }}
            />
            {isActive ? (
              <span
                aria-hidden
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-900"
                style={{ backgroundColor: value }}
              />
            ) : null}
          </span>
          <span className="flex-1 text-left">
            <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {label}
              {auto ? (
                <span className="rounded bg-zinc-200/80 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-700/60 dark:text-zinc-400">
                  auto
                </span>
              ) : null}
            </span>
            <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
              {auto ? "Derived from your primary — pick to override" : description}
            </span>
          </span>
          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {value.toUpperCase()}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`shrink-0 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title={`Remove ${label}`}
            className="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <ColourPicker value={value} onChange={onChange} label={label} size="lg" />
        </div>
      )}
    </div>
  );
}
