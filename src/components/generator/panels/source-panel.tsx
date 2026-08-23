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

export function SourcePanel({
  primary,
  secondary,
  accent,
  onPrimaryChange,
  onSecondaryChange,
  onAccentChange,
}: {
  primary: string;
  secondary: string;
  accent: string;
  onPrimaryChange: (hex: string) => void;
  onSecondaryChange: (hex: string) => void;
  onAccentChange: (hex: string) => void;
}) {
  const [extracted, setExtracted] = useState<ExtractedColour[] | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeSlot, setActiveSlot] = useState<"primary" | "secondary" | "accent">("primary");
  const fileRef = useRef<HTMLInputElement>(null);

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
    const handlers = {
      primary: onPrimaryChange,
      secondary: onSecondaryChange,
      accent: onAccentChange,
    };
    handlers[activeSlot](colour.hex);
    track("design_system_generated", { source: "image" });
  };

  return (
    <section aria-labelledby="source-heading" className="space-y-4">
      <h2 id="source-heading" className="panel-title">
        Colours
      </h2>

      {/* Colour slots */}
      <div className="space-y-3">
        <ColourSlot
          label="Primary"
          description="Main brand colour"
          value={primary}
          isActive={activeSlot === "primary"}
          onChange={onPrimaryChange}
          onSelect={() => setActiveSlot("primary")}
        />
        <ColourSlot
          label="Secondary"
          description="Supporting colour"
          value={secondary}
          isActive={activeSlot === "secondary"}
          onChange={onSecondaryChange}
          onSelect={() => setActiveSlot("secondary")}
        />
        <ColourSlot
          label="Accent"
          description="Highlight colour"
          value={accent}
          isActive={activeSlot === "accent"}
          onChange={onAccentChange}
          onSelect={() => setActiveSlot("accent")}
        />
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
            {(["primary", "secondary", "accent"] as const).map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setActiveSlot(slot)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  activeSlot === slot
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {slot}
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
  onChange,
  onSelect,
}: {
  label: string;
  description: string;
  value: string;
  isActive: boolean;
  onChange: (hex: string) => void;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isActive
          ? "border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800/50"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          onSelect();
          setExpanded(!expanded);
        }}
        className="flex w-full items-center gap-3"
      >
        <div
          className="h-8 w-8 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700"
          style={{ backgroundColor: value }}
        />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{value.toUpperCase()}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3">
          <ColourPicker value={value} onChange={onChange} label={label} size="lg" />
        </div>
      )}
    </div>
  );
}
