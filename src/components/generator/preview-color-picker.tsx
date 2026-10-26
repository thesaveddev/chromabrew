"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { copyToClipboard } from "@/components/ui/primitives";
import type { ThemeTokens } from "@/lib/design-system/types";

/**
 * Point-of-use color access for the live preview. While active, hovering an
 * element outlines the painted box and shows a chip naming the color — the
 * semantic token when the hex matches one (`success`), a palette slot when it
 * matches a generated swatch, otherwise plain `bg`/`text` — and clicking
 * copies the hex. The status colors, neutrals and palette stops that the
 * previews use become grabbable exactly where a designer sees them, instead
 * of only through the side panels.
 */

type HoverState = {
  rect: DOMRect;
  hex: string;
  label: string;
};

const RGB_RE = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/;

/** Computed `rgb()/rgba()` → `#rrggbb`, or null for fully transparent. */
function toHex(styleColor: string): string | null {
  const m = RGB_RE.exec(styleColor);
  if (!m) return null;
  const alpha = m[4] === undefined ? 1 : Number.parseFloat(m[4]);
  if (alpha === 0) return null;
  return `#${[m[1], m[2], m[3]]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hasDirectText(el: Element): boolean {
  return Array.from(el.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0,
  );
}

export function PreviewColorPicker({
  active,
  tokens,
  palette,
  onExit,
  children,
}: {
  active: boolean;
  tokens: ThemeTokens;
  /** Generated palette swatches, in order, for `palette N` labels. */
  palette: string[];
  onExit: () => void;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastTarget = useRef<Element | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [copied, setCopied] = useState(false);

  // Reverse lookup: resolved hex → the name a designer should hear.
  const nameByHex = useMemo(() => {
    const map = new Map<string, string>();
    // First declaration wins: `primary` is the useful name when derived
    // tokens (focus-ring) happen to share its hex.
    for (const [id, hex] of Object.entries(tokens)) {
      const key = hex.toLowerCase();
      if (!map.has(key)) map.set(key, id);
    }
    palette.forEach((hex, i) => {
      const key = hex.toLowerCase();
      if (!map.has(key)) map.set(key, `palette ${i + 1}`);
    });
    return map;
  }, [tokens, palette]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onExit]);

  const resolve = (target: Element): HoverState | null => {
    const root = rootRef.current;
    if (!root) return null;

    let paint: Element = target;
    let hex: string | null = null;

    const ownBg = toHex(getComputedStyle(target).backgroundColor);
    if (ownBg) {
      hex = ownBg;
    } else if (hasDirectText(target)) {
      // A styled text run: the text color is the interesting layer.
      hex = toHex(getComputedStyle(target).color);
    } else {
      // Empty area: fall back to the nearest painted ancestor.
      let node: Element | null = target.parentElement;
      while (node && root.contains(node) && !hex) {
        hex = toHex(getComputedStyle(node).backgroundColor);
        if (hex) paint = node;
        node = node.parentElement;
      }
      if (!hex) hex = toHex(getComputedStyle(target).color);
    }
    if (!hex) return null;

    const known = nameByHex.get(hex.toLowerCase());
    return {
      rect: paint.getBoundingClientRect(),
      hex,
      label: known ?? (hasDirectText(target) ? "text" : "bg"),
    };
  };

  const onMouseMove = (event: React.MouseEvent) => {
    if (!active) return;
    const target = event.target as Element;
    if (!(target instanceof Element)) return;
    if (target === lastTarget.current) return;
    lastTarget.current = target;
    setCopied(false);
    setHover(resolve(target));
  };

  const onClick = (event: React.MouseEvent) => {
    if (!active || !hover) return;
    // Picking beats clicking: nothing under the cursor may activate.
    event.preventDefault();
    event.stopPropagation();
    void copyToClipboard(hover.hex.toUpperCase()).then((ok) => {
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }
    });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    // Enter/Space on the toggle button outside already toggles; inside the
    // preview, keep keys from reaching the demo controls while picking.
    if (active && (event.key === "Enter" || event.key === " ")) event.preventDefault();
  };

  return (
    <div
      ref={rootRef}
      className={active ? "relative cursor-crosshair select-none" : "relative"}
      onMouseMove={active ? onMouseMove : undefined}
      onMouseLeave={active ? () => setHover(null) : undefined}
      onClick={active ? onClick : undefined}
      onKeyDown={active ? onKeyDown : undefined}
    >
      {children}
      {active && hover ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none fixed z-40 rounded-md ring-2 ring-sky-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
            style={{
              left: hover.rect.left,
              top: hover.rect.top,
              width: hover.rect.width,
              height: hover.rect.height,
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-[11px] text-zinc-800 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            style={{
              left: Math.max(8, hover.rect.left),
              top: Math.max(8, hover.rect.top - 34),
            }}
          >
            <span
              className="h-3.5 w-3.5 rounded border border-black/10"
              style={{ backgroundColor: hover.hex }}
            />
            <span className="font-semibold">{hover.label}</span>
            <span className="text-zinc-500 dark:text-zinc-400">{hover.hex.toUpperCase()}</span>
            <span className={copied ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}>
              {copied ? "Copied" : "click to copy"}
            </span>
          </span>
        </>
      ) : null}
    </div>
  );
}
