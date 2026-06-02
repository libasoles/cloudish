import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type HoverOnlyTooltipProps = {
  children: ReactNode;
  content: ReactNode;
  side?: ComponentPropsWithoutRef<typeof TooltipContent>["side"];
  align?: ComponentPropsWithoutRef<typeof TooltipContent>["align"];
  contentClassName?: string;
  triggerClassName?: string;
  disabled?: boolean;
};

export function HoverOnlyTooltip({
  children,
  content,
  side,
  align,
  contentClassName,
  triggerClassName,
  disabled,
}: HoverOnlyTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={!disabled && open}>
      <TooltipTrigger asChild>
        <span
          className={cn("inline-flex", triggerClassName)}
          onPointerEnter={() => setOpen(true)}
          onPointerLeave={() => setOpen(false)}
          onPointerDown={() => setOpen(false)}
          onClick={() => setOpen(false)}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} align={align} className={contentClassName}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
