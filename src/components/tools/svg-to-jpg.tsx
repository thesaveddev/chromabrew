"use client";

import { useCallback, useRef, useState } from "react";
import { CopyButton } from "@/components/ui/primitives";

export function SvgToJpgConverter() {
  const [svgInput, setSvgInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".svg") && file.type !== "image/svg+xml") {
      setError("Please upload an SVG file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setSvgInput(text);
      setError(null);
      renderPreview(text);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.endsWith(".svg") && file.type !== "image/svg+xml") {
      setError("Please upload an SVG file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setSvgInput(text);
      setError(null);
      renderPreview(text);
    };
    reader.readAsText(file);
  }, []);

  const renderPreview = (svgText: string) => {
    try {
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setError(null);
    } catch {
      setError("Invalid SVG content.");
    }
  };

  const handleSvgChange = (value: string) => {
    setSvgInput(value);
    if (value.trim()) {
      renderPreview(value);
    } else {
      setPreview(null);
    }
  };

  const convert = useCallback(
    async (scale: number) => {
      if (!svgInput.trim()) {
        setError("Paste SVG code or upload a file first.");
        return;
      }
      setConverting(true);
      setError(null);

      try {
        const blob = new Blob([svgInput], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load SVG"));
        });

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const jpgBlob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92),
        );

        const a = document.createElement("a");
        a.href = URL.createObjectURL(jpgBlob);
        a.download = `converted-${scale}x.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Conversion failed.");
      } finally {
        setConverting(false);
      }
    },
    [svgInput],
  );

  return (
    <div className="space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
      >
        <p className="text-sm text-zinc-500">Drag and drop an SVG file, or</p>
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
          accept=".svg,image/svg+xml"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="svg-input" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Or paste SVG code
        </label>
        <textarea
          id="svg-input"
          value={svgInput}
          onChange={(e) => handleSvgChange(e.target.value)}
          placeholder='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">...</svg>'
          className="h-40 w-full rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {preview && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">Preview</p>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <img
              src={preview}
              alt="SVG preview"
              className="mx-auto max-h-64 object-contain"
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs text-zinc-500">Export as JPG</p>
        <div className="flex gap-2">
          {[
            { scale: 1, label: "1x" },
            { scale: 2, label: "2x" },
            { scale: 3, label: "3x" },
            { scale: 4, label: "4x" },
          ].map(({ scale, label }) => (
            <button
              key={scale}
              type="button"
              onClick={() => convert(scale)}
              disabled={!svgInput.trim() || converting}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400">Exports at 92% quality. 1x = original size, 2x = double, etc.</p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
        <p className="text-xs text-zinc-500">
          Works with any valid SVG — logos, icons, illustrations, diagrams. Exports JPG with white background at 92% quality.
        </p>
      </div>
    </div>
  );
}
