import type { ExportAdapter } from "./adapter";
import { cssAdapter } from "./css";
import { jsonAdapter } from "./json";
import { tailwindAdapter } from "./tailwind";
import { shadcnAdapter } from "./shadcn";

/**
 * Registry of export adapters. Additional formats (SCSS, Material, Flutter
 * …) plug in here without touching generation logic.
 */
export const EXPORT_ADAPTERS: ExportAdapter[] = [
  cssAdapter,
  jsonAdapter,
  tailwindAdapter,
  shadcnAdapter,
];

export { cssAdapter, jsonAdapter, tailwindAdapter, shadcnAdapter };
