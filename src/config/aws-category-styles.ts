import type { AwsCategory } from "@/data/aws-services";

export const AWS_CATEGORY_STYLES: Record<AwsCategory, { iconFallbackBg: string }> = {
  Compute: { iconFallbackBg: "bg-aws-compute" },
  Storage: { iconFallbackBg: "bg-aws-storage" },
  Database: { iconFallbackBg: "bg-aws-database" },
  Networking: { iconFallbackBg: "bg-aws-networking" },
  Security: { iconFallbackBg: "bg-aws-security" },
  Analytics: { iconFallbackBg: "bg-aws-analytics" },
  "ML/AI": { iconFallbackBg: "bg-aws-ml-ai" },
  "Developer Tools": { iconFallbackBg: "bg-aws-developer-tools" },
  Management: { iconFallbackBg: "bg-aws-management" },
  Messaging: { iconFallbackBg: "bg-aws-messaging" },
};
