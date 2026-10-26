"use client";

import { useState } from "react";
import type { GalleryPalette } from "@/lib/palettes";
import { PaletteCard } from "./palette-card";

/** Cards rendered before the visitor asks for more. Keeps huge themes light. */
const PAGE_SIZE = 12;

export function ThemePaletteGrid({ palettes }: { palettes: GalleryPalette[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = palettes.slice(0, visibleCount);
  const hasMore = visibleCount < palettes.length;

  return (
    <>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {visible.map((palette) => (
          <li key={palette.slug}>
            <PaletteCard palette={palette} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400" role="status">
            Showing {visible.length} of {palettes.length} palettes
          </p>
          <button
            type="button"
            onClick={() =>
              setVisibleCount((count) => Math.min(count + PAGE_SIZE, palettes.length))
            }
            className="mt-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-500 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
          >
            Show more palettes
          </button>
        </div>
      )}
    </>
  );
}
