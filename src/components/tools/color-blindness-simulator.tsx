"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseColour, formatRgb, formatHsl, formatOklch, toColourValue } from "@/lib/design-system/colour/convert";
import { contrastRatio } from "@/lib/design-system/colour/contrast";
import {
  CVD_ANOMALIES,
  CVD_TYPES,
  differenceScore,
  simulateCvd,
  simulateCvdRgb,
  type CvdVariant,
} from "@/lib/design-system/colour/cvd";
import { ColourInput } from "@/components/ui/colour";
import { CopyButton } from "@/components/ui/primitives";

export function ColorBlindnessSimulator({ initial = "#47003a" }: { initial?: string }) {
  const [raw, setRaw] = useState(initial);
  const [color, setColor] = useState(initial);
  const [sharedPalette, setSharedPalette] = useState<string[] | null>(null);

  // Adopt a linked palette/color (?palette=aabbcc,... or ?color=aabbcc) so the
  // generate page can hand over exactly what is on screen — nothing uploaded.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const paletteParam = params.get("palette");
      if (paletteParam) {
        const parts = paletteParam
          .split(/[,,\s]+/)
          .map((p) => p.trim().replace(/^#/, ""))
          .filter(Boolean);
        const hexes = parts
          .map((p) => parseColour(p.startsWith("#") ? p : `#${p}`))
          .filter((h): h is string => !!h);
        if (hexes.length >= 2) {
          setSharedPalette(hexes.slice(0, 8));
          setColor(hexes[0]);
          setRaw(hexes[0]);
          return;
        }
      }
      const colorParam = params.get("color");
      if (colorParam) {
        const resolved = parseColour(
          colorParam.startsWith("#") ? colorParam : `#${colorParam}`,
        );
        if (resolved) {
          setColor(resolved);
          setRaw(resolved);
        }
      }
    } catch {
      /* malformed query — fall back to the default color */
    }
  }, []);

  const value = useMemo(() => {
    const v = parseColour(color);
    return v ? toColourValue(v) : null;
  }, [color]);

  const simulations = useMemo(
    () => CVD_TYPES.map((t) => ({ ...t, hex: simulateCvd(color, t.id) })),
    [color],
  );

  const anomalies = useMemo(
    () => CVD_ANOMALIES.map((t) => ({ ...t, hex: simulateCvd(color, t.id) })),
    [color],
  );

  return (
    <div className="space-y-5">
      <ColourInput
        id="cb-sim-colour"
        label="Color to simulate"
        size="lg"
        value={raw}
        invalid={!parseColour(color) && raw.trim().length > 0}
        errorMessage="Enter a valid HEX, rgb() or hsl() color."
        onChange={(next) => {
          setRaw(next);
          const resolved = parseColour(next);
          if (resolved) setColor(resolved);
        }}
        onSubmit={(hex) => hex && setColor(hex)}
      />

      {sharedPalette && sharedPalette.length >= 2 ? (
        <section aria-label="Shared palette simulation" className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Shared palette</p>
            <p className="mt-0.5 text-xs text-zinc-500">Linked from the generator — click a swatch to simulate it below.</p>
          </div>
          <div className="flex h-14 overflow-hidden rounded-xl ring-1 ring-black/10">
            {sharedPalette.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => {
                  setColor(hex);
                  setRaw(hex);
                }}
                title={`Simulate ${hex.toUpperCase()}`}
                aria-label={`Simulate ${hex.toUpperCase()}`}
                className="h-full flex-1 transition-transform hover:scale-y-105"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
          {CVD_TYPES.map((t) => (
            <div key={t.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.label}</p>
                <p className="text-[10px] text-zinc-500">{t.desc}</p>
              </div>
              <div className="flex h-10 overflow-hidden rounded-lg ring-1 ring-black/10">
                {sharedPalette.map((hex) => (
                  <span key={`${t.id}-${hex}`} className="h-full flex-1" style={{ backgroundColor: simulateCvd(hex, t.id) }} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {value && (
        <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <dt className="font-medium text-zinc-500">HEX</dt>
            <dd className="mt-1 flex items-center justify-between gap-2">
              <code className="font-mono uppercase">{color}</code>
              <CopyButton value={color.toUpperCase()} className="!px-2 !py-0.5 text-[11px]" />
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <dt className="font-medium text-zinc-500">RGB</dt>
            <dd className="mt-1 font-mono">{formatRgb(value.rgb)}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <dt className="font-medium text-zinc-500">HSL</dt>
            <dd className="mt-1 font-mono">{formatHsl(value.hsl)}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <dt className="font-medium text-zinc-500">OKLCH</dt>
            <dd className="mt-1 font-mono">{formatOklch(value.oklch)}</dd>
          </div>
        </dl>
      )}

      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-medium text-zinc-500">Simulation results</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { id: "normal", label: "Normal vision", desc: "Full trichromatic color vision", hex: color },
              ...simulations,
            ].map((sim) => (
              <SimCard key={sim.id} sim={sim} />
            ))}
          </div>
        </div>

        {anomalies.length ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-zinc-500">
              Milder forms — anomalous trichromacy (far more common than the full forms)
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {anomalies.map((sim) => (
                <SimCard key={sim.id} sim={sim} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-zinc-500">
        Simulations use the Machado et al. (2009) matrices — the same
        transform used by major accessibility tools. Roughly 8% of men and
        0.5% of women have some form of color vision deficiency, and the
        milder anomalous forms make up the vast majority of cases.
      </p>

      <ImageCvdSimulator />

      <ColorPairChecker />
    </div>
  );
}

function SimCard({ sim }: { sim: { id: string; label: string; desc: string; hex: string } }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex">
        <div className="h-14 flex-1" style={{ backgroundColor: sim.hex }} />
      </div>
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{sim.label}</p>
          <code className="font-mono text-[10px] text-zinc-500">{sim.hex.toUpperCase()}</code>
        </div>
        <p className="mt-0.5 text-[10px] text-zinc-500">{sim.desc}</p>
      </div>
    </div>
  );
}

/**
 * Image simulator: drop in a photo, illustration or UI screenshot and see
 * it under every condition — including the milder anomalous forms. All
 * processing happens on a canvas in this browser tab; nothing is uploaded.
 */
function ImageCvdSimulator() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ variant: CvdVariant; dataUrl: string }[]>([]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image — try a PNG, JPG, GIF, WebP or SVG.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setSource(String(reader.result));
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      const longSide = Math.max(image.naturalWidth, image.naturalHeight);
      const scale = Math.min(1, 768 / longSide);
      const w = Math.max(1, Math.round(image.naturalWidth * scale));
      const h = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, w, h);
      const original = ctx.getImageData(0, 0, w, h);
      const variants = [...CVD_TYPES, ...CVD_ANOMALIES];
      const rendered = variants
        .map((variant) => {
          const outCanvas = document.createElement("canvas");
          outCanvas.width = w;
          outCanvas.height = h;
          const outCtx = outCanvas.getContext("2d");
          if (!outCtx) return null;
          const data = new ImageData(new Uint8ClampedArray(original.data), w, h);
          const bytes = data.data;
          for (let i = 0; i < bytes.length; i += 4) {
            const simulated = simulateCvdRgb(
              { r: bytes[i], g: bytes[i + 1], b: bytes[i + 2] },
              variant.id,
            );
            bytes[i] = simulated.r;
            bytes[i + 1] = simulated.g;
            bytes[i + 2] = simulated.b;
          }
          outCtx.putImageData(data, 0, 0);
          return { variant, dataUrl: outCanvas.toDataURL("image/png") };
        })
        .filter((r): r is { variant: CvdVariant; dataUrl: string } => r !== null);
      if (!cancelled) setPreviews(rendered);
    };
    image.onerror = () => setError("Couldn't read that image.");
    image.src = source;
    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Preview a whole image
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Sometimes a single swatch isn&apos;t enough — charts, UI screenshots and photos have color doing
        real work. Drop one in and it is processed locally on a canvas, nothing is uploaded. Files are
        capped at 768px for speed, so any size works.
      </p>

      <div className="mt-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
          aria-label="Choose an image to simulate"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-400 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
        >
          {source ? "Choose a different image" : "Choose an image"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSource(null);
            setPreviews([]);
            if (fileRef.current) fileRef.current.value = "";
          }}
          className={`ml-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100 ${
            source ? "" : "pointer-events-none opacity-40"
          }`}
        >
          Clear
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {source ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <figure className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <img src={source} alt="Original" className="max-h-48 w-full object-contain bg-zinc-50 dark:bg-zinc-900" />
            <figcaption className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Original</p>
              <p className="text-[10px] text-zinc-500">Full trichromatic vision</p>
            </figcaption>
          </figure>
          {previews.map(({ variant, dataUrl }) => (
            <figure key={variant.id} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <img src={dataUrl} alt={`${variant.label} simulation`} className="max-h-48 w-full object-contain bg-zinc-50 dark:bg-zinc-900" />
              <figcaption className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{variant.label}</p>
                    <p className="text-[10px] text-zinc-500">{variant.desc}</p>
                  </div>
                  <a
                    href={dataUrl}
                    download={`${variant.id}.png`}
                    className="shrink-0 rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
                  >
                    Download
                  </a>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Pair check: does a foreground/background combo stay distinguishable
 * under each color vision condition? Contrast ratio alone isn't enough —
 * two colors that differ only in hue can collapse together.
 */
function ColorPairChecker({
  initialA = "#ff6b6b",
  initialB = "#ffffff",
}: {
  initialA?: string;
  initialB?: string;
}) {
  const [rawA, setRawA] = useState(initialA);
  const [rawB, setRawB] = useState(initialB);
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);

  const validA = parseColour(a);
  const validB = parseColour(b);

  const pairs = useMemo(() => {
    if (!validA || !validB) return null;
    return CVD_TYPES.map((t) => {
      const simA = simulateCvd(a, t.id);
      const simB = simulateCvd(b, t.id);
      const diff = differenceScore(simA, simB);
      return {
        ...t,
        simA,
        simB,
        simContrast: contrastRatio(simA, simB),
        diff,
        passes: diff >= 30,
      };
    });
  }, [a, b, validA, validB]);

  return (
    <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Are two colors distinguishable?
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Contrast ratio measures lightness, not hue. Two colors can pass WCAG contrast yet differ only
        in hue and collapse into the same tone for someone with a color vision deficiency. Check a
        text and background pair below to confirm they stay readable to everyone.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ColourInput
          id="cb-a"
          label="Foreground color"
          size="lg"
          value={rawA}
          invalid={rawA.trim().length > 0 && !validA}
          errorMessage="Enter a valid HEX, rgb() or hsl() color."
          onChange={(next) => {
            setRawA(next);
            const resolved = parseColour(next);
            if (resolved) setA(resolved);
          }}
          onSubmit={(hex) => hex && setA(hex)}
        />
        <ColourInput
          id="cb-b"
          label="Background color"
          size="lg"
          value={rawB}
          invalid={rawB.trim().length > 0 && !validB}
          errorMessage="Enter a valid HEX, rgb() or hsl() color."
          onChange={(next) => {
            setRawB(next);
            const resolved = parseColour(next);
            if (resolved) setB(resolved);
          }}
          onSubmit={(hex) => hex && setB(hex)}
        />
      </div>

      {pairs && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Baseline contrast (WCAG)
              </p>
              <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-sm font-semibold dark:bg-zinc-800">
                {contrastRatio(a, b).toFixed(2)}:1
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Necessary, but not sufficient on its own — keep reading to see whether the pair stays
              distinguishable after each simulation.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pairs.map((pair) => (
              <div key={pair.id} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="relative flex h-20 items-center justify-center" style={{ backgroundColor: pair.simB }}>
                  <span className="px-3 py-1 text-sm font-semibold" style={{ color: pair.simA }}>
                    Sample text
                  </span>
                  <button
                    type="button"
                    title="Copy simulated foreground"
                    className="absolute left-2 top-2 rounded bg-white/70 px-1.5 py-0.5 font-mono text-[10px] text-zinc-700 backdrop-blur dark:bg-zinc-900/70 dark:text-zinc-200"
                    onClick={() => navigator.clipboard?.writeText(pair.simA)}
                  >
                    {pair.simA.toUpperCase()}
                  </button>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{pair.label}</p>
                    <p className="text-[10px] text-zinc-500">{pair.desc}</p>
                  </div>
                  <div
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      pair.passes
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {pair.passes ? "Distinguishable" : "Hard to tell apart"}
                  </div>
                </div>
                <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Color difference</span>
                    <span className="font-mono">{pair.diff.toFixed(0)} / 100</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${pair.passes ? "bg-emerald-500" : "bg-red-500"}`}
                      style={{ width: `${pair.diff}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-zinc-500">
                    Contrast {pair.simContrast.toFixed(2)}:1 after simulation
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-500">
            Color difference is the perceptual distance between the simulated pair on a 0–100 scale.
            Below roughly 30, the two are hard to tell apart even when the contrast ratio looks fine.
            The pair checker grades the full (anopia) conditions — if a pair survives those worst cases,
            it will survive the milder anomalous forms too.
          </p>
        </div>
      )}
    </section>
  );
}
