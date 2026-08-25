"use client";

import { useCallback, useRef, useState } from "react";
import { CopyButton } from "@/components/ui/primitives";

type Swatch = { hex: string; rgb: [number, number, number]; count: number };

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

/**
 * Median-cut quantisation — groups pixels into `n` buckets by
 * the channel with the widest range, then averages each bucket.
 */
function medianCut(pixels: [number, number, number][], n: number): Swatch[] {
  if (pixels.length === 0) return [];

  function split(bucket: [number, number, number][]): [number, number, number][][] {
    if (bucket.length <= 1 || bucket.length <= n) return [bucket];
    const ranges = [0, 1, 2].map(
      (ch) => Math.max(...bucket.map((p) => p[ch])) - Math.min(...bucket.map((p) => p[ch])),
    );
    const channel = ranges.indexOf(Math.max(...ranges));
    bucket.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(bucket.length / 2);
    return [bucket.slice(0, mid), bucket.slice(mid)];
  }

  let buckets: [number, number, number][][] = [pixels];
  while (buckets.length < n) {
    const longest = buckets.reduce((best, b, i) =>
      b.length > (buckets[best]?.length ?? 0) ? i : best, 0);
    if (buckets[longest].length <= 1) break;
    const [a, b] = split(buckets[longest]);
    buckets.splice(longest, 1, a, b);
  }

  return buckets
    .map((bucket) => {
      const len = bucket.length;
      const sum = bucket.reduce(
        (s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]] as [number, number, number],
        [0, 0, 0] as [number, number, number],
      );
      const rgb: [number, number, number] = [
        Math.round(sum[0] / len),
        Math.round(sum[1] / len),
        Math.round(sum[2] / len),
      ];
      return { hex: rgbToHex(...rgb), rgb, count: len };
    })
    .sort((a, b) => b.count - a.count);
}

export function ImageColorExtractor() {
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const extract = useCallback((file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const MAX = 200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pixels: [number, number, number][] = [];
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          pixels.push([data[i], data[i + 1], data[i + 2]]);
        }
        setSwatches(medianCut(pixels, 6));
        setPreview(reader.result as string);
        setLoading(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) extract(file);
    },
    [extract],
  );

  return (
    <div className="space-y-5">
      <canvas ref={canvasRef} className="hidden" />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) extract(file);
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100/60 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-zinc-600"
      >
        {loading ? (
          <p className="text-sm text-zinc-500">Extracting colors…</p>
        ) : (
          <>
            <svg className="mb-3 h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Drop an image or click to upload
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              JPEG, PNG, GIF, WebP, SVG — runs entirely in your browser
            </p>
          </>
        )}
      </div>

      {preview && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Uploaded image" className="w-full max-h-64 object-contain bg-zinc-950" />
        </div>
      )}

      {swatches.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-zinc-500">
            {swatches.length} dominant colors extracted
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {swatches.map((s) => (
              <div key={s.hex} className="group rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="h-16 w-full" style={{ backgroundColor: s.hex }} />
                <div className="flex items-center justify-between px-3 py-2">
                  <code className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {s.hex.toUpperCase()}
                  </code>
                  <CopyButton value={s.hex.toUpperCase()} label={`Copy ${s.hex}`} className="!px-1.5 !py-0.5 text-[10px]" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs font-medium text-zinc-500 mb-2">CSS variables</p>
            <pre className="overflow-auto rounded-lg bg-zinc-950 p-3 text-[11px] leading-5 text-zinc-100">
              <code>
                {`:root {\n${swatches.map((s, i) => `  --extracted-${i + 1}: ${s.hex};`).join("\n")}\n}`}
              </code>
            </pre>
            <CopyButton
              value={`:root {\n${swatches.map((s, i) => `  --extracted-${i + 1}: ${s.hex};`).join("\n")}\n}`}
              label="Copy CSS variables"
              className="mt-2 px-2.5 py-1 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
