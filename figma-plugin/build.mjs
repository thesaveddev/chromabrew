/**
 * Figma plugin bundle.
 *
 * One entry → one file, because Figma executes a single `main` script with no
 * module loader. The ChromaBrew engine (`src/lib/design-system`) is bundled
 * in, so the plugin needs no network access at runtime.
 *
 *   npm run build:figma
 */
import { build } from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [resolve(here, "src/code.ts")],
  outfile: resolve(here, "dist/code.js"),
  bundle: true,
  format: "iife",
  target: ["es2017"],
  logLevel: "info",
});
