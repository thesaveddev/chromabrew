import type { DesignSystem } from "../types";

export interface ExportResult {
  /** Ready-to-use code/text output. */
  code: string;
  language: "css" | "json" | "javascript" | "typescript" | "xml" | "kotlin" | "swift" | "dart";
  suggestedFilename: string;
  /** When true, `code` holds base64 bytes (binary output such as a zip). */
  binary?: boolean;
  /** MIME type for download when `binary` is true (defaults to text/plain). */
  mimeType?: string;
}

export interface ExportAdapter {
  id: string;
  name: string;
  description: string;
  generate(system: DesignSystem): ExportResult;
}
