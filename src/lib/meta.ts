/**
 * Meta-description helpers for programmatic pages.
 *
 * Hand-written pages can count their description at authoring time. Pages
 * composed from data — `/palettes/[theme]`, `/palettes/[theme]/[palette]`,
 * `/colors/[slug]` — only know the final length at render time, and the audit
 * found those templates serving descriptions up to 257 characters, which
 * search results cut mid-sentence. Clamping at a word boundary keeps every
 * served page inside the limit no matter how the underlying copy changes.
 */
export function clampDescription(text: string, max = 160): string {
  if (text.length <= max) return text;
  // One character of budget goes to the ellipsis.
  const cut = text.slice(0, max - 1);
  const boundary = cut.lastIndexOf(" ");
  const head = boundary > 0 ? cut.slice(0, boundary) : cut;
  return `${head.trimEnd()}…`;
}
