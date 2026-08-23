/**
 * Client-side dominant-colour extraction.
 *
 * Images never leave the browser: pixels are read from a canvas and
 * quantised locally. No network requests, no uploads.
 */

import { oklabDistance } from "./colour/convert";

export interface ExtractedColour {
  hex: string;
  /** 0–1 share of the sampled image this colour represents. */
  weight: number;
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const SAMPLE_SIZE = 96;
const MAX_COLOURS = 8;

export class ImagePaletteError extends Error {}

interface Bucket {
  r: number;
  g: number;
  b: number;
  count: number;
}

export async function extractDominantColours(file: File): Promise<ExtractedColour[]> {
  if (!file.type.startsWith("image/")) {
    throw new ImagePaletteError("That file is not an image. Use PNG, JPG, WebP or GIF.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImagePaletteError("Image is larger than 8 MB. Try a smaller file.");
  }

  const bitmap = await createBitmap(file);
  try {
    return quantise(drawToCanvas(bitmap));
  } finally {
    bitmap.close();
  }
}

async function createBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new ImagePaletteError("Could not read that image. Try a different file.");
  }
}

function drawToCanvas(bitmap: ImageBitmap): Uint8ClampedArray {
  const scale = Math.min(1, SAMPLE_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ImagePaletteError("Your browser could not process this image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height).data;
}

function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function saturationOf(max: number, min: number): number {
  return max === min ? 0 : (max - min) / max;
}

function quantise(data: Uint8ClampedArray): ExtractedColour[] {
  // 5-bit-per-channel buckets (32,768 max).
  const buckets = new Map<number, Bucket>();
  let opaqueCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 125) continue; // skip transparent pixels
    opaqueCount++;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  if (!opaqueCount) {
    throw new ImagePaletteError("This image appears fully transparent.");
  }

  const scored = [...buckets.values()]
    .map((bucket) => {
      const count = bucket.count;
      const r = bucket.r / count;
      const g = bucket.g / count;
      const b = bucket.b / count;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = saturationOf(max, min);
      // Slightly favour colourful regions but never exclude neutrals —
      // monochrome images must still produce usable palettes.
      const score = Math.sqrt(count) * (0.55 + sat);
      return { hex: toHex(r, g, b), weight: count / opaqueCount, score };
    })
    .sort((a, b) => b.score - a.score);

  const picked: ExtractedColour[] = [];
  for (const candidate of scored) {
    if (picked.length >= MAX_COLOURS) break;
    const tooSimilar = picked.some((p) => oklabDistance(p.hex, candidate.hex) < 0.09);
    if (!tooSimilar) picked.push({ hex: candidate.hex, weight: candidate.weight });
  }
  return picked;
}
