"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PALETTE_LINKS = [
  {
    href: "/generate",
    title: "Generate a palette",
    blurb: "Press space for instant five-color schemes.",
  },
  {
    href: "/palettes",
    title: "Browse palettes",
    blurb: "Curated library by mood and theme.",
  },
  {
    href: "/gallery",
    title: "Community gallery",
    blurb: "Palettes shared by ChromaBrew users.",
  },
  {
    href: "/tools/ai-palette-suggestion",
    title: "Palette ideas",
    blurb: "Five suggestions from a brand description.",
  },
] as const;

const TRIGGER_CLASSES =
  "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100";

/**
 * Palettes dropdown — groups the four palette routes behind one top-level
 * item so the header stays at four destinations without losing URLs.
 * Click/tap toggles (not hover-only), Escape closes, selecting a link
 * closes, clicking outside closes. Genuine links keep it crawlable.
 */
export function PalettesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="palettes-menu"
        onClick={() => setOpen((v) => !v)}
        className={TRIGGER_CLASSES}
      >
        Palettes
        <span aria-hidden className="ml-1 inline-block text-[10px]">
          ▾
        </span>
      </button>
      {open ? (
        <div
          id="palettes-menu"
          role="menu"
          aria-label="Palette tools"
          className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {PALETTE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-800"
            >
              <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {link.title}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                {link.blurb}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
