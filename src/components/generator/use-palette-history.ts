"use client";

import { useCallback, useEffect, useState } from "react";
import type { GeneratorConfig } from "@/lib/design-system/types";

export interface HistoryEntry {
  id: string;
  ts: number;
  config: GeneratorConfig;
}

const KEY = "chromabrew.history.v2";
const MAX = 12;

function samePalette(a: GeneratorConfig, b: GeneratorConfig): boolean {
  return (
    a.primary === b.primary &&
    a.secondary === b.secondary &&
    a.accent === b.accent &&
    a.paletteStrategy === b.paletteStrategy
  );
}

function load(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* storage full/unavailable — history is best-effort */
  }
}

/** Recent generations persisted in localStorage. */
export function usePaletteHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load after hydration so SSR markup matches the client's first render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration localStorage sync
    setHistory(load());
  }, []);

  const record = useCallback((config: GeneratorConfig) => {
    setHistory((prev) => {
      if (prev[0] && samePalette(prev[0].config, config)) return prev;
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
        config,
      };
      const next = [
        entry,
        ...prev.filter((e) => !samePalette(e.config, config)),
      ].slice(0, MAX);
      persist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { history, record, clear };
}
