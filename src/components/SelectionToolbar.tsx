import { useStore, useReactFlow } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import { getAbsolutePosition, getNodeSize, NODE_ICON_CENTER_Y } from "@/lib/graph-utils";
import { SELECTION_BOX_PADDING } from "@/lib/selection-constants";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import { Button } from "@/components/ui/button";
import { AlignCenterHorizontallyIcon } from "@/components/icons/AlignCenterHorizontallyIcon";
import { AlignCenterVerticallyIcon } from "@/components/icons/AlignCenterVerticallyIcon";

export function SelectionToolbar({ hidden = false }: { hidden?: boolean }) {
  const nodes = useFlowStore((s) => s.nodes);
  const commitGraphChange = useFlowStore((s) => s.commitGraphChange);
  const transform = useStore((s) => s.transform);
  const { getNodesBounds } = useReactFlow();

  const selectedNodes = nodes.filter(
    (n) => n.selected && n.type !== "networkContainer",
  );

  if (hidden || selectedNodes.length < 2) return null;

  const bounds = getNodesBounds(selectedNodes);
  const [vpX, vpY, zoom] = transform;

  const screenCenterX = (bounds.x + bounds.width / 2) * zoom + vpX;
  const screenBoxTopY = (bounds.y - SELECTION_BOX_PADDING) * zoom + vpY;

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
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const iconCenterYs = selectedNodes.map((n) => getAbsolutePosition(n, byId).y + NODE_ICON_CENTER_Y);
    const targetIconCenterY = (Math.min(...iconCenterYs) + Math.max(...iconCenterYs)) / 2;

    commitGraphChange(({ nodes: current, edges }) => {
      const currentById = new Map(current.map((n) => [n.id, n]));
      return {
        edges,
        nodes: current.map((node) => {
          if (!node.selected || node.type === "networkContainer") return node;
          const parentAbs = node.parentId
            ? getAbsolutePosition(currentById.get(node.parentId)!, currentById)
            : { x: 0, y: 0 };
          return {
            ...node,
            position: { x: node.position.x, y: targetIconCenterY - NODE_ICON_CENTER_Y - parentAbs.y },
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
        top: screenBoxTopY - 76,
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
          data-testid="align-horizontal"
          title="Align center horizontally"
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
          data-testid="align-vertical"
          title="Align center vertically"
        >
          <AlignCenterVerticallyIcon />
        </Button>
      </HoverOnlyTooltip>
    </div>
  );
}
