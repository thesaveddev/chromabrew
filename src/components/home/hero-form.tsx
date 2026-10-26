"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState } from "react";
import { hslToHex, parseColour } from "@/lib/design-system/colour/convert";
import { Button } from "@/components/ui/primitives";
import { ColourInput } from "@/components/ui/colour";

/**
 * Hydration-stable fallback: the page is statically rendered, so the server
 * HTML must match the client's first render. Real colors arrive after mount.
 */
const EXAMPLES = ["#47003A", "#0F4C81", "#B45309", "#166534"];

/**
 * A deep seed in the taste of the four curated examples: saturated enough to
 * carry a palette, dark enough to generate a real scale from. Hue is passed
 * in so chips can be quartered around the wheel and never read alike.
 */
function randomSeed(hue: number): string {
  const s = 48 + Math.floor(Math.random() * 36);
  const l = 18 + Math.floor(Math.random() * 20);
  return hslToHex(((hue % 360) + 360) % 360, s, l);
}

/** Four fresh seeds, spread a quarter-turn apart with a little jitter. */
function randomSeeds(): string[] {
  const base = Math.floor(Math.random() * 360);
  return [0, 90, 180, 270].map((offset) =>
    randomSeed(base + offset - 15 + Math.floor(Math.random() * 30)),
  );
}

/**
 * One random seed set per page load, served through useSyncExternalStore:
 * the server snapshot keeps the statically rendered HTML deterministic, and
 * the client snapshot swaps in the random colors immediately after hydration
 * — no effects, no hydration mismatch, stable across re-renders.
 */
let clientSeeds: string[] | null = null;
const subscribeSeeds = () => () => {};
const getSeeds = (): string[] => (clientSeeds ??= randomSeeds());
const getServerSeeds = (): string[] => EXAMPLES;

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
  const tryColors = useSyncExternalStore(subscribeSeeds, getSeeds, getServerSeeds);
  // The user's own edits win over the random seed; null means "show the seed".
  const [draft, setDraft] = useState<string | null>(null);
  const raw = draft ?? tryColors[0];
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
              setDraft(next);
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
        {tryColors.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => {
              setDraft(hex);
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
