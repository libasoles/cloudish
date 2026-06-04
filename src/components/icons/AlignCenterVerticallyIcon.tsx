import type { ComponentProps } from "react";

export function AlignCenterVerticallyIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="8" y1="0" x2="8" y2="16" />
      <rect x="3" y="1" width="10" height="5" rx="1" fill="hsl(var(--card))" />
      <rect x="3" y="1" width="10" height="5" rx="1" />
      <rect x="3" y="10" width="10" height="5" rx="1" fill="hsl(var(--card))" />
      <rect x="3" y="10" width="10" height="5" rx="1" />
    </svg>
  );
}