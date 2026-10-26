"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryPalette, PaletteTheme } from "@/lib/palettes";
import { PaletteCard } from "./palette-card";

/** Cards rendered before the visitor asks for more. Keeps first paint light. */
const PAGE_SIZE = 12;

type Props = {
  palettes: GalleryPalette[];
  themes: PaletteTheme[];
};

/** Search across names, hex values, tags, and theme names. */
function matches(palette: GalleryPalette, themeName: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hexQuery = q.startsWith("#") ? q : `#${q}`;
  return (
    palette.name.toLowerCase().includes(q) ||
    themeName.toLowerCase().includes(q) ||
    palette.tags.some((tag) => tag.includes(q)) ||
    palette.colors.some(
      (color) =>
        color.toLowerCase().includes(q) ||
        color.toLowerCase().includes(hexQuery),
    )
  );
}

export function PaletteExplorer({ palettes, themes }: Props) {
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const themeNameOf = (slug: string) =>
    themes.find((t) => t.slug === slug)?.name ?? slug;

  const results = useMemo(
    () =>
      palettes.filter(
        (palette) =>
          (theme === "all" || palette.theme === theme) &&
          matches(palette, themeNameOf(palette.theme), query),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [palettes, themes, query, theme],
  );

  // A new search or theme filter restarts pagination from the first page.
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  };
  const handleThemeChange = (slug: string) => {
    setTheme(slug);
    setVisibleCount(PAGE_SIZE);
  };

  const visible = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  // Infinite loading for scrollers; the button below covers everyone else.
  useEffect(() => {
    if (!hasMore) return;
    const el = moreRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, results.length));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, results.length]);

  return (
    <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="palette-search" className="sr-only">
          Search palettes
        </label>
        <input
          id="palette-search"
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by name, tag, theme, or hex — try “ocean”, “neon”, or “e76f51”…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by theme">
        {[{ slug: "all", name: "All" }, ...themes].map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => handleThemeChange(t.slug)}
            aria-pressed={theme === t.slug}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              theme === t.slug
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400" role="status">
        {results.length === palettes.length
          ? `${palettes.length} curated palettes — search or pick a theme to narrow it down.`
          : `${results.length} of ${palettes.length} palettes match.`}
      </p>

      {results.length > 0 ? (
        <>
          <ul className="cv-auto mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((palette) => (
              <li key={`${palette.theme}-${palette.slug}`}>
                <PaletteCard palette={palette} />
              </li>
            ))}
          </ul>
          {hasMore && (
            <div ref={moreRef} className="mt-6 text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400" role="status">
                Showing {visible.length} of {results.length} palettes
              </p>
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((count) => Math.min(count + PAGE_SIZE, results.length))
                }
                className="mt-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-500 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
              >
                Show more palettes
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No palettes match “{query}”
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Try a color (“blue”), a mood (“calm”), or a hex value — or{" "}
            <a href="/generate" className="font-medium underline underline-offset-4">
              generate your own
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
