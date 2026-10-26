import type { DesignSystem } from "../types";
import type { ExportContext } from "./context";

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
  /**
   * `ctx` carries white-label packaging (project name, client, version).
   * Adapters that ignore it emit exactly what they always have, so existing
   * call sites pass nothing and existing outputs never change.
   */
  generate(system: DesignSystem, ctx?: ExportContext): ExportResult;
}
