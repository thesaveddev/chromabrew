"use client";

import { useMemo, useState } from "react";
import {
  formatHsl,
  formatOklch,
  formatRgb,
  parseColour,
  toColourValue,
} from "@/lib/design-system/colour/convert";
import { contrastRatio, fixContrast, grade } from "@/lib/design-system/colour/contrast";
import { Button, CopyButton } from "@/components/ui/primitives";
import { ColourInput } from "@/components/ui/colour";
import { SingleColourForm } from "./shared-tool-ui";

/* ------------------------------------------------------------------ */
/* Contrast checker                                                    */
/* ------------------------------------------------------------------ */

function ContrastField({
  id,
  label,
  raw,
  onRawChange,
  hex,
  onResolve,
}: {
  id: string;
  label: string;
  raw: string;
  onRawChange: (v: string) => void;
  hex: string;
  onResolve: (hex: string) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      <ColourInput
        id={id}
        label={label}
        value={raw}
        onChange={(next) => {
          onRawChange(next);
          const resolved = parseColour(next);
          if (resolved) onResolve(resolved);
        }}
      />
      <span
        aria-hidden
        className="block h-10 rounded-lg border border-zinc-200 dark:border-zinc-800"
        style={{ backgroundColor: hex }}
      />
    </div>
  );
}

export function ContrastTool({
  initialForeground = "#767676",
  initialBackground = "#ffffff",
}: {
  initialForeground?: string;
  initialBackground?: string;
}) {
  const [fgRaw, setFgRaw] = useState(initialForeground);
  const [bgRaw, setBgRaw] = useState(initialBackground);
  const [fg, setFg] = useState(initialForeground.toLowerCase());
  const [bg, setBg] = useState(initialBackground.toLowerCase());

  const ratio = useMemo(() => contrastRatio(fg, bg), [fg, bg]);
  const g = grade(ratio);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <ContrastField
          id="contrast-fg"
          label="Text color"
          raw={fgRaw}
          onRawChange={setFgRaw}
          hex={fg}
          onResolve={setFg}
        />
        <ContrastField
          id="contrast-bg"
          label="Background color"
          raw={bgRaw}
          onRawChange={setBgRaw}
          hex={bg}
          onResolve={setBg}
        />
      </div>

      <div
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
        style={{ backgroundColor: bg }}
      >
        <p style={{ color: fg }} className="text-base leading-7">
          Normal text sample — the quick brown fox jumps over the lazy dog.
        </p>
        <p style={{ color: fg }} className="mt-1 text-xs">
          Small print sample at 12 px.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-300" role="status">
          Contrast ratio{" "}
          <strong className="font-mono text-base">{ratio.toFixed(2)}:1</strong>
        </p>
        {!g.aaNormal ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const fixed = fixContrast(fg, bg, 4.5);
              if (!fixed.unachievable) {
                setFg(fixed.hex);
                setFgRaw(fixed.hex.toUpperCase());
              }
            }}
          >
            Fix contrast (adjust text)
          </Button>
        ) : null}
      </div>

      <table className="w-full border-collapse text-left text-xs">
        <caption className="sr-only">WCAG pass/fail results</caption>
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
            <th scope="col" className="py-2 font-medium">Threshold</th>
            <th scope="col" className="py-2 font-medium">Required</th>
            <th scope="col" className="py-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["AA normal text", "≥ 4.5", g.aaNormal],
            ["AA large text", "≥ 3.0", g.aaLarge],
            ["AAA normal text", "≥ 7.0", g.aaaNormal],
            ["AAA large text", "≥ 4.5", g.aaaLarge],
          ].map(([label, required, pass]) => (
            <tr key={label as string} className="border-b border-zinc-100 dark:border-zinc-800/70 last:border-0">
              <td className="py-1.5">{label}</td>
              <td className="py-1.5 font-mono text-zinc-500">{required}</td>
              <td className="py-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                    pass ? "bg-emerald-100 text-emerald-800 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:text-red-300"
                  }`}
                >
                  <span aria-hidden>{pass ? "✓" : "✕"}</span>
                  {pass ? "PASS" : "FAIL"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        {[
          ["Text", fg],
          ["Background", bg],
        ].map(([label, hex]) => (
          <div key={label as string} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <dt className="font-medium text-zinc-500">{label}</dt>
            <dd className="mt-1 flex items-center justify-between gap-2">
              <code className="font-mono uppercase">{hex}</code>
              <CopyButton value={(hex as string).toUpperCase()} className="!px-2 !py-0.5 text-[11px]" />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Converters                                                          */
/* ------------------------------------------------------------------ */

export type ConverterMode = "hex-to-rgb" | "rgb-to-hex" | "hex-to-hsl";

export function ConverterTool({ mode }: { mode: ConverterMode }) {
  const [raw, setRaw] = useState("#47003a");
  const resolved = parseColour(raw);
  const value = resolved ? toColourValue(resolved) : null;

  const output = useMemo(() => {
    if (!value) return null;
    switch (mode) {
      case "hex-to-rgb":
        return formatRgb(value.rgb);
      case "hex-to-hsl":
        return formatHsl(value.hsl);
      default:
        return value.hex.toUpperCase();
    }
  }, [value, mode]);

  const inputLabel =
    mode === "rgb-to-hex" ? "RGB color (e.g. rgb(71, 0, 58))" : "HEX color";

  return (
    <div className="space-y-5">
      <ColourInput
        id={`converter-${mode}`}
        label={inputLabel}
        size="lg"
        value={raw}
        invalid={!resolved && raw.trim().length > 0}
        errorMessage="That doesn't look like a valid color."
        onChange={(next) => {
          setRaw(next);
          // Live-convert valid input without requiring submit.
          const live = parseColour(next);
          if (live) setRaw(live.toUpperCase());
        }}
      />

      {output ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Result</p>
            <code className="block truncate font-mono text-base text-zinc-900 dark:text-zinc-100">{output}</code>
            {value ? (
              <p className="mt-1 truncate font-mono text-[11px] text-zinc-400">
                {formatOklch(value.oklch)}
              </p>
            ) : null}
          </div>
          <CopyButton value={output} label="Copy result" />
        </div>
      ) : null}
    </div>
  );
}

/* Re-export for convenience in tool pages. */
export { SingleColourForm };
