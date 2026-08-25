"use client";

import { useMemo, useState } from "react";
import { parseColour } from "@/lib/design-system/colour/convert";
import { contrastRatio, grade } from "@/lib/design-system/colour/contrast";
import type { ContrastGrade } from "@/lib/design-system/types";

const DEFAULT_COLORS = [
  { name: "Primary", hex: "#3a86ff" },
  { name: "Secondary", hex: "#8338ec" },
  { name: "Accent", hex: "#ff006e" },
  { name: "Background", hex: "#ffffff" },
  { name: "Surface", hex: "#f5f5f5" },
  { name: "Text", hex: "#171717" },
];

function GradeBadge({ grade: g }: { grade: ContrastGrade }) {
  const pass = g.aaNormal;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
        pass
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {pass ? "AA" : "Fail"}
    </span>
  );
}

export function WcagPaletteChecker() {
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#000000");

  const addColor = () => {
    if (parseColour(newHex) && newName.trim()) {
      setColors((prev) => [...prev, { name: newName.trim(), hex: parseColour(newHex)! }]);
      setNewName("");
      setNewHex("#000000");
    }
  };

  const removeColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, field: "name" | "hex", value: string) => {
    setColors((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (field === "hex") {
          const parsed = parseColour(value);
          return parsed ? { ...c, hex: parsed } : c;
        }
        return { ...c, name: value };
      }),
    );
  };

  const matrix = useMemo(() => {
    return colors.map((a) =>
      colors.map((b) => {
        if (a.hex === b.hex) return null;
        const ratio = contrastRatio(a.hex, b.hex);
        return grade(ratio);
      }),
    );
  }, [colors]);

  const totalPairs = (colors.length * (colors.length - 1)) / 2;
  const passingPairs = useMemo(() => {
    let count = 0;
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const g = matrix[i]?.[j];
        if (g?.aaNormal) count++;
      }
    }
    return count;
  }, [matrix, colors.length]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {colors.map((color, i) => (
          <div key={`${color.name}-${i}`} className="flex items-center gap-2">
            <input
              type="color"
              value={color.hex}
              onChange={(e) => updateColor(i, "hex", e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <input
              type="text"
              value={color.name}
              onChange={(e) => updateColor(i, "name", e.target.value)}
              className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              type="text"
              value={color.hex}
              onChange={(e) => updateColor(i, "hex", e.target.value)}
              className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
            />
            {colors.length > 2 && (
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="rounded p-0.5 text-zinc-400 hover:text-red-500"
                aria-label={`Remove ${color.name}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            type="text"
            placeholder="#hex"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="button"
            onClick={addColor}
            disabled={!newName.trim() || !parseColour(newHex)}
            className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700"
          >
            Add
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-500">Contrast matrix</p>
          <p className="text-xs text-zinc-500">
            {passingPairs}/{totalPairs} pairs pass AA
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="p-1" />
                {colors.map((c) => (
                  <th key={c.name} className="p-1 text-center font-medium text-zinc-500">
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="truncate max-w-[60px]">{c.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colors.map((rowColor, i) => (
                <tr key={rowColor.name}>
                  <td className="p-1 text-right font-medium text-zinc-500">
                    <div className="flex items-center justify-end gap-1">
                      <span className="truncate max-w-[60px]">{rowColor.name}</span>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: rowColor.hex }}
                      />
                    </div>
                  </td>
                  {colors.map((colColor, j) => {
                    if (i === j) {
                      return (
                        <td key={colColor.name} className="p-1">
                          <div className="h-8 rounded bg-zinc-100 dark:bg-zinc-800" />
                        </td>
                      );
                    }
                    const g = matrix[i]?.[j];
                    if (!g) return <td key={colColor.name} className="p-1"><div className="h-8" /></td>;
                    const ratio = contrastRatio(rowColor.hex, colColor.hex);
                    return (
                      <td key={colColor.name} className="p-1">
                        <div
                          className="h-8 rounded border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-0.5"
                          style={{
                            backgroundColor: colColor.hex,
                          }}
                        >
                          <span
                            className="font-mono font-bold leading-none"
                            style={{ color: rowColor.hex }}
                          >
                            {ratio.toFixed(1)}
                          </span>
                          <GradeBadge grade={g} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-zinc-500">Failing combinations</p>
        <div className="space-y-1">
          {colors.flatMap((a, i) =>
            colors.slice(i + 1).map((b, j) => {
              const g = matrix[i]?.[colors.indexOf(b)];
              if (g?.aaNormal) return null;
              const ratio = contrastRatio(a.hex, b.hex);
              return (
                <div
                  key={`${a.name}-${b.name}`}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/30 dark:bg-red-900/10"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded" style={{ backgroundColor: a.hex }} />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{a.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">on</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded" style={{ backgroundColor: b.hex }} />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{b.name}</span>
                  </div>
                  <span className="ml-auto font-mono text-xs text-red-600 dark:text-red-400">
                    {ratio.toFixed(2)}:1
                  </span>
                </div>
              );
            }),
          )}
          {colors.every((_, i) =>
            colors.every((_, j) => i === j || matrix[i]?.[j]?.aaNormal),
          ) && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              All pairs pass WCAG AA!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
