import { useState } from "react";
import { getIconUrl, type AwsCategory } from "@/data/aws-services";
import { AWS_CATEGORY_STYLES } from "@/config/aws-category-styles";

interface AwsServiceIconProps {
  slug: string;
  category: AwsCategory;
  name: string;
  size: 24 | 40;
}

const sizeClasses: Record<AwsServiceIconProps["size"], string> = {
  24: "size-6 text-[8.4px]",
  40: "size-10 text-sm",
};

export function AwsServiceIcon({
  slug,
  category,
  name,
  size,
}: AwsServiceIconProps) {
  const [error, setError] = useState(false);
  const abbrev = name
    .replace(/[^A-Z0-9]/gi, "")
    .slice(0, 3)
    .toUpperCase();
  const iconSizeClass = sizeClasses[size];

  if (error) {
    return (
      <div
        className={`${iconSizeClass} ${AWS_CATEGORY_STYLES[category].iconFallbackBg} flex shrink-0 items-center justify-center rounded-md font-bold text-white`}
      >
        {abbrev}
      </div>
    );
  }

  return (
    <img
      src={getIconUrl(slug)}
      alt={name}
      className={`${iconSizeClass} shrink-0`}
      onError={() => setError(true)}
    />
  );
}
