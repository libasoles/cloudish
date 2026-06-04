import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import { updateSyncedNodeGroup } from "@/lib/az-sync";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";

export type InternetNodeData = {
  label: string;
  fields?: Record<string, string | boolean | number>;
  pulseKey?: string;
};
export type InternetNodeType = Node<InternetNodeData, "internet">;

export default function InternetNode({ id, data, selected }: NodeProps<InternetNodeType>) {
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
            ...(node.data as InternetNodeData).fields,
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
        selected
          ? "border-blue-500 shadow-md ring-2 ring-primary ring-offset-4 ring-offset-background"
          : "border-gray-200",
      )}
    >
      <Handle type="target" position={Position.Left} />
      <Cloud className="size-10 text-gray-500" />
      <EditableNodeLabel
        value={label}
        editLabel={t.editNodeName}
        onCommit={renameNode}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
