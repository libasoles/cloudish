import type { ComponentProps } from "react";

export function AlignCenterHorizontallyIcon(props: ComponentProps<"svg">) {
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
      <line x1="0" y1="8" x2="16" y2="8" />
      <rect x="1" y="3" width="5" height="10" rx="1" fill="hsl(var(--card))" />
      <rect x="1" y="3" width="5" height="10" rx="1" />
      <rect x="10" y="3" width="5" height="10" rx="1" fill="hsl(var(--card))" />
      <rect x="10" y="3" width="5" height="10" rx="1" />
    </svg>
  );
}