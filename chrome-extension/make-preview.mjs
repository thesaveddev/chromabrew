#!/usr/bin/env node
/**
 * Build `sidepanel.preview.html` — a self-contained copy of the panel with
 * the CSS and JS inlined, for browser previewing outside the extension
 * (the preview server serves one file, not siblings). Regenerate after
 * editing sidepanel.html/.css/.js:
 *
 *   node make-preview.mjs
 *
 * The extension itself loads the real, separate files.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const html = readFileSync(join(here, "sidepanel.html"), "utf8");
const css = readFileSync(join(here, "sidepanel.css"), "utf8");
const js = readFileSync(join(here, "sidepanel.js"), "utf8");

for (const [name, body] of [
  ["CSS", css],
  ["JS", js],
]) {
  if (body.includes(`</scr` + `ipt>`)) {
    throw new Error(`Refusing to inline ${name}: contains a closing script tag`);
  }
}

const out = html
  .replace(
    /<link rel="stylesheet" href="sidepanel\.css" \/>/,
    `<style>\n${css}\n</style>`,
  )
  .replace(
    /<script src="sidepanel\.js"><\/script>/,
    `<script>\n${js}\n</script>`,
  );

if (out === html) {
  throw new Error("Nothing was inlined — check the tags in sidepanel.html");
}

const target = join(here, "sidepanel.preview.html");
writeFileSync(target, out);
console.log(`wrote ${target}`);
