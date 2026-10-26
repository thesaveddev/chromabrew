"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { ExportPanel } from "./panels/export-panel";
import type { DesignSystem } from "@/lib/design-system/types";

/**
 * Export lives one click away in the sticky toolbar instead of at the bottom
 * of a long scrolling column. The full format picker renders inside a modal
 * so no scroll position is lost.
 */
export function ExportModalButton({ system }: { system: DesignSystem }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open ]);

  return (
    <>
      <Button
        type="button"
        className="px-2.5 py-1 text-xs"
        onClick={() => setOpen(true)}
      >
        Export
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Export design system"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6 dark:border-zinc-700 dark:bg-zinc-950">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Export your design system
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Pick a format, copy it or download it — the code updates
                  with your palette.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close export dialog"
                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>
            <ExportPanel system={system} />
          </div>
        </div>
      )}
    </>
  );
}
