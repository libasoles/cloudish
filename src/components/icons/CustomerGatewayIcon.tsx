import type { ComponentProps } from "react";

export function CustomerGatewayIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <rect x="9" y="4" width="2" height="12" />
      <rect x="4" y="9" width="12" height="2" />
      <polygon points="10,1 7,5 13,5" />
      <polygon points="10,19 7,15 13,15" />
      <polygon points="1,10 5,7 5,13" />
      <polygon points="19,10 15,7 15,13" />
    </svg>
  );
}
