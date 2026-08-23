"use client";

import { fixContrast } from "@/lib/design-system/colour/contrast";
import { CHECK_PAIR_TOKENS } from "@/lib/design-system/tokens/generate";
import type {
  AccessibilityCheck,
  AccessibilityReport,
  SemanticTokenId,
  ThemeMode,
} from "@/lib/design-system/types";

interface CheckWithTokens extends AccessibilityCheck {
  foregroundToken: SemanticTokenId;
  backgroundToken: SemanticTokenId;
}

function withTokens(check: AccessibilityCheck): CheckWithTokens | null {
  const pairId = check.id.slice(0, check.id.length - (check.mode.length + 1));
  const tokens = CHECK_PAIR_TOKENS[pairId];
  return tokens
    ? { ...check, foregroundToken: tokens.fg, backgroundToken: tokens.bg }
    : null;
}

/** WCAG report with one-click contrast fixes applied to the failing side. */
export function AccessibilityPanel({
  report,
  onApplyFix,
}: {
  report: AccessibilityReport;
  onApplyFix: (mode: ThemeMode, token: SemanticTokenId, hex: string) => void;
}) {
  const checks = report.checks
    .map(withTokens)
    .filter((c): c is CheckWithTokens => c !== null);
  const lightFailing = report.summary.light.failing;
  const darkFailing = report.summary.dark.failing;

  return (
    <section aria-labelledby="a11y-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="a11y-heading" className="panel-title">
          Accessibility — WCAG 2.x
        </h2>
        <p className="text-xs text-zinc-500" role="status">
          Light: {lightFailing === 0 ? "all AA pairs pass" : `${lightFailing} pair(s) fail AA`} ·{" "}
          Dark: {darkFailing === 0 ? "all AA pairs pass" : `${darkFailing} pair(s) fail AA`}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <caption className="sr-only">
            Contrast ratios for key colour pairs with WCAG pass/fail results
          </caption>
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[11px] uppercase tracking-wide text-zinc-500">
              <th scope="col" className="px-3 py-2 font-medium">Pair</th>
              <th scope="col" className="px-3 py-2 font-medium">Preview</th>
              <th scope="col" className="px-3 py-2 font-medium">Ratio</th>
              <th scope="col" className="px-3 py-2 font-medium">AA normal</th>
              <th scope="col" className="px-3 py-2 font-medium">AA large</th>
              <th scope="col" className="px-3 py-2 font-medium">AAA normal</th>
              <th scope="col" className="px-3 py-2 font-medium">AAA large</th>
              <th scope="col" className="px-3 py-2 font-medium">
                <span className="sr-only">Fix</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={check.id} className="border-b border-zinc-100 dark:border-zinc-800/70 last:border-0">
                <td className="px-3 py-1.5">
                  {check.label}
                  <span className="ml-1.5 rounded bg-zinc-100 px-1 py-0.5 text-[10px] uppercase text-zinc-500">
                    {check.mode}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: check.backgroundHex, color: check.foregroundHex }}
                    aria-hidden
                  >
                    Sample Aa
                  </span>
                </td>
                <td className="px-3 py-1.5 font-mono">{check.grade.ratio.toFixed(2)}:1</td>
                <GradeCell pass={check.grade.aaNormal} label={check.grade.aaNormal ? "PASS" : "FAIL"} />
                <GradeCell pass={check.grade.aaLarge} label={check.grade.aaLarge ? "PASS" : "FAIL"} />
                <GradeCell pass={check.grade.aaaNormal} label={check.grade.aaaNormal ? "PASS" : "FAIL"} />
                <GradeCell pass={check.grade.aaaLarge} label={check.grade.aaaLarge ? "PASS" : "FAIL"} />
                <td className="px-3 py-1.5 text-right">
                  {!check.grade.aaNormal ? (
                    <FixButton
                      check={check}
                      onApplyFix={(hex) => onApplyFix(check.mode, check.foregroundToken, hex)}
                    />
                  ) : (
                    <span className="text-zinc-300" aria-hidden>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] leading-4 text-zinc-400">
        Thresholds: AA normal ≥ 4.5:1, AA large ≥ 3:1, AAA normal ≥ 7:1, AAA
        large ≥ 4.5:1. Fixes adjust the nearest accessible value in OKLCH,
        preserving hue.
      </p>
    </section>
  );
}

function FixButton({
  check,
  onApplyFix,
}: {
  check: CheckWithTokens;
  onApplyFix: (fixedHex: string) => void;
}) {
  const fixed = fixContrast(check.foregroundHex, check.backgroundHex, 4.5);
  if (fixed.unachievable) return null;
  return (
    <button
      type="button"
      onClick={() => onApplyFix(fixed.hex)}
      title={`Adjust ${check.foregroundToken} to ${fixed.hex} (${fixed.ratio.toFixed(2)}:1)`}
      className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
    >
      Fix contrast
    </button>
  );
}

function GradeCell({ pass, label }: { pass: boolean; label: string }) {
  return (
    <td className="px-3 py-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          pass ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
        }`}
      >
        <span aria-hidden>{pass ? "✓" : "✗"}</span>
        {label}
      </span>
      <span className="sr-only">{label.replace(/(AA|AAA)/, "$1 ") + (pass ? " passes" : " fails")}</span>
    </td>
  );
}
