"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseColour } from "@/lib/design-system/colour/convert";
import { Button } from "@/components/ui/primitives";
import { ColourInput } from "@/components/ui/colour";

const EXAMPLES = ["#47003A", "#0F4C81", "#B45309", "#166534"];

/**
 * `tone` exists because this form is used on two surfaces with opposite
 * backgrounds: the hero (white, or near-black in dark mode) and the closing CTA
 * card, which is `bg-zinc-900` in both themes. The light-mode classes measured
 * 2.3:1 and 3.7:1 against that card — a real failure, found by this product's
 * own scanner on this page.
 */
export function HeroColourForm({
  idPrefix = "hero",
  tone = "light",
}: {
  idPrefix?: string;
  tone?: "light" | "dark";
}) {
  const onDark = tone === "dark";
  const router = useRouter();
  const [raw, setRaw] = useState("#47003A");
  const [invalid, setInvalid] = useState(false);

  const submit = (candidate: string) => {
    const resolved = parseColour(candidate);
    if (!resolved) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    router.push(`/design-system?primary=${resolved.replace("#", "")}`);
  };

  return (
    <div className="w-full max-w-xl">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          submit(raw);
        }}
      >
        <div className="flex-1">
          <ColourInput
            id={`${idPrefix}-colour`}
            label="Starting color"
            size="lg"
            value={raw}
            invalid={invalid}
            errorMessage="Enter a valid HEX, rgb() or hsl() color."
            onChange={(next) => {
              setRaw(next);
              setInvalid(false);
            }}
            onSubmit={(candidate) => candidate && submit(candidate)}
          />
        </div>
        <Button type="submit" className="h-14 px-6 text-base">
          Generate design system
        </Button>
      </form>
      <p
        className={`mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${
          onDark ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        <span>Try:</span>
        {EXAMPLES.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => {
              setRaw(hex);
              setInvalid(false);
              submit(hex);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              onDark
                ? "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white focus-visible:outline-white"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
            }`}
          >
            <span
              aria-hidden
              className="h-3.5 w-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: hex }}
            />
            {hex}
          </button>
        ))}
      </p>
    </div>
  );
}
