import { useId, type ComponentProps } from "react";

export function VpcIcon(props: ComponentProps<"svg">) {
  const maskId = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          <path
            d="M15 23Q19 21 19 17V14L15 13L11 14V17Q11 21 15 23Z"
            fill="black"
            stroke="none"
          />
        </mask>
      </defs>
      <path
        d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
        mask={`url(#${maskId})`}
      />
      <path d="M15 23Q19 21 19 17V14L15 13L11 14V17Q11 21 15 23Z" />
    </svg>
  );
}