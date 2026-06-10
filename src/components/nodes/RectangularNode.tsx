import { Handle, Position } from "@xyflow/react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { HandleDecoration } from "@/components/nodes/CircularNode";

export type RectangularHandleId = "left" | "right" | "top" | "bottom";

type HandleConfig = {
  id: RectangularHandleId;
  position: Position;
  className?: string;
  style?: CSSProperties;
};

const HANDLE_CONFIGS: HandleConfig[] = [
  { id: "left", position: Position.Left },
  { id: "right", position: Position.Right },
  { id: "top", position: Position.Top, className: "handle-vertical" },
  { id: "bottom", position: Position.Bottom, className: "handle-vertical" },
];

interface RectangularNodeProps {
  selected?: boolean;
  pulseKey?: string;
  /** Extra classes applied to the outer wrapper (layout, sizing). */
  className?: string;
  children: ReactNode;
  /** Per-handle visual overrides: className, style, and/or content. */
  handleDecorations?: Partial<Record<RectangularHandleId, HandleDecoration>>;
}

export default function RectangularNode({
  selected,
  pulseKey,
  className,
  children,
  handleDecorations,
}: RectangularNodeProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={cn(
        "bg-white rounded-xl border-2 shadow-sm",
        pulseKey && "node-click-pulse",
        selected
          ? "border-blue-500 shadow-md ring-2 ring-primary ring-offset-4 ring-offset-background"
          : "border-gray-200",
        isHovering && "node-hovering",
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {HANDLE_CONFIGS.map(({ id, position, className: handleCls, style }) => {
        const decoration = handleDecorations?.[id];
        return (
          <Handle
            key={id}
            type="source"
            position={position}
            id={id}
            className={cn(handleCls, decoration?.className)}
            style={{ ...style, ...decoration?.style }}
          >
            {decoration?.content}
          </Handle>
        );
      })}
      {children}
    </div>
  );
}
