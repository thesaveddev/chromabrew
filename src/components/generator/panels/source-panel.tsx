"use client";

import { useRef, useState } from "react";
import {
  extractDominantColours,
  ImagePaletteError,
  type ExtractedColour,
} from "@/lib/design-system/image-palette";
import { parseColour } from "@/lib/design-system/colour/convert";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/primitives";
import { ColourInput } from "@/components/ui/colour";

/**
 * Primary colour source: manual entry (HEX/RGB/HSL/picker) plus local
 * image extraction.
 */
export function SourcePanel({
  primary,
  onPrimaryChange,
}: {
  primary: string;
  onPrimaryChange: (hex: string) => void;
}) {
  const [raw, setRaw] = useState(primary.toUpperCase());
  const [invalid, setInvalid] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedColour[] | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyRaw = (candidate: string) => {
    const trimmed = candidate.trim();
    if (!trimmed) return;
    const resolved = parseColour(trimmed);
    if (resolved) {
      setInvalid(false);
      setRaw(resolved.toUpperCase());
      onPrimaryChange(resolved);
      track("design_system_generated", { source: "manual" });
    } else {
      setInvalid(true);
    }
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

  return (
    <section aria-labelledby="source-heading" className="space-y-3">
      <h2 id="source-heading" className="panel-title">
        Primary colour
      </h2>
      <ColourInput
        id="primary-colour"
        label="Primary colour"
        size="lg"
        value={raw}
        invalid={invalid}
        errorMessage="Enter a valid HEX, rgb() or hsl() value."
        onChange={(next) => {
          setRaw(next);
          setInvalid(false);
        }}
        onSubmit={(candidate) => {
          if (candidate) applyRaw(candidate);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => applyRaw(raw)}>
          Generate design system
        </Button>
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

      {extracted ? (
        <fieldset className="rounded-lg border border-zinc-200 p-3">
          <legend className="px-1 text-xs font-medium text-zinc-600">
            Dominant colours — pick your primary
          </legend>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {extracted.map((colour) => (
              <button
                key={colour.hex}
                type="button"
                title={`${colour.hex} (${Math.round(colour.weight * 100)}% of image)`}
                onClick={() => {
                  setRaw(colour.hex.toUpperCase());
                  onPrimaryChange(colour.hex);
                  track("design_system_generated", { source: "image" });
                }}
                className={`group relative aspect-square rounded-md border-2 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                  colour.hex.toLowerCase() === primary.toLowerCase()
                    ? "border-zinc-900"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: colour.hex }}
              >
                <span className="sr-only">Use {colour.hex}</span>
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
