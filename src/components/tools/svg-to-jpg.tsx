"use client";

import { useCallback, useRef, useState } from "react";
import { createZip } from "@/lib/zip";

interface SvgJob {
  id: string;
  name: string;
  svgText: string;
  status: "queued" | "converting" | "done" | "error";
  previewUrl: string | null;
  jpgBlob: Blob | null;
  size: number | null;
  error: string | null;
}

let jobCounter = 0;

function makeJob(svgText: string, name: string): SvgJob {
  return {
    id: `job-${++jobCounter}`,
    name,
    svgText,
    status: "queued",
    previewUrl: null,
    jpgBlob: null,
    size: null,
    error: null,
  };
}

export function SvgToJpgConverter() {
  const [jobs, setJobs] = useState<SvgJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [scale, setScale] = useState(1);
  const [pastedSvg, setPastedSvg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const acceptSvg = useCallback((file: File): Promise<SvgJob | null> => {
    return new Promise((resolve) => {
      if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        resolve(makeJob(text, file.name));
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      const invalid = list.filter(
        (f) => !f.name.toLowerCase().endsWith(".svg") && f.type !== "image/svg+xml",
      ).length;
      if (invalid > 0) {
        setError(`${invalid} file(s) skipped — only SVG files are supported.`);
      } else {
        setError(null);
      }
      const accepted = list.filter(
        (f) => f.name.toLowerCase().endsWith(".svg") || f.type === "image/svg+xml",
      );
      const newJobs = (await Promise.all(accepted.map(acceptSvg))).filter(
        (j): j is SvgJob => j !== null,
      );
      setJobs((prev) => [...prev, ...newJobs]);
    },
    [acceptSvg],
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

  const svgToJpg = useCallback(
    async (svgText: string, name: string, scaleFactor: number): Promise<Blob> => {
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      try {
        const img = new Image();
        img.src = url;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load SVG"));
        });
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Canvas unavailable");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scaleFactor));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scaleFactor));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const out = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("JPG encoding failed"))),
            "image/jpeg",
            0.92,
          );
        });
        return out;
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [],
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
        const previewBlob = new Blob([job.svgText], { type: "image/svg+xml" });
        const jpgBlob = await svgToJpg(job.svgText, job.name, scale);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  status: "done",
                  previewUrl: URL.createObjectURL(previewBlob),
                  jpgBlob,
                  size: jpgBlob.size,
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
  }, [jobs, converting, scale, svgToJpg]);

  const downloadOne = useCallback((job: SvgJob) => {
    if (!job.jpgBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(job.jpgBlob);
    a.download = job.name.replace(/\.svg$/i, "") + `-${scale}x.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }, [scale]);

  const downloadAll = useCallback(async () => {
    const done = jobs.filter((j) => j.status === "done" && j.jpgBlob);
    if (done.length === 0) return;
    const zipSource: { path: string; content: Uint8Array }[] = [];
    for (const job of done) {
      const bytes = new Uint8Array(await job.jpgBlob!.arrayBuffer());
      zipSource.push({
        path: job.name.replace(/\.svg$/i, "") + `.jpg`,
        content: bytes,
      });
    }
    const zip = createZip(zipSource);
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
      return prev.filter((j) => j.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setJobs((prev) => {
      prev.forEach((j) => {
        if (j.previewUrl) URL.revokeObjectURL(j.previewUrl);
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
        <p className="text-sm text-zinc-500">Drag and drop one or more SVG files, or</p>
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
          accept=".svg,image/svg+xml"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500">Or paste SVG code</p>
        <textarea
          value={pastedSvg}
          onChange={(e) => setPastedSvg(e.target.value)}
          placeholder={"<svg xmlns=\"http://www.w3.org/2000/svg\" …>"}
          rows={4}
          className="w-full rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-zinc-600"
        />
        <button
          type="button"
          onClick={() => {
            const trimmed = pastedSvg.trim();
            if (!trimmed) return;
            setJobs((prev) => [
              ...prev,
              makeJob(trimmed, `pasted-${prev.length + 1}.svg`),
            ]);
            setPastedSvg("");
            setError(null);
          }}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Add to batch
        </button>
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
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {job.previewUrl ? (
                    <img
                      src={job.previewUrl}
                      alt=""
                      className="max-h-8 max-w-8 object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-zinc-400">SVG</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {job.name}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {job.status === "done"
                      ? `${((job.size ?? 0) / 1024).toFixed(1)} KB JPG`
                      : job.status === "converting"
                        ? "Converting…"
                        : job.status === "error"
                          ? job.error
                          : "Queued"}
                  </p>
                </div>
                {job.status === "done" && job.jpgBlob && (
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
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-xs text-zinc-500">Scale</p>
              {[1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    scale === s
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={convertAll}
              disabled={!jobs.some((j) => j.status === "queued") || converting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {converting ? "Converting..." : "Convert all"}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
        <p className="text-xs text-zinc-500">
          Upload as many SVG files as you need and convert them in one batch. Exports JPG at 92% quality with white background — 1x is original size, 2x doubles it, and so on.
        </p>
      </div>
    </div>
  );
}