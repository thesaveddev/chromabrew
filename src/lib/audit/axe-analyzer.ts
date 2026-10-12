import axe from "axe-core";

export interface AxeFinding {
  ruleId: string;
  category: "accessibility" | "technical";
  severity: "critical" | "high" | "medium" | "low" | "informational";
  title: string;
  description: string;
  helpUrl?: string;
  elements: Array<{
    selector: string;
    html: string;
  }>;
}

export function mapAxeImpact(
  impact: string | null | undefined
): "critical" | "high" | "medium" | "low" | "informational" {
  switch (impact) {
    case "critical":
      return "critical";
    case "serious":
      return "high";
    case "moderate":
      return "medium";
    case "minor":
      return "low";
    default:
      return "informational";
  }
}

export async function analyzeWithAxe(html: string): Promise<AxeFinding[]> {
  const results = await axe.run(html, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "best-practice"],
    },
    resultTypes: ["violations", "incomplete"],
  });

  const findings: AxeFinding[] = [];

  for (const violation of results.violations) {
    findings.push({
      ruleId: violation.id,
      category: "accessibility",
      severity: mapAxeImpact(violation.impact),
      title: violation.help,
      description: violation.description,
      helpUrl: violation.helpUrl,
      elements: violation.nodes.map((node) => ({
        selector: node.target.join(", "),
        html: node.html,
      })),
    });
  }

  for (const incomplete of results.incomplete) {
    findings.push({
      ruleId: incomplete.id,
      category: "accessibility",
      severity: mapAxeImpact(incomplete.impact),
      title: incomplete.help,
      description: incomplete.description,
      helpUrl: incomplete.helpUrl,
      elements: incomplete.nodes.map((node) => ({
        selector: node.target.join(", "),
        html: node.html,
      })),
    });
  }

  return findings;
}
