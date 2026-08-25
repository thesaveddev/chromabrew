"use client";

import { useMemo, useState } from "react";
import {
  PALETTE_STRATEGIES,
  generatePalette,
} from "@/lib/design-system/palette/generate";
import { parseColour } from "@/lib/design-system/colour/convert";
import type { PaletteStrategyId } from "@/lib/design-system/types";
import { Button, TabList } from "@/components/ui/primitives";
import { ColourInput, ColourChip } from "@/components/ui/colour";

export function PaletteTool({ initial = "#47003a" }: { initial?: string }) {
  const [raw, setRaw] = useState(initial);
  const [primary, setPrimary] = useState(initial);
  const [strategy, setStrategy] = useState<PaletteStrategyId>("complementary");
  const [invalid, setInvalid] = useState(false);

  const palette = useMemo(() => generatePalette(primary, strategy), [primary, strategy]);

  return (
    <div className="space-y-5">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
        onSubmit={(event) => {
          event.preventDefault();
          const resolved = parseColour(raw);
          if (resolved) {
            setPrimary(resolved);
            setInvalid(false);
          } else {
            setInvalid(true);
          }
        }}
      >
        <div className="flex-1">
          <ColourInput
            id="palette-tool-colour"
            label="Base color"
            value={raw}
            invalid={invalid}
            errorMessage="Enter a valid HEX, rgb() or hsl() color."
            onChange={(next) => {
              setRaw(next);
              setInvalid(false);
            }}
            onSubmit={(hex) => hex && setPrimary(hex)}
          />
        </div>
        <Button type="submit">Generate palette</Button>
      </form>

      <TabList
        label="Palette strategy"
        size="sm"
        options={PALETTE_STRATEGIES.map((s) => ({ id: s.id, label: s.label }))}
        value={strategy}
        onChange={(id) => setStrategy(id as PaletteStrategyId)}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {palette.map((swatch) => (
          <ColourChip key={swatch.index} hex={swatch.hex} label={swatch.role} />
        ))}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {PALETTE_STRATEGIES.find((s) => s.id === strategy)?.description} Want the
        full design system from this color?{" "}
        <a href={`/design-system?primary=${primary.replace("#", "")}`} className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
          Open it in the generator
        </a>
        .
      </p>
    </div>
  );
}
