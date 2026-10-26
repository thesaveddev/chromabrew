/**
 * Regression between two scans of the same site.
 *
 * Pure by design: the database rows are loaded in `queries.ts` and narrowed
 * to these inputs, so the whole comparison — what is new, what got fixed,
 * what is still there — is unit-testable without a database.
 *
 * Identity is `ruleId` on `pageUrl`, not the finding id: finding ids are
 * per-scan, while a rule firing on the same page across two scans is the same
 * problem seen twice. Multiple elements on one page collapse to one entry
 * (first wins) because the timeline answers "which problems", not "how many
 * elements" — the report itself keeps the full list.
 */

export interface RegressionInput {
  ruleId: string;
  severity: string;
  title: string;
  /** Null when the finding is not attached to a page (scan-level). */
  pageUrl: string | null;
}

export interface RegressionEntry {
  ruleId: string;
  severity: string;
  title: string;
  pageUrl: string | null;
}

export interface RegressionDiff {
  addedTotal: number;
  fixedTotal: number;
  persistingTotal: number;
  /** Capped for display; the totals above are uncapped. */
  added: RegressionEntry[];
  /** Capped for display; the totals above are uncapped. */
  fixed: RegressionEntry[];
}

/** Display cap per list: the timeline is a summary, the report is the record. */
export const REGRESSION_LIST_LIMIT = 30;

function keyOf(finding: RegressionInput): string {
  return `${finding.ruleId}::${finding.pageUrl ?? ""}`;
}

function toEntry(finding: RegressionInput): RegressionEntry {
  return {
    ruleId: finding.ruleId,
    severity: finding.severity,
    title: finding.title,
    pageUrl: finding.pageUrl,
  };
}

/**
 * Compare the previous scan's findings against the current scan's.
 *
 * - added: firing now, silent before — needs attention.
 * - fixed: firing before, silent now — the win column.
 * - persisting: firing in both — counted, not listed.
 */
export function diffScanFindings(
  previous: RegressionInput[],
  current: RegressionInput[],
  limit: number = REGRESSION_LIST_LIMIT,
): RegressionDiff {
  const previousByKey = new Map<string, RegressionInput>();
  for (const finding of previous) {
    if (!previousByKey.has(keyOf(finding))) previousByKey.set(keyOf(finding), finding);
  }
  const currentByKey = new Map<string, RegressionInput>();
  for (const finding of current) {
    if (!currentByKey.has(keyOf(finding))) currentByKey.set(keyOf(finding), finding);
  }

  const added: RegressionEntry[] = [];
  const fixed: RegressionEntry[] = [];
  let persistingTotal = 0;

  for (const [key, finding] of currentByKey) {
    if (previousByKey.has(key)) {
      persistingTotal += 1;
    } else if (added.length < limit) {
      added.push(toEntry(finding));
    }
  }
  const addedTotal = currentByKey.size - persistingTotal;

  for (const [key, finding] of previousByKey) {
    if (!currentByKey.has(key)) {
      if (fixed.length < limit) fixed.push(toEntry(finding));
    }
  }
  const fixedTotal = previousByKey.size - persistingTotal;

  return { addedTotal, fixedTotal, persistingTotal, added, fixed };
}
