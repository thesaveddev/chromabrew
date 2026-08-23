"use client";

import { generateScale } from "@/lib/design-system/colour/scale";
import { CopyButton, copyToClipboard } from "@/components/ui/primitives";

/** 50–950 perceptual scale strip with copy actions. */
export function ScalePanel({ scale }: { scale: ReturnType<typeof generateScale> }) {
  return (
    <section aria-labelledby="scale-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="scale-heading" className="panel-title">
          Colour scale
        </h2>
        <CopyButton
          value={scale.map((s) => s.hex).join(", ")}
          label="Copy all"
          className="px-2 py-1 text-xs"
        />
      </div>
      <ol className="overflow-hidden rounded-lg">
        {scale.map((step) => {
          const light = step.oklch.l > 0.55;
          return (
            <li key={step.step}>
              <button
                type="button"
                onClick={() => void copyToClipboard(step.hex.toUpperCase())}
                title={`Copy ${step.hex}`}
                className="group flex w-full items-center justify-between px-3 py-1 text-left font-mono text-[11px] transition-transform focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                style={{
                  backgroundColor: step.hex,
                  color: light ? "#27272a" : "#fafafa",
                }}
              >
                <span className="font-sans font-semibold">{step.step}</span>
                <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {step.hex}
                  {step.isSource ? " · source" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-[11px] leading-4 text-zinc-400">
        Generated in OKLCH with your brand hue preserved; the source colour is
        pinned at its natural position.
      </p>
    </section>
  );
}
