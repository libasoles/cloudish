export type ExportFormat = "terraform" | "cloudformation";

export type ExportResult = {
  content: string;
  filename: string;
  mimeType: string;
};
