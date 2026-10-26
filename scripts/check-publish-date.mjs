/**
 * Prints the slugs of blog posts whose `publishedAt` date equals the given
 * UTC date (default: today), space-separated on one line. Prints nothing and
 * still exits 0 when there is nothing to publish, so the scheduled workflow
 * can gate the Vercel rebuild on real output instead of cron dates.
 *
 * Usage: node scripts/check-publish-date.mjs [YYYY-MM-DD]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = [
  "src/lib/posts.ts",
  "src/lib/posts-tutorials-a.ts",
  "src/lib/posts-tutorials-b.ts",
  "src/lib/posts-tutorials-c.ts",
];

const target = process.argv[2] ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(target)) {
  process.stderr.write(`check-publish-date: expected YYYY-MM-DD, got ${target}\n`);
  process.exit(1);
}

const slugs = [];
for (const file of FILES) {
  const text = readFileSync(path.join(ROOT, file), "utf8");
  for (const m of text.matchAll(/slug:\s*"([^"]+)"[\s\S]*?publishedAt:\s*"([^"]+)"/g)) {
    if (m[2] === target && !slugs.includes(m[1])) slugs.push(m[1]);
  }
}

process.stdout.write(`${slugs.join(" ")}\n`);
