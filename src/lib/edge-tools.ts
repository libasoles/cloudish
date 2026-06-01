import { MarkerType } from "@xyflow/react";
import type { AppEdge } from "@/types/flow";

export type EdgeArrowDirection = "none" | "source" | "target" | "both";

const EDGE_ARROW_MARKER = { type: MarkerType.ArrowClosed };

export function getEdgeArrowDirection(edge: AppEdge): EdgeArrowDirection {
  const hasSourceArrow = Boolean(edge.markerStart);
  const hasTargetArrow = Boolean(edge.markerEnd);

  if (hasSourceArrow && hasTargetArrow) {
    return "both";
  }

  if (hasSourceArrow) {
    return "source";
  }

  if (hasTargetArrow) {
    return "target";
  }

  return "none";
}

export function setEdgeArrowDirection(
  edge: AppEdge,
  direction: EdgeArrowDirection,
): AppEdge {
  return {
    ...edge,
    markerStart:
      direction === "source" || direction === "both"
        ? EDGE_ARROW_MARKER
        : undefined,
    markerEnd:
      direction === "target" || direction === "both"
        ? EDGE_ARROW_MARKER
        : undefined,
  };
}
