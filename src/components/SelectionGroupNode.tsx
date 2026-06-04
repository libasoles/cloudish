import { Handle, Position, type Node } from "@xyflow/react";

export type SelectionGroupNodeData = Record<string, never>;
export type SelectionGroupNodeType = Node<SelectionGroupNodeData, "selectionGroup">;

export default function SelectionGroupNode() {
  return (
    <div className="selection-group-node">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
