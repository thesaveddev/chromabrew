"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TOOLS } from "@/lib/tools";

/** Signature swatch for each listed tool — real color, hinting at its job. */
const SWATCHES: Record<string, string> = {
  "/tools/color-palette-generator":
    "linear-gradient(135deg, #7c3aed 0%, #2563eb 35%, #10b981 65%, #eab308 100%)",
  "/tools/brand-palettes": "linear-gradient(135deg, #1da1f2 0%, #ff6900 100%)",
  "/tools/shade-generator":
    "linear-gradient(135deg, #eef2ff 0%, #a5b4fc 35%, #4f46e5 65%, #1e1b4b 100%)",
  "/tools/contrast-checker":
    "linear-gradient(135deg, #09090b 50%, #fafafa 50%)",
  "/tools/wcag-palette-checker":
    "linear-gradient(135deg, #34d399 0%, #0d9488 60%, #134e4a 100%)",
  "/tools/color-blindness-simulator":
    "linear-gradient(135deg, #ef4444 0%, #eab308 35%, #22c55e 65%, #3b82f6 100%)",
  "/tools/design-token-generator":
    "linear-gradient(135deg, #fbbf24 0%, #b45309 60%, #451a03 100%)",
  "/tools/tailwind-color-generator":
    "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 60%, #1e3a8a 100%)",
  "/tools/dark-mode-generator":
    "linear-gradient(135deg, #18181b 0%, #3f3f46 60%, #a78bfa 100%)",
  "/tools/image-color-extractor":
    "linear-gradient(135deg, #f97316 0%, #db2777 55%, #4c1d95 100%)",
  "/tools/color-converter":
    "linear-gradient(135deg, #14b8a6 0%, #8b5cf6 100%)",
  "/tools/css-gradient-generator":
    "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
  "/tools/ai-palette-suggestion":
    "linear-gradient(135deg, #a78bfa 0%, #e879f9 60%, #701a75 100%)",
};

const GROUPS: { label: string; hrefs: string[] }[] = [
  {
    label: "Palette creation",
    hrefs: [
      "/tools/color-palette-generator",
      "/tools/shade-generator",
      "/tools/brand-palettes",
      "/tools/ai-palette-suggestion",
    ],
  },
  {
    label: "Accessibility & contrast",
    hrefs: [
      "/tools/contrast-checker",
      "/tools/wcag-palette-checker",
      "/tools/color-blindness-simulator",
    ],
  },
  {
    label: "Tokens & themes",
    hrefs: [
      "/tools/design-token-generator",
      "/tools/tailwind-color-generator",
      "/tools/dark-mode-generator",
    ],
  },
  {
    label: "Extract & create",
    hrefs: [
      "/tools/image-color-extractor",
      "/tools/css-gradient-generator",
      "/tools/color-converter",
    ],
  },
];

const TRIGGER_CLASSES =
  "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100";

const byHref = new Map(TOOLS.map((tool) => [tool.href, tool]));

/** The three most-used tools get a Popular badge in the menu. */
const POPULAR = new Set([
  "/tools/contrast-checker",
  "/tools/color-palette-generator",
  "/tools/image-color-extractor",
]);

/**
 * Free Tools mega menu: a full-navbar-width four-column panel of the
 * most-used tools, grouped by job, each with a large signature swatch —
 * plus a footer into the full directory. The panel positions against the
 * header bar (the trigger wrapper stays unpositioned), so it spans the
 * whole navbar instead of hanging off the button. Click/tap toggles (not
 * hover-only), Escape closes, selecting a link closes, clicking outside
 * closes. Genuine links keep it crawlable.
 */
export function FreeToolsDropdown() {
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
    <div ref={ref} className="hidden md:block">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="free-tools-menu"
        onClick={() => setOpen((v) => !v)}
        className={TRIGGER_CLASSES}
      >
        Free Tools
        <span aria-hidden className="ml-1 inline-block text-[10px]">
          ▾
        </span>
      </button>
      {open ? (
        <div
          id="free-tools-menu"
          role="menu"
          aria-label="Free tools"
          className="menu-pop absolute inset-x-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between px-6 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
              Browse by task
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {TOOLS.length} free tools · no sign-up
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-6 p-6 pt-4 lg:grid-cols-4">
            {GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                  {group.label}
                </p>
                <ul className="mt-2 space-y-1">
                  {group.hrefs.map((href) => {
                    const tool = byHref.get(href);
                    if (!tool) return null;
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          role="menuitem"
                          onClick={() => setOpen(false)}
                          className="group flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-800"
                        >
                          <span
                            aria-hidden
                            className="mt-0.5 h-12 w-12 shrink-0 rounded-xl border border-black/10 shadow-sm"
                            style={{
                              background: SWATCHES[href] ?? "#71717a",
                            }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start gap-1.5">
                              <span className="block text-sm font-semibold leading-snug text-zinc-900 group-hover:underline group-hover:underline-offset-4 dark:text-zinc-100">
                                {tool.navLabel}
                              </span>
                              <span
                                aria-hidden
                                className="shrink-0 text-xs text-zinc-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-zinc-500"
                              >
                                →
                              </span>
                            </span>
                            {POPULAR.has(href) ? (
                              <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Popular
                              </span>
                            ) : null}
                            <span className="mt-0.5 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                              {tool.blurb}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Palettes, contrast, tokens, converters and more — or{" "}
              <Link
                href="/tools#request"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              >
                request a tool
              </Link>
              .
            </p>
            <Link
              href="/tools"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              View all {TOOLS.length} tools →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
