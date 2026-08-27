"use client";

import { useCallback, useRef, useState } from "react";

function quantize(data: Uint8ClampedArray, numColors: number): Map<string, { r: number; g: number; b: number; count: number }> {
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
  const step = Math.max(1, Math.floor(256 / Math.cbrt(numColors)));

  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / step) * step;
    const g = Math.round(data[i + 1] / step) * step;
    const b = Math.round(data[i + 2] / step) * step;
    const key = `${r},${g},${b}`;
    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { r, g, b, count: 1 });
    }
  }

  const sorted = [...colorMap.entries()].sort((a, b) => b[1].count - a[1].count);
  const top = new Map(sorted.slice(0, numColors));
  return top;
}

function buildSvg(pixels: string[][], width: number, height: number): string {
  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);

  let currentColor = "";
  let runStart = 0;

  for (let y = 0; y < height; y++) {
    currentColor = "";
    runStart = 0;
    for (let x = 0; x <= width; x++) {
      const color = x < width ? pixels[y][x] : "";
      if (color !== currentColor || x === width) {
        if (currentColor !== "") {
          const w = x - runStart;
          if (w === 1) {
            lines.push(`  <rect x="${runStart}" y="${y}" width="1" height="1" fill="${currentColor}"/>`);
          } else {
            lines.push(`  <rect x="${runStart}" y="${y}" width="${w}" height="1" fill="${currentColor}"/>`);
          }
        }
        currentColor = color;
        runStart = x;
      }
    }
  }

  lines.push("</svg>");
  return lines.join("\n");
}

export function JpgToSvgConverter() {
  const [preview, setPreview] = useState<string | null>(null);
  const [svgOutput, setSvgOutput] = useState<string | null>(null);
  const [svgPreviewUrl, setSvgPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [colors, setColors] = useState(16);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, etc.).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPreview(url);
      setSvgOutput(null);
      setError(null);

      const img = new Image();
      img.onload = () => {
        setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        imageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const convert = useCallback(async () => {
    const imageData = imageDataRef.current;
    if (!imageData) {
      setError("Upload an image first.");
      return;
    }
    setConverting(true);
    setError(null);

    await new Promise((r) => setTimeout(r, 50));

    try {
      const { data, width, height } = imageData;
      const colorMap = quantize(data, colors);

      const colorLookup = new Map<string, string>();
      for (const [key, val] of colorMap) {
        colorLookup.set(key, `rgb(${val.r},${val.g},${val.b})`);
      }

      const pixels: string[][] = [];
      for (let y = 0; y < height; y++) {
        const row: string[] = [];
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = Math.round(data[i] / Math.max(1, Math.floor(256 / Math.cbrt(colors)))) * Math.floor(256 / Math.cbrt(colors));
          const g = Math.round(data[i + 1] / Math.max(1, Math.floor(256 / Math.cbrt(colors)))) * Math.floor(256 / Math.cbrt(colors));
          const b = Math.round(data[i + 2] / Math.max(1, Math.floor(256 / Math.cbrt(colors)))) * Math.floor(256 / Math.cbrt(colors));
          const key = `${r},${g},${b}`;
          row.push(colorLookup.get(key) || `rgb(${r},${g},${b})`);
        }
        pixels.push(row);
      }

      const svg = buildSvg(pixels, width, height);
      setSvgOutput(svg);
      if (svgPreviewUrl) URL.revokeObjectURL(svgPreviewUrl);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      setSvgPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setConverting(false);
    }
  }, [colors, svgPreviewUrl]);

  const downloadSvg = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "converted.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const fileSize = svgOutput ? (new Blob([svgOutput]).size / 1024).toFixed(0) : null;

  return (
    <div className="space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
      >
        <p className="text-sm text-zinc-500">Drag and drop a JPG, PNG or any image, or</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Choose file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {preview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Source image</p>
            {dimensions && (
              <p className="text-xs text-zinc-400 font-mono">{dimensions.w}×{dimensions.h}</p>
            )}
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <img src={preview} alt="Source" className="mx-auto max-h-48 object-contain" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="color-count" className="text-xs text-zinc-500">Colors</label>
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{colors}</span>
        </div>
        <input
          id="color-count"
          type="range"
          min={4}
          max={64}
          value={colors}
          onChange={(e) => setColors(Number(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-zinc-100"
        />
        <div className="flex justify-between text-[10px] text-zinc-400">
          <span>Smaller file</span>
          <span>Better quality</span>
        </div>
      </div>

      <button
        type="button"
        onClick={convert}
        disabled={!preview || converting}
        className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {converting ? "Converting..." : "Convert to SVG"}
      </button>

      {svgOutput && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Output SVG</p>
            <p className="text-xs text-zinc-400 font-mono">{fileSize} KB</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-center overflow-hidden">
              {svgPreviewUrl && (
                <img
                  src={svgPreviewUrl}
                  alt="SVG preview"
                  className="mx-auto max-h-48 w-auto max-w-full object-contain"
                />
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={downloadSvg}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
          >
            Download SVG
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
        <p className="text-xs text-zinc-500">
          Uses color quantization to reduce the image to N colors, then outputs an SVG with optimized run-length rectangles. Best for logos, icons and illustrations — photos will produce large files.
        </p>
      </div>
    </div>
  );
}
