import type { ExportAdapter } from "./adapter";
import { cssAdapter } from "./css";
import { jsonAdapter } from "./json";
import { tailwindAdapter } from "./tailwind";
import { shadcnAdapter } from "./shadcn";
import { bootstrapAdapter } from "./bootstrap";
import { muiAdapter } from "./mui";
import { antdAdapter } from "./antd";
import { chakraAdapter } from "./chakra";

/**
 * Registry of export adapters. Additional formats (SCSS, Material, Flutter
 * …) plug in here without touching generation logic.
 */
export const EXPORT_ADAPTERS: ExportAdapter[] = [
  cssAdapter,
  jsonAdapter,
  tailwindAdapter,
  shadcnAdapter,
  bootstrapAdapter,
  muiAdapter,
  antdAdapter,
  chakraAdapter,
];

export {
  cssAdapter,
  jsonAdapter,
  tailwindAdapter,
  shadcnAdapter,
  bootstrapAdapter,
  muiAdapter,
  antdAdapter,
  chakraAdapter,
};
