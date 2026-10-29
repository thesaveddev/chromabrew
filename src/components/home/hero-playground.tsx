"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  PALETTE_STRATEGIES,
  generatePalette,
} from "@/lib/design-system/palette/generate";
import { hslToHex } from "@/lib/design-system/colour/convert";
import type { PaletteStrategyId } from "@/lib/design-system/types";
import { copyToClipboard } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";

/**
 * The hero's living proof: the real palette engine, running inline.
 * Five swatches from a random primary + strategy — spacebar or button to
 * shuffle, click a hex to copy. Every palette links straight into the
 * generator with the same primary and strategy, so the prettiest part
 * of the page is also a door in.
 *
 * Server fallback is deterministic (brand primary, complementary) so the
 * statically rendered HTML matches the first client render; a fresh
 * palette arrives immediately after mount.
 */
const FALLBACK_PRIMARY = "#47003A";
const FALLBACK_STRATEGY: PaletteStrategyId = "complementary";
const SIZE = 5;

function randomPrimary(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.floor(Math.random() * 30);
  const l = 30 + Math.floor(Math.random() * 25);
  return hslToHex(h, s, l);
}

function randomStrategy(): PaletteStrategyId {
  const pool: PaletteStrategyId[] = PALETTE_STRATEGIES.map((s) => s.id).filter(
    (id) => id !== "monochromatic",
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

function strategyLabel(id: PaletteStrategyId): string {
  return PALETTE_STRATEGIES.find((s) => s.id === id)?.label ?? id;
}

type Seed = { primary: string; strategy: PaletteStrategyId };

/**
 * One fresh seed per page load, served through useSyncExternalStore: the
 * server snapshot keeps the statically rendered HTML deterministic, and the
 * client snapshot swaps in a random palette immediately after hydration —
 * no effects, no hydration mismatch, stable across re-renders.
 */
let clientSeed: Seed | null = null;
const subscribeSeed = () => () => {};
const getClientSeed = (): Seed =>
  (clientSeed ??= { primary: randomPrimary(), strategy: randomStrategy() });
const getServerSeed = (): Seed => ({
  primary: FALLBACK_PRIMARY,
  strategy: FALLBACK_STRATEGY,
});

export function HeroPlayground() {
  const seed = useSyncExternalStore(
    subscribeSeed,
    getClientSeed,
    getServerSeed,
  );
  // Shuffle overrides win over the per-load seed; the seed itself arrives
  // via the store, so hydration stays mismatch-free with no effects.
  const [override, setOverride] = useState<Seed | null>(null);
  const primary = override?.primary ?? seed.primary;
  const strategy = override?.strategy ?? seed.strategy;
  const [copied, setCopied] = useState<string | null>(null);

  const swatches = generatePalette(primary, strategy, { size: SIZE });

  const shuffle = useCallback(() => {
    setOverride({ primary: randomPrimary(), strategy: randomStrategy() });
    setCopied(null);
    track("palette_randomized", { location: "hero" });
  }, []);

  // Spacebar shuffles — unless the visitor is typing somewhere.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      e.preventDefault();
      shuffle();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shuffle]);

  const copyHex = async (hex: string) => {
    const ok = await copyToClipboard(hex);
    if (ok) {
      setCopied(hex);
      window.setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1200);
    }
  };

  return (
    <div>
      <div
        className="overflow-hidden rounded-2xl border border-zinc-200 shadow-xl dark:border-zinc-700"
        aria-label={`Sample ${strategyLabel(strategy)} palette. Press space for a new one.`}
      >
        <div className="flex h-64 sm:h-80" aria-hidden={false}>
          {swatches.map((swatch) => (
            <div
              key={swatch.index}
              className="group relative flex-1 transition-colors"
              style={{ backgroundColor: swatch.hex }}
            >
              <button
                type="button"
                onClick={() => void copyHex(swatch.hex)}
                aria-label={`Copy ${swatch.hex}`}
                className="absolute inset-x-1 bottom-2 rounded-lg bg-black/35 px-1 py-1.5 text-center font-mono text-[11px] uppercase text-white transition-colors hover:bg-black/55 sm:text-xs"
              >
                {copied === swatch.hex ? "Copied!" : swatch.hex}
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-3 dark:bg-zinc-900">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {strategyLabel(strategy)}
          </span>
          <button
            type="button"
            onClick={shuffle}
            className="rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Shuffle&nbsp;&nbsp;<kbd className="rounded bg-white/20 px-1 font-sans dark:bg-zinc-900/10">space</kbd>
          </button>
          <Link
            href={`/design-system?primary=${primary.replace("#", "")}&secondary=${swatches[1].hex.replace("#", "")}&accent=${swatches[2].hex.replace("#", "")}&strategy=${strategy}`}
            className="arrow-nudge ml-auto text-xs font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Open in generator <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
