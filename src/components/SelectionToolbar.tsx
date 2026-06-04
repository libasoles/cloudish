import { useStore, useReactFlow } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import { getAbsolutePosition, getNodeSize } from "@/lib/graph-utils";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import { Button } from "@/components/ui/button";
import { AlignCenterHorizontallyIcon } from "@/components/icons/AlignCenterHorizontallyIcon";
import { AlignCenterVerticallyIcon } from "@/components/icons/AlignCenterVerticallyIcon";

export function SelectionToolbar() {
  const nodes = useFlowStore((s) => s.nodes);
  const commitGraphChange = useFlowStore((s) => s.commitGraphChange);
  const selectionBoxActive = useFlowStore((s) => s.selectionBoxActive);
  const transform = useStore((s) => s.transform);
  const { getNodesBounds } = useReactFlow();

  const selectedNodes = nodes.filter(
    (n) => n.selected && n.type !== "networkContainer",
  );

  if (!selectionBoxActive || selectedNodes.length < 2) return null;

  const bounds = getNodesBounds(selectedNodes);
  const [vpX, vpY, zoom] = transform;

  const screenCenterX = (bounds.x + bounds.width / 2) * zoom + vpX;
  const screenTopY = bounds.y * zoom + vpY;

  function alignCenterH() {
    const targetX = bounds.x + bounds.width / 2;
    commitGraphChange(({ nodes: current, edges }) => {
      const byId = new Map(current.map((n) => [n.id, n]));
      return {
        edges,
        nodes: current.map((node) => {
          if (!node.selected || node.type === "networkContainer") return node;
          const { width } = getNodeSize(node);
          const newAbsX = targetX - width / 2;
          const parentAbs = node.parentId
            ? getAbsolutePosition(byId.get(node.parentId)!, byId)
            : { x: 0, y: 0 };
          return {
            ...node,
            position: { x: newAbsX - parentAbs.x, y: node.position.y },
          };
        }),
      };
    });
  }

  function alignMiddleV() {
    const targetY = bounds.y + bounds.height / 2;
    commitGraphChange(({ nodes: current, edges }) => {
      const byId = new Map(current.map((n) => [n.id, n]));
      return {
        edges,
        nodes: current.map((node) => {
          if (!node.selected || node.type === "networkContainer") return node;
          const { height } = getNodeSize(node);
          const newAbsY = targetY - height / 2;
          const parentAbs = node.parentId
            ? getAbsolutePosition(byId.get(node.parentId)!, byId)
            : { x: 0, y: 0 };
          return {
            ...node,
            position: { x: node.position.x, y: newAbsY - parentAbs.y },
          };
        }),
      };
    });
  }

  return (
    <div
      className="absolute z-10 flex items-center gap-0.5 rounded-lg border border-border bg-card px-1.5 py-1 shadow-lg"
      style={{
        left: screenCenterX,
        top: screenTopY - 90,
        transform: "translateX(-50%)",
        pointerEvents: "all",
      }}
    >
      <HoverOnlyTooltip content="Center horizontally" side="top">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={alignMiddleV}
        >
          <AlignCenterHorizontallyIcon />
        </Button>
      </HoverOnlyTooltip>
      <div className="h-4 w-px bg-border" />
      <HoverOnlyTooltip content="Center vertically" side="top">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={alignCenterH}
        >
          <AlignCenterVerticallyIcon />
        </Button>
      </HoverOnlyTooltip>
    </div>
  );
}
