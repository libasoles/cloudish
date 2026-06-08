import { cn } from "@/lib/utils";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import type { AwsCategory } from "@/data/aws-services";

interface CircularServiceIconProps {
  slug: string;
  category: AwsCategory;
  name: string;
  selected?: boolean;
  pulseKey?: string;
}

export function CircularServiceIcon({
  slug,
  category,
  name,
  selected,
  pulseKey,
}: CircularServiceIconProps) {
  return (
    <div
      className={cn(
        "size-14 rounded-full bg-white border-2 shadow-sm flex items-center justify-center",
        pulseKey && "node-click-pulse",
        selected
          ? "border-blue-500 shadow-md ring-2 ring-primary ring-offset-4 ring-offset-background"
          : "border-gray-200",
      )}
    >
      <AwsServiceIcon slug={slug} category={category} name={name} size={40} />
    </div>
  );
}
