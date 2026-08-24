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

interface ColourDrafts {
  primary?: string;
  secondary?: string;
  accent?: string;
}

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
  onApply,
  onRandomize,
}: {
  primary: string;
  secondary: string;
  accent: string;
  /** Commit picked colours — the whole system updates instantly. */
  onApply: (next: ColourDrafts) => void;
  onRandomize: () => void;
}) {
  const [extracted, setExtracted] = useState<ExtractedColour[] | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotId>("primary");
  const [drafts, setDrafts] = useState<ColourDrafts>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const values: Record<SlotId, string> = {
    primary: drafts.primary ?? primary,
    secondary: drafts.secondary ?? secondary,
    accent: drafts.accent ?? accent,
  };
  const committed: Record<SlotId, string> = { primary, secondary, accent };

  const dirty = (Object.keys(drafts) as SlotId[]).filter(
    (slot) => drafts[slot] !== undefined && drafts[slot] !== committed[slot],
  );

  const setDraft = (slot: SlotId, hex: string) =>
    setDrafts((prev) => ({ ...prev, [slot]: hex }));

  const handleApply = () => {
    if (dirty.length === 0) return;
    onApply(drafts);
    setDrafts({});
    track("design_system_generated", { source: "picker" });
  };

  const handleDiscard = () => setDrafts({});

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

  const handleExtractedColour = (colour: ExtractedColour) => {
    setDraft(activeSlot, colour.hex);
  };

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
        {SLOT_META.map((slot) => (
          <ColourSlot
            key={slot.id}
            {...slot}
            value={values[slot.id]}
            hasDraft={drafts[slot.id] !== undefined && drafts[slot.id] !== committed[slot.id]}
            isActive={activeSlot === slot.id}
            onChange={(hex) => setDraft(slot.id, hex)}
            onSelect={() => setActiveSlot(slot.id)}
          />
        ))}
      </div>

      {/* Apply / discard bar */}
      {dirty.length > 0 ? (
        <div
          className="sticky bottom-3 z-10 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95"
          role="status"
        >
          <span className="pl-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            {dirty.length} colour{dirty.length > 1 ? "s" : ""} picked
          </span>
          <Button
            type="button"
            variant="secondary"
            className="px-2.5 py-1 text-xs"
            onClick={handleDiscard}
          >
            Discard
          </Button>
          <Button type="button" className="ml-auto px-3 py-1 text-xs" onClick={handleApply}>
            Submit{dirty.length > 1 ? ` ${dirty.length}` : ""}
          </Button>
        </div>
      ) : null}

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
          Reading image…
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
            Dominant colours — filling: {activeSlot}
          </legend>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {extracted.map((colour) => (
              <button
                key={colour.hex}
                type="button"
                title={`${colour.hex} (${Math.round(colour.weight * 100)}% of image)`}
                onClick={() => handleExtractedColour(colour)}
                className="group relative aspect-square rounded-md border-2 border-transparent transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                style={{ backgroundColor: colour.hex }}
              >
                <span className="sr-only">Use {colour.hex}</span>
              </button>
            ))}
          </div>
          {/* Slot selector for extracted colours */}
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
  hasDraft,
  isActive,
  onChange,
  onSelect,
}: {
  label: string;
  description: string;
  value: string;
  hasDraft: boolean;
  isActive: boolean;
  onChange: (hex: string) => void;
  onSelect: () => void;
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
      <button
        type="button"
        onClick={() => {
          onSelect();
          setExpanded(!expanded);
        }}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3"
      >
        <span className="relative shrink-0">
          <span
            className={`block h-9 w-9 rounded-lg border border-black/10 transition-shadow dark:border-white/15 ${
              hasDraft ? "ring-2 ring-offset-1 ring-zinc-400 dark:ring-zinc-500 dark:ring-offset-zinc-900" : ""
            }`}
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
          <span className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
            {hasDraft ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                picked
              </span>
            ) : null}
          </span>
          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">{description}</span>
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

      {expanded && (
        <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <ColourPicker value={value} onChange={onChange} label={label} size="lg" />
        </div>
      )}
    </div>
  );
}
