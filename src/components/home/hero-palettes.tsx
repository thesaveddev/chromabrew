"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GalleryPalette } from "@/lib/palettes";

type Props = {
  palettes: GalleryPalette[];
};

function pickThree(pool: GalleryPalette[], avoid: string[] = []): GalleryPalette[] {
  const candidates = pool.filter((p) => !avoid.includes(p.slug));
  const source = candidates.length >= 3 ? candidates : pool;
  const picked: GalleryPalette[] = [];
  const guard = [...source];
  while (picked.length < 3 && guard.length > 0) {
    const i = Math.floor(Math.random() * guard.length);
    picked.push(guard.splice(i, 1)[0]);
  }
  return picked;
}

/**
 * The hero's living proof: three real curated palettes, shuffled on demand
 * and gently rotated. Every strip links to its palette page, so the prettiest
 * part of the landing page is also a door into the catalog.
 */
export function HeroPalettes({ palettes }: Props) {
  const [shown, setShown] = useState<GalleryPalette[]>(() => palettes.slice(0, 3));
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setShown((prev) => pickThree(palettes, prev.map((p) => p.slug)));
    }, 7000);
    return () => window.clearInterval(id);
  }, [palettes]);

  const shuffle = () => {
    setSpinning(true);
    setShown((prev) => pickThree(palettes, prev.map((p) => p.slug)));
    window.setTimeout(() => setSpinning(false), 450);
  };

  return (
    <div>
      <div className="grid gap-3" aria-live="off">
        {shown.map((palette) => (
          <Link
            key={palette.slug}
            href={`/palettes/${palette.theme}/${palette.slug}`}
            className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex h-16 sm:h-[72px]" aria-hidden>
              {palette.colors.map((color) => (
                <span
                  key={color}
                  className="h-full flex-1 transition-transform duration-300 group-hover:scale-y-105"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
            <span className="flex items-center justify-between px-3.5 py-2">
              <span className="text-xs font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
                {palette.name}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                {palette.colors[0]}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={shuffle}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <span
          aria-hidden
          className={`inline-block transition-transform duration-500 ${spinning ? "rotate-180" : ""}`}
        >
          ⟳
        </span>
        Shuffle the mood
      </button>
    </div>
  );
}
