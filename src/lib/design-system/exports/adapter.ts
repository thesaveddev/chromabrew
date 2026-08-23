import type { DesignSystem } from "../types";

export interface ExportResult {
  /** Ready-to-use code/text output. */
  code: string;
  language: "css" | "json" | "javascript" | "typescript" | "xml" | "kotlin" | "swift" | "dart";
  suggestedFilename: string;
}

export interface ExportAdapter {
  id: string;
  name: string;
  description: string;
  generate(system: DesignSystem): ExportResult;
}
