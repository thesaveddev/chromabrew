"use client";

import { useMemo, useState } from "react";
import { generateScale } from "@/lib/design-system/colour/scale";
import { formatOklch, parseColour } from "@/lib/design-system/colour/convert";
import { Button, CopyButton } from "@/components/ui/primitives";
import { ColourInput } from "@/components/ui/colour";

/** Shared colour-input + submit scaffold for single-colour tools. */
export function SingleColourForm({
  id,
  raw,
  onRawChange,
  onPrimaryChange,
  submitLabel,
}: {
  id: string;
  raw: string;
  onRawChange: (value: string) => void;
  primary?: string;
  onPrimaryChange: (hex: string) => void;
  submitLabel: string;
}) {
  const [invalid, setInvalid] = useState(false);
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        const resolved = parseColour(raw);
        if (resolved) {
          onPrimaryChange(resolved);
          setInvalid(false);
        } else {
          setInvalid(true);
        }
      }}
    >
      <div className="flex-1">
        <ColourInput
          id={id}
          label="Base colour"
          value={raw}
          invalid={invalid}
          errorMessage="Enter a valid HEX, rgb() or hsl() colour."
          onChange={(next) => {
            onRawChange(next);
            setInvalid(false);
          }}
          onSubmit={(hex) => hex && onPrimaryChange(hex)}
        />
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

export function ShadeTool({ initial = "#47003a" }: { initial?: string }) {
  const [raw, setRaw] = useState(initial);
  const [primary, setPrimary] = useState(initial);
  const scale = useMemo(() => generateScale(primary), [primary]);

  return (
    <div className="space-y-5">
      <SingleColourForm
        id="shade-tool-colour"
        raw={raw}
        onRawChange={setRaw}
        primary={primary}
        onPrimaryChange={setPrimary}
        submitLabel="Generate shades"
      />
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
              <th scope="col" className="px-3 py-2 font-medium">Step</th>
              <th scope="col" className="px-3 py-2 font-medium">HEX</th>
              <th scope="col" className="px-3 py-2 font-medium">OKLCH</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                <span className="sr-only">Copy</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {scale.map((step) => (
              <tr key={step.step} className="border-b border-zinc-100 last:border-0">
                <td className="px-3 py-1.5 font-semibold">{step.step}</td>
                <td className="px-3 py-1.5">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-4 w-8 rounded border border-zinc-300"
                      style={{ backgroundColor: step.hex }}
                    />
                    <code className="font-mono uppercase">{step.hex}</code>
                    {step.isSource ? (
                      <span className="rounded bg-zinc-100 px-1 text-[10px] text-zinc-500">source</span>
                    ) : null}
                  </span>
                </td>
                <td className="px-3 py-1.5 font-mono text-zinc-500">
                  {formatOklch(step.oklch)}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <CopyButton value={step.hex.toUpperCase()} className="!px-2 !py-0.5 text-[11px]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { SingleColourForm as ColourToolForm };
