#!/usr/bin/env node
/**
 * Screenshot a rendered report for the homepage.
 *
 *   node scripts/shoot-report-capture.mjs
 *
 * Pairs with `scripts/capture-audit-report.mjs`, which produces
 * `.audit-capture-report.json`. To turn that JSON into the homepage image,
 * create this page temporarily, shoot it, then delete it again:
 *
 *   // src/app/tmp-report-preview/page.tsx
 *   import { readFile } from "node:fs/promises";
 *   import { ScanReport } from "@/components/audit/scan-report";
 *   import type { ScanResultsDto } from "@/lib/audit/types";
 *
 *   export const dynamic = "force-dynamic";
 *   export const metadata = { title: "Captured report", robots: { index: false } };
 *
 *   export default async function Page() {
 *     const results = JSON.parse(
 *       await readFile(".audit-capture-report.json", "utf8"),
 *     ) as ScanResultsDto;
 *     return (
 *       <div className="bg-zinc-50 p-6">
 *         <div id="capture" className="mx-auto w-full max-w-6xl">
 *           <ScanReport results={results} />
 *         </div>
 *       </div>
 *     );
 *   }
 *
 * The temporary page exists because the report is Tailwind-styled: rendering it
 * needs a real Next route, not a string of HTML. Nothing about it ships.
 *
 * The frame is clipped from the top of `#capture` to the bottom of the findings
 * card, found by locating its heading rather than guessed at, so the image never
 * cuts a card in half. `SHOT_SCALE=2` doubles the pixel density so the report's
 * own 14px text stays legible at the size the homepage shows it.
 */
import { chromium } from "playwright";

const target = process.env.SHOT_URL ?? "http://localhost:3300/tmp-report-preview";
const output = process.env.SHOT_OUT ?? "public/audit-media/audit-report.png";
const scale = Number(process.env.SHOT_SCALE ?? 2);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1200 },
    deviceScaleFactor: scale,
  });
  await page.goto(target, { waitUntil: "networkidle" });
  await page.waitForSelector("#capture");
  // Images decode after load; wait for the scanned viewport to have real size,
  // otherwise the frame is captured with an empty box where the page was.
  await page
    .waitForFunction(
      () => {
        const image = document.querySelector("#capture img");
        return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
      },
      { timeout: 15_000 },
    )
    .catch(() => {});

  const clip = await page.evaluate(() => {
    const wrapper = document.getElementById("capture");
    if (!wrapper) throw new Error("no #capture wrapper");
    const rect = wrapper.getBoundingClientRect();
    const heading = [...document.querySelectorAll("h2")].find((node) =>
      node.textContent?.trim().startsWith("Findings"),
    );
    const card = heading?.closest("div");
    const bottom = card ? card.getBoundingClientRect().bottom : rect.top + 1200;
    return {
      x: Math.max(0, Math.round(rect.left)),
      y: Math.max(0, Math.round(rect.top)),
      width: Math.round(rect.width),
      height: Math.round(Math.max(200, bottom - rect.top)),
    };
  });

  await page.screenshot({ path: output, clip });
  console.log(JSON.stringify({ out: output, scale, clip }));
} finally {
  await browser.close();
}
