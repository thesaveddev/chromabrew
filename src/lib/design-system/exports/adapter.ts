import type { DesignSystem } from "../types";

export interface ExportResult {
  /** Ready-to-use code/text output. */
  code: string;
  language: "css" | "json" | "javascript" | "typescript";
  suggestedFilename: string;
}

export interface ExportAdapter {
  id: string;
  name: string;
  description: string;
  generate(system: DesignSystem): ExportResult;
}
