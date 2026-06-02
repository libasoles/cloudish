import type { AppNode } from "@/types/flow";
import type { ExportFormat, ExportResult } from "./types";
import { generateTerraform } from "./terraform";
import { generateCloudFormation } from "./cloudformation";

export type { ExportFormat, ExportResult };

export function exportFlow(
  format: ExportFormat,
  nodes: AppNode[],
): ExportResult {
  switch (format) {
    case "terraform":
      return generateTerraform(nodes);
    case "cloudformation":
      return generateCloudFormation(nodes);
  }
}

export function downloadExport(result: ExportResult): void {
  const blob = new Blob([result.content], { type: result.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
