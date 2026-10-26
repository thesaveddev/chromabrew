/**
 * The screenshot with its findings drawn on it.
 *
 * Markers come from boxes the renderer measured while the page was alive
 * (`elementRects` on the page record), matched to findings by selector. Only
 * boxes intersecting the captured viewport are drawn — the screenshot is the
 * top of the page, so below-the-fold elements are listed, not marked. When
 * nothing matched, this renders the plain screenshot exactly as before.
 */

import Image from "next/image";

import type { FindingDto, ScannedPageDto } from "@/lib/audit/types";

const MARKER_HEX: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#0284c7",
  informational: "#71717a",
};

/** Markers get crowded past this many; the rest stay in the findings list. */
const MAX_MARKERS = 20;

interface MarkedFinding {
  finding: FindingDto;
  x: number;
  y: number;
  width: number;
  height: number;
}

function markersForPage(
  page: ScannedPageDto,
  findings: FindingDto[],
  viewportWidth: number,
  viewportHeight: number,
): { marked: MarkedFinding[]; unmarked: number } {
  const rects = new Map(page.elementRects.map((rect) => [rect.selector, rect]));
  const marked: MarkedFinding[] = [];
  let unmarked = 0;
  for (const finding of findings) {
    if (!finding.elementSelector) continue;
    const rect = rects.get(finding.elementSelector);
    if (!rect) {
      unmarked += 1;
      continue;
    }
    // The capture is the viewport at the top of the document.
    const intersects =
      rect.x < viewportWidth &&
      rect.x + rect.width > 0 &&
      rect.y < viewportHeight &&
      rect.y + rect.height > 0;
    if (!intersects) {
      unmarked += 1;
      continue;
    }
    if (marked.length >= MAX_MARKERS) {
      unmarked += 1;
      continue;
    }
    marked.push({ finding, x: rect.x, y: rect.y, width: rect.width, height: rect.height });
  }
  return { marked, unmarked };
}

export function AnnotatedScreenshot({
  page,
  findings,
  viewportWidth,
  viewportHeight,
}: {
  page: ScannedPageDto;
  findings: FindingDto[];
  viewportWidth: number;
  viewportHeight: number;
}) {
  const { marked, unmarked } = markersForPage(page, findings, viewportWidth, viewportHeight);

  return (
    <figure className="audit-report-screenshot overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative">
        <Image
          src={page.screenshotUrl as string}
          alt={`Screenshot of ${page.url} as the scanner rendered it`}
          width={viewportWidth}
          height={viewportHeight}
          unoptimized
          className="block h-auto w-full"
        />
        {marked.map(({ finding, x, y, width, height }, index) => (
          <span
            key={`${finding.id}-${index}`}
            title={`#${index + 1}: ${finding.title}`}
            aria-label={`Finding ${index + 1}: ${finding.title}`}
            className="absolute rounded-[3px] border-2"
            style={{
              left: `${(x / viewportWidth) * 100}%`,
              top: `${(y / viewportHeight) * 100}%`,
              width: `${Math.max(width / viewportWidth, 0.006) * 100}%`,
              height: `${Math.max(height / viewportHeight, 0.01) * 100}%`,
              borderColor: MARKER_HEX[finding.severity] ?? "#71717a",
              backgroundColor: `${MARKER_HEX[finding.severity] ?? "#71717a"}22`,
            }}
          >
            <span
              aria-hidden="true"
              className="absolute -left-0.5 -top-5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
              style={{ backgroundColor: MARKER_HEX[finding.severity] ?? "#71717a" }}
            >
              {index + 1}
            </span>
          </span>
        ))}
      </div>
      <figcaption className="border-t border-zinc-200 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        The viewport as the scanner rendered it, at {viewportWidth}×{viewportHeight}.{" "}
        {marked.length > 0
          ? `${marked.length} ${marked.length === 1 ? "finding is" : "findings are"} marked where ${marked.length === 1 ? "it was" : "they were"} measured${unmarked > 0 ? `; ${unmarked} more ${unmarked === 1 ? "is" : "are"} below the fold or off-screen` : ""}.`
          : "Nothing here has been changed — before-and-after previews come later."}
      </figcaption>
    </figure>
  );
}
