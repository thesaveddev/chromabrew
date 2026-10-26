// Build the in-browser audit bundle: axe-core + the client-safe audit engines
// as one minified classic script.
//
// Outputs:
//   public/in-browser/in-browser-audit.js — hosted file the bookmarklet loads
//   chrome-extension/content-audit.js      — same bundle, injected by the panel
//
// Run: node scripts/build-in-browser-bundle.mjs
// Uses the project's esbuild (devDependency). No network, no secrets.
import { buildSync } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const result = buildSync({
  entryPoints: [path.join(root, "src/lib/audit/in-browser-bundle-entry.ts")],
  bundle: true,
  minify: true,
  sourcemap: false,
  format: "iife",
  platform: "browser",
  target: "chrome95",
  alias: { "@": path.join(root, "src") },
  write: false,
  logLevel: "warning",
});

const js = Buffer.from(result.outputFiles[0].contents);
const banner = `/* ChromaBrew in-browser audit — runs axe-core + contrast + structure checks in YOUR tab. Nothing is uploaded. */\n`;

const targets = [
  "public/in-browser/in-browser-audit.js",
  "chrome-extension/content-audit.js",
];
for (const target of targets) {
  const full = path.join(root, target);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, Buffer.concat([Buffer.from(banner), js]));
  console.log(target, (fs.statSync(full).size / 1024).toFixed(1) + " KiB");
}
