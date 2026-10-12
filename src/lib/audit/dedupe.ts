/**
 * Cross-engine deduplication.
 *
 * Stage 1 has native HTML rules; Stage 2 adds axe-core, whose rule ids are
 * prefixed `axe:`. Several pairs describe the same underlying problem on the
 * same page — a missing alt attribute can arrive as native `img-alt` and as
 * `axe:image-alt` — so a report that listed both would double-count one defect
 * and overstate its severity.
 *
 * Each overlapping pair is declared as a topic with a documented survivor.
 * Everything that is not part of a pair is its own topic and always survives.
 *
 * The entry point is generic over anything carrying a rule id and a selector, so
 * it works on FindingDraft without depending on the rest of that shape.
 */

export interface RuleTopic {
  /** Stable identifier used as the duplicate group id. */
  topic: string;
  /** Rule id produced by the native HTML rules in analyzer.ts. */
  native: string;
  /** Rule id produced by the axe-core adapter, prefixed `axe:`. */
  axe: string;
  /**
   * Which engine's version survives when both fire.
   *
   * axe is preferred where it measures the same thing more precisely (per
   * element, with its own background resolution). Native is preferred for
   * contrast, whose finding carries ChromaBrew's measured ratio, required
   * threshold and occurrence count — the exact shape the report and the later
   * fix stage consume — and for the h1 rule, where axe only reports a
   * best-practice violation while ours explains the page outline.
   */
  prefer: "axe" | "native";
}

export const RULE_TOPICS: readonly RuleTopic[] = [
  { topic: "img-alt", native: "img-alt", axe: "axe:image-alt", prefer: "axe" },
  { topic: "html-lang", native: "html-lang", axe: "axe:html-has-lang", prefer: "axe" },
  { topic: "page-title", native: "meta-title", axe: "axe:document-title", prefer: "axe" },
  { topic: "viewport", native: "meta-viewport", axe: "axe:meta-viewport", prefer: "axe" },
  {
    topic: "primary-heading",
    native: "heading-h1",
    axe: "axe:page-has-heading-one",
    prefer: "native",
  },
  {
    topic: "text-contrast",
    native: "contrast-text",
    axe: "axe:color-contrast",
    prefer: "native",
  },
] as const;

/**
 * The grouping key for a rule id. Overlapping rules share a `topic:` key; any
 * other rule is its own group.
 */
export function topicFor(ruleId: string): string {
  const match = RULE_TOPICS.find(
    (candidate) => candidate.native === ruleId || candidate.axe === ruleId,
  );
  return match ? `topic:${match.topic}` : ruleId;
}

export interface DedupeResult<T> {
  /** Findings to present, in their original order. */
  kept: T[];
  /** Findings suppressed as duplicates of a kept one. */
  duplicates: { finding: T; groupId: string; keptRuleId: string }[];
}

function preferredRuleId(topic: RuleTopic): string {
  return topic.prefer === "axe" ? topic.axe : topic.native;
}

/**
 * Split findings into the ones to present and the ones that duplicate another
 * engine's account of the same problem.
 *
 * Generic over the finding shape so it can be exercised without constructing a
 * whole FindingDraft; it only needs a rule id and a selector.
 */
export function dedupeFindings<T extends { ruleId: string; elementSelector: string | null }>(
  findings: T[],
): DedupeResult<T> {
  // Group positions by topic, preserving input order within each group.
  const groups = new Map<string, number[]>();
  findings.forEach((finding, index) => {
    const key = topicFor(finding.ruleId);
    const existing = groups.get(key);
    if (existing) existing.push(index);
    else groups.set(key, [index]);
  });

  const keptIndexes = new Set<number>();
  const duplicates: { index: number; groupId: string; keptRuleId: string }[] = [];

  for (const [groupId, indexes] of groups) {
    if (indexes.length === 1) {
      keptIndexes.add(indexes[0]);
      continue;
    }

    const topic = RULE_TOPICS.find((candidate) => `topic:${candidate.topic}` === groupId);
    let survivor = indexes[0];
    if (topic) {
      const preferred = indexes.find(
        (index) => findings[index].ruleId === preferredRuleId(topic),
      );
      if (preferred !== undefined) survivor = preferred;
    }
    keptIndexes.add(survivor);

    const survivorRuleId = findings[survivor].ruleId;
    for (const index of indexes) {
      if (index === survivor) continue;
      // Repeat occurrences of the *same* rule are not cross-engine duplicates,
      // so they are kept rather than silently collapsed.
      if (findings[index].ruleId === survivorRuleId) {
        keptIndexes.add(index);
        continue;
      }
      duplicates.push({ index, groupId, keptRuleId: survivorRuleId });
    }
  }

  return {
    kept: findings.filter((_, index) => keptIndexes.has(index)),
    duplicates: duplicates
      .sort((a, b) => a.index - b.index)
      .map(({ index, groupId, keptRuleId }) => ({
        finding: findings[index],
        groupId,
        keptRuleId,
      })),
  };
}
