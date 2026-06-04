import { Handle, Position, type Node } from "@xyflow/react";

export type SelectionGroupNodeData = Record<string, never>;
export type SelectionGroupNodeType = Node<SelectionGroupNodeData, "selectionGroup">;

export default function SelectionGroupNode() {
  return (
    <div style={{ width: "100%", height: "100%" }} className="pointer-events-none">
      <Handle type="target" position={Position.Left} style={{ pointerEvents: "all" }} />
      <Handle type="source" position={Position.Right} style={{ pointerEvents: "all" }} />
    </div>
  );
}
