"use client";

import { useMemo, useState } from "react";
import { FONT_PAIRINGS } from "@/lib/design-system/primitives/generate";
import { TabList, CopyButton } from "@/components/ui/primitives";

type RatioId = "compact" | "normal" | "generous";

const RATIO_OPTIONS: { id: RatioId; label: string; ratio: number }[] = [
  { id: "compact", label: "Compact 1.2", ratio: 1.2 },
  { id: "normal", label: "Normal 1.25", ratio: 1.25 },
  { id: "generous", label: "Generous 1.333", ratio: 1.333 },
];

/** Type scale steps from smallest to largest display size. */
const STEPS: { name: string; role: string; exp: number }[] = [
  { name: "xs", role: "Caption / helper", exp: -2 },
  { name: "sm", role: "Small text", exp: -1 },
  { name: "base", role: "Body", exp: 0 },
  { name: "lg", role: "Lead / callout", exp: 1 },
  { name: "xl", role: "Sub-heading", exp: 2 },
  { name: "2xl", role: "Heading", exp: 3 },
  { name: "3xl", role: "Section heading", exp: 4 },
  { name: "4xl", role: "Page heading", exp: 5 },
  { name: "5xl", role: "Display", exp: 6 },
];

function round(n: number, dp = 3): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function formatPx(rem: number, basePx: number): string {
  return `${round(rem * basePx, 1)}px`;
}

export function TypographyScaleGenerator({
  initialBase = 16,
  initialRatio = "normal",
  initialPairing = "system",
}: {
  initialBase?: number;
  initialRatio?: RatioId;
  initialPairing?: string;
}) {
  const [basePx, setBasePx] = useState(initialBase);
  const [ratioId, setRatioId] = useState<RatioId>(initialRatio);
  const [pairingId, setPairingId] = useState(initialPairing);

  const ratio = RATIO_OPTIONS.find((r) => r.id === ratioId)!.ratio;
  const pairing = FONT_PAIRINGS.find((p) => p.id === pairingId) ?? FONT_PAIRINGS[0];

  const steps = useMemo(
    () =>
      STEPS.map((step) => {
        const rem = ratio ** step.exp;
        let lineHeight: number;
        if (step.exp <= -1) lineHeight = 1.45;
        else if (step.exp === 0) lineHeight = 1.5;
        else if (step.exp === 1) lineHeight = 1.4;
        else if (step.exp === 2) lineHeight = 1.3;
        else lineHeight = 1.15;
        const letterSpacing = step.exp >= 3 ? "-0.02em" : step.exp === 2 ? "-0.01em" : "0em";
        return {
          ...step,
          rem: round(rem),
          px: round(rem * basePx, 1),
          lineHeight,
          letterSpacing,
          cssSize: `${round(rem)}rem`,
        };
      }),
    [ratio, basePx],
  );

  const cssBlock = useMemo(() => {
    const family = `--font-heading: ${pairing.heading};\n  --font-body: ${pairing.body};`;
    const sizes = steps
      .map(
        (s) =>
          `  --text-${s.name}: ${s.cssSize}; /* ${s.px}px */\n  --leading-${s.name}: ${s.lineHeight};\n  --tracking-${s.name}: ${s.letterSpacing};`,
      )
      .join("\n\n");
    return `:root {\n  --text-base: 1rem; /* ${basePx}px */\n\n${family}\n\n${sizes}\n}`;
  }, [pairing, steps, basePx]);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="typo-base" className="mb-1.5 block text-xs font-medium text-zinc-500">
            Base font size (px)
          </label>
          <div className="flex items-stretch overflow-hidden rounded-lg border border-zinc-300 bg-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:outline-zinc-100">
            <input
              id="typo-base"
              type="number"
              min={12}
              max={28}
              value={basePx}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v) && v >= 8 && v <= 40) setBasePx(v);
              }}
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
            <span className="flex items-center border-l border-zinc-200 px-3 text-xs text-zinc-400 dark:border-zinc-800">
              1rem = {basePx}px
            </span>
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-zinc-500">Scale ratio</span>
          <TabList<RatioId>
            label="Type scale ratio"
            options={RATIO_OPTIONS.map((r) => ({ id: r.id, label: r.label }))}
            value={ratioId}
            onChange={setRatioId}
          />
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-zinc-500">Font pairing</span>
        <TabList
          label="Font pairing"
          options={FONT_PAIRINGS.map((p) => ({ id: p.id, label: p.label }))}
          value={pairingId}
          onChange={setPairingId}
        />
      </div>

      {/* Live preview */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Live preview</p>
          <p className="text-[11px] text-zinc-400">{pairing.label} · 1:{ratio}</p>
        </div>
        <div className="space-y-6 px-4 py-6" style={{ fontFamily: pairing.heading }}>
          {steps
            .slice()
            .reverse()
            .map((s) => (
              <div key={s.name} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0 dark:border-zinc-800/70">
                <span
                  className={s.name === "base" ? "font-normal" : "font-semibold"}
                  style={{
                    fontSize: s.cssSize,
                    lineHeight: s.lineHeight,
                    letterSpacing: s.letterSpacing,
                  }}
                >
                  {s.name === "base" ? "The quick brown fox jumps over the lazy dog." : "Design systems, made with a single color."}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Scale table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
              <th scope="col" className="px-3 py-2 font-medium">Step</th>
              <th scope="col" className="px-3 py-2 font-medium">Size (px)</th>
              <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">rem</th>
              <th scope="col" className="hidden px-3 py-2 font-medium md:table-cell">Line height</th>
              <th scope="col" className="hidden px-3 py-2 font-medium md:table-cell">Letter spacing</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => (
              <tr key={s.name} className="border-b border-zinc-100 dark:border-zinc-800/70 last:border-0">
                <td className="px-3 py-2">
                  <span className="font-mono font-semibold">{s.name}</span>
                  <span className="ml-2 text-[10px] text-zinc-400">{s.role}</span>
                </td>
                <td className="px-3 py-2 font-mono">{s.px}px</td>
                <td className="hidden px-3 py-2 font-mono text-zinc-500 sm:table-cell">{s.cssSize}</td>
                <td className="hidden px-3 py-2 font-mono text-zinc-500 md:table-cell">{s.lineHeight}</td>
                <td className="hidden px-3 py-2 font-mono text-zinc-500 md:table-cell">{s.letterSpacing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CSS output */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">CSS variables</p>
          <CopyButton value={cssBlock} label="Copy CSS" className="!px-2 !py-0.5 text-[11px]" />
        </div>
        <pre className="overflow-x-auto bg-zinc-900 p-4 text-xs leading-6 text-zinc-100">
          <code>{cssBlock}</code>
        </pre>
      </div>

      <p className="text-xs text-zinc-500">
        A modular type scale multiplies the base size by a constant ratio so every step stays
        proportionally related. Steeper ratios (larger) suit display-heavy landing pages; gentler ones
        suit dense, text-heavy apps.
      </p>
    </div>
  );
}
