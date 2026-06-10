import { Handle, Position } from "@xyflow/react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CircularHandleId = "left" | "right" | "top" | "bottom";

export type HandleDecoration = {
  className?: string;
  style?: CSSProperties;
  content?: ReactNode;
};

type HandleConfig = {
  id: CircularHandleId;
  position: Position;
  className?: string;
  style?: CSSProperties;
};

/**
 * Handle geometry anchored to the 56px circle so handles stay on the circle
 * boundary regardless of how wide the node grows to fit its label.
 */
const HANDLE_CONFIGS: HandleConfig[] = [
  {
    id: "left",
    position: Position.Left,
    style: { top: 32, left: "calc(50% - 32px)" },
  },
  {
    id: "right",
    position: Position.Right,
    style: { top: 32, right: "calc(50% - 32px)" },
  },
  {
    id: "top",
    position: Position.Top,
    className: "handle-vertical",
  },
  {
    id: "bottom",
    position: Position.Bottom,
    className: "handle-vertical",
    style: { top: 62, bottom: "auto", transform: "translate(-50%, -50%)" },
  },
];

interface CircularNodeProps {
  selected?: boolean;
  pulseKey?: string;
  /** Rendered below the circle (typically an EditableNodeLabel). */
  label: ReactNode;
  /** The icon rendered inside the circle. */
  children: ReactNode;
  /** Per-handle visual overrides merged on top of the base geometry. */
  handleDecorations?: Partial<Record<CircularHandleId, HandleDecoration>>;
}

export default function CircularNode({
  selected,
  pulseKey,
  label,
  children,
  handleDecorations,
}: CircularNodeProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 min-w-20",
        isHovering && "node-hovering",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {HANDLE_CONFIGS.map(({ id, position, className, style }) => {
        const decoration = handleDecorations?.[id];
        return (
          <Handle
            key={id}
            type="source"
            position={position}
            id={id}
            className={cn(className, decoration?.className)}
            style={{ ...style, ...decoration?.style }}
          >
            {decoration?.content}
          </Handle>
        );
      })}
      <div
        className={cn(
          "size-14 rounded-full bg-white border-2 shadow-sm flex items-center justify-center",
          pulseKey && "node-click-pulse",
          selected
            ? "border-blue-500 shadow-md ring-2 ring-primary ring-offset-4 ring-offset-background"
            : "border-gray-200",
        )}
      >
        {children}
      </div>
      {label}
    </div>
  );
}
