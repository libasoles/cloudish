import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import { updateSyncedNodeGroup } from "@/lib/az-sync";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";

export type UserNodeData = {
  label: string;
  fields?: Record<string, string | boolean | number>;
  pulseKey?: string;
};
export type UserNodeType = Node<UserNodeData, "user">;

export default function UserNode({ id, data, selected }: NodeProps<UserNodeType>) {
  const commitGraphChange = useFlowStore((state) => state.commitGraphChange);
  const t = UI_TEXT[getBrowserLocale()];
  const label = String(data.fields?.label ?? data.label);

  function renameNode(label: string) {
    commitGraphChange(({ nodes, edges }) => ({
      nodes: updateSyncedNodeGroup(id, nodes, (node) => ({
        ...node,
        data: {
          ...node.data,
          label,
          fields: {
            ...(node.data as UserNodeData).fields,
            label,
          },
        },
      })),
      edges,
    }));
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 bg-white rounded-xl border-2 shadow-sm min-w-20",
        data.pulseKey && "node-click-pulse",
        selected ? "border-blue-500 shadow-md" : "border-gray-200",
      )}
    >
      <Handle type="target" position={Position.Left} />
      <User className="size-10 text-gray-500" />
      <EditableNodeLabel
        value={label}
        editLabel={t.editNodeName}
        onCommit={renameNode}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
