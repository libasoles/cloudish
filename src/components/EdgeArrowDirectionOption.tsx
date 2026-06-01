import { ArrowLeft, ArrowRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import type { EdgeArrowDirection } from "@/lib/edge-tools";

type EdgeArrowDirectionOptionProps = {
  direction: EdgeArrowDirection;
  label: string;
};

function IconSlot({ children }: { children?: ReactNode }) {
  return (
    <span className="grid h-4 w-4 shrink-0 place-items-center">{children}</span>
  );
}

export default function EdgeArrowDirectionOption({
  direction,
  label,
}: EdgeArrowDirectionOptionProps) {
  const showSourceArrow = direction === "source" || direction === "both";
  const showTargetArrow = direction === "target" || direction === "both";
  const showNoArrows = direction === "none";

  return (
    <span className="flex w-full justify-start gap-2 text-left items-center">
      <IconSlot>
        {showSourceArrow ? (
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        ) : showNoArrows ? (
          <Minus className="h-4 w-4" aria-hidden="true" />
        ) : null}
      </IconSlot>
      <span className="whitespace-nowrap">{label}</span>
      <IconSlot>
        {showTargetArrow ? (
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        ) : showNoArrows ? (
          <Minus className="h-4 w-4" aria-hidden="true" />
        ) : null}
      </IconSlot>
    </span>
  );
}
