type Props = {
  className?: string;
};

export function SimpleContainerIcon({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Main rectangle */}
      <rect x="3" y="6" width="18" height="14" rx="2" />
      {/* Badge in top-left corner */}
      <rect x="5" y="4" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}
