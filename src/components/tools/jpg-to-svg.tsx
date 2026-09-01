"use client";

import { useCallback, useRef, useState } from "react";
import { createZip } from "@/lib/zip";

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

interface SvgJob {
  id: string;
  name: string;
  previewUrl: string;
  svgOutput: string | null;
  svgPreviewUrl: string | null;
  dimensions: { w: number; h: number } | null;
  status: "queued" | "converting" | "done" | "error";
  error: string | null;
}

let jobCounter = 0;

export function JpgToSvgConverter() {
  const [jobs, setJobs] = useState<SvgJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [colors, setColors] = useState(16);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);

  const processImage = useCallback(
    (imageData: ImageData, colorCount: number): string => {
      const { data, width, height } = imageData;
      const colorMap = quantize(data, colorCount);

      const colorLookup = new Map<string, string>();
      for (const [key, val] of colorMap) {
        colorLookup.set(key, `rgb(${val.r},${val.g},${val.b})`);
      }

      const step = Math.max(1, Math.floor(256 / Math.cbrt(colorCount)));
      const pixels: string[][] = [];
      for (let y = 0; y < height; y++) {
        const row: string[] = [];
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = Math.round(data[i] / Math.max(1, Math.floor(256 / Math.cbrt(colorCount)))) * Math.floor(256 / Math.cbrt(colorCount));
          const g = Math.round(data[i + 1] / Math.max(1, Math.floor(256 / Math.cbrt(colorCount)))) * Math.floor(256 / Math.cbrt(colorCount));
          const b = Math.round(data[i + 2] / Math.max(1, Math.floor(256 / Math.cbrt(colorCount)))) * Math.floor(256 / Math.cbrt(colorCount));
          const key = `${r},${g},${b}`;
          row.push(colorLookup.get(key) || `rgb(${r},${g},${b})`);
        }
        pixels.push(row);
      }

      return buildSvg(pixels, width, height);
    },
    [],
  );

  const loadImageData = useCallback(
    (url: string): Promise<{ imageData: ImageData; w: number; h: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            reject(new Error("Canvas unavailable"));
            return;
          }
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas unavailable"));
            return;
          }
          ctx.drawImage(img, 0, 0);
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            resolve({ imageData, w: img.naturalWidth, h: img.naturalHeight });
          } catch {
            reject(new Error("Image too large to process"));
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
      });
    },
    [],
  );

  const handleFile = useCallback(
    (file: File) => {
      return new Promise<SvgJob | null>((resolve) => {
        if (!file.type.startsWith("image/")) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          resolve({
            id: `job-${++jobCounter}`,
            name: file.name,
            previewUrl: url,
            svgOutput: null,
            svgPreviewUrl: null,
            dimensions: null,
            status: "queued" as const,
            error: null,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    },
    [],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      const invalid = list.filter((f) => !f.type.startsWith("image/")).length;
      if (invalid > 0) {
        setError(`${invalid} file(s) skipped — only image files (JPG, PNG, etc.) are supported.`);
      } else {
        setError(null);
      }
      const accepted = list.filter((f) => f.type.startsWith("image/"));
      const newJobs = (await Promise.all(accepted.map(handleFile))).filter(
        (j): j is SvgJob => j !== null,
      );
      setJobs((prev) => [...prev, ...newJobs]);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) void handleFiles(files);
      e.target.value = "";
    },
    [handleFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const convertAll = useCallback(async () => {
    const pending = jobs.filter((j) => j.status === "queued");
    if (pending.length === 0 || converting) return;
    setConverting(true);
    setError(null);
    for (const job of pending) {
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: "converting" } : j)),
      );
      try {
        const { imageData, w, h } = await loadImageData(job.previewUrl);
        const svg = processImage(imageData, colors);
        const blob = new Blob([svg], { type: "image/svg+xml" });
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  status: "done",
                  svgOutput: svg,
                  svgPreviewUrl: URL.createObjectURL(blob),
                  dimensions: { w, h },
                  error: null,
                }
              : j,
          ),
        );
      } catch (err) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  status: "error",
                  error: err instanceof Error ? err.message : "Conversion failed",
                }
              : j,
          ),
        );
      }
    }
    setConverting(false);
  }, [jobs, converting, colors, loadImageData, processImage]);

  const downloadOne = useCallback((job: SvgJob) => {
    if (!job.svgOutput) return;
    const blob = new Blob([job.svgOutput], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = job.name.replace(/\.(jpe?g|png|webp|gif|bmp)$/i, "") + ".svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }, []);

  const downloadAll = useCallback(() => {
    const done = jobs.filter((j) => j.status === "done" && j.svgOutput);
    if (done.length === 0) return;
    const zip = createZip(
      done.map((j) => ({
        path: j.name.replace(/\.(jpe?g|png|webp|gif|bmp)$/i, "") + ".svg",
        content: j.svgOutput!,
      })),
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
    a.download = "converted-svgs.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }, [jobs]);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => {
      const job = prev.find((j) => j.id === id);
      if (job?.previewUrl) URL.revokeObjectURL(job.previewUrl);
      if (job?.svgPreviewUrl) URL.revokeObjectURL(job.svgPreviewUrl);
      return prev.filter((j) => j.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setJobs((prev) => {
      prev.forEach((j) => {
        if (j.previewUrl) URL.revokeObjectURL(j.previewUrl);
        if (j.svgPreviewUrl) URL.revokeObjectURL(j.svgPreviewUrl);
      });
      return [];
    });
  }, []);

  return (
    <div className="space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
      >
        <p className="text-sm text-zinc-500">Drag and drop one or more JPG, PNG or image files, or</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Choose files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

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

      {jobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {jobs.length} file{jobs.length === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-zinc-400">
                Done: {jobs.filter((j) => j.status === "done").length} · Error:{" "}
                {jobs.filter((j) => j.status === "error").length}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={downloadAll}
                disabled={!jobs.some((j) => j.status === "done")}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Download all (.zip)
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {jobs.map((job) => {
              const sizeKB = job.svgOutput
                ? (new Blob([job.svgOutput]).size / 1024).toFixed(1)
                : null;
              return (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {job.svgPreviewUrl ? (
                      <img
                        src={job.svgPreviewUrl}
                        alt=""
                        className="max-h-10 max-w-10 object-contain"
                      />
                    ) : (
                      <img
                        src={job.previewUrl}
                        alt=""
                        className="max-h-10 max-w-10 object-contain"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {job.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {job.status === "done"
                        ? `${job.dimensions?.w}×${job.dimensions?.h} · ${sizeKB ?? 0} KB SVG`
                        : job.status === "converting"
                          ? "Converting…"
                          : job.status === "error"
                            ? job.error
                            : "Queued"}
                    </p>
                  </div>
                  {job.status === "done" && (
                    <button
                      type="button"
                      onClick={() => downloadOne(job)}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Download
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeJob(job.id)}
                    className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    aria-label={`Remove ${job.name}`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={convertAll}
            disabled={!jobs.some((j) => j.status === "queued") || converting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {converting ? "Converting..." : "Convert all to SVG"}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
        <p className="text-xs text-zinc-500">
          Upload many images and convert them all at once. Uses color quantization to reduce each image to N colors, then outputs an SVG with optimized run-length rectangles. Best for logos, icons and illustrations — photos will produce large files.
        </p>
      </div>
    </div>
  );
}