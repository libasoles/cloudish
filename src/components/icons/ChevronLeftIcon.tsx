import type { ComponentProps } from "react";

export function ChevronLeftIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}