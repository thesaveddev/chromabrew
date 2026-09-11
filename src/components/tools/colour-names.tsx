"use client";

import { useMemo, useState } from "react";
import { ColourInput } from "@/components/ui/colour";
import { CopyButton, LinkButton } from "@/components/ui/primitives";
import { parseColour } from "@/lib/design-system/colour/convert";
import { CSS_NAMED_COLORS, closestNamedColour, dominantHue } from "@/lib/css-colors";

const BROWSE_LIMIT = 60;

export function ColourNames() {
  const [raw, setRaw] = useState("#7c3aed");
  const [search, setSearch] = useState("");

  const resolved = parseColour(raw);
  const closest = useMemo(
    () => (resolved ? closestNamedColour(resolved) : null),
    [resolved],
  );
  const hue = useMemo(() => (resolved ? dominantHue(resolved) : null), [resolved]);

  const query = search.trim().toLowerCase();
  const matches = query
    ? CSS_NAMED_COLORS.filter((c) => c.name.includes(query)).slice(0, BROWSE_LIMIT)
    : CSS_NAMED_COLORS.slice(0, BROWSE_LIMIT);

  return (
    <div className="space-y-8">
      <section aria-labelledby="closest-heading">
        <h2 id="closest-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Closest named colour
        </h2>
        <div className="mt-3">
          <ColourInput
            id="colour-names-input"
            label="Colour to name"
            size="lg"
            value={raw}
            invalid={!resolved && raw.trim().length > 0}
            errorMessage="That doesn't look like a valid color. Try #47003A, rgb(71, 0, 58) or hsl(326, 100%, 14%)."
            onChange={(next) => {
              setRaw(next);
              const live = parseColour(next);
              if (live) setRaw(live.toUpperCase());
            }}
          />
        </div>

        {closest ? (
          <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="h-14 w-14 shrink-0 rounded-lg border border-black/10 dark:border-white/10"
                style={{ backgroundColor: closest.hex }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Closest CSS named colour</p>
                <p className="font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {closest.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {closest.hex.toUpperCase()} · OKLab distance{" "}
                  <span className="font-mono">{closest.distance.toFixed(3)}</span>
                  {closest.distance === 0 ? " — exact match" : ""}
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Dominant hue · {hue}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={closest.name} label="Copy name" />
                <CopyButton value={closest.hex.toUpperCase()} label="Copy hex" />
                <LinkButton
                  href={`/design-system?primary=${closest.hex.slice(1)}`}
                  variant="secondary"
                >
                  Use as seed
                </LinkButton>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="browse-heading" className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="browse-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Browse all 148 named colours
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Click a swatch to see its closest-name card. Showing first {matches.length} of
              {CSS_NAMED_COLORS.length}.
            </p>
          </div>
          <label className="sr-only" htmlFor="colour-names-search">
            Search named colours
          </label>
          <input
            id="colour-names-search"
            type="search"
            placeholder="Search names…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full max-w-56 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:outline-zinc-100"
          />
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {matches.map((colour) => {
            const isClosest = closest !== null && colour.hex === closest.hex;
            return (
              <li key={colour.name}>
                <button
                  type="button"
                  onClick={() => setRaw(colour.hex)}
                  className={`group w-full rounded-lg border p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 ${
                    isClosest
                      ? "border-zinc-500 bg-zinc-100 dark:border-zinc-400 dark:bg-zinc-800"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <span
                    className="block h-8 w-full rounded-md border border-black/5 dark:border-white/10"
                    style={{ backgroundColor: colour.hex }}
                    aria-hidden
                  />
                  <span className="mt-1.5 block truncate font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {colour.name}
                  </span>
                  <span className="block truncate text-[10px] uppercase text-zinc-400">
                    {colour.hex}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}