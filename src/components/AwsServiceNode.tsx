import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import type { AwsCategory } from "@/data/aws-services";
import { updateSyncedNodeGroup } from "@/lib/az-sync";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";

export type AwsServiceNodeData = {
  name: string;
  slug: string;
  category: AwsCategory;
  serviceId?: string;
  description?: string;
  fields?: Record<string, string | boolean | number>;
  pulseKey?: string;
};

export type AwsServiceNodeType = Node<AwsServiceNodeData, "awsService">;

export default function AwsServiceNode({
  id,
  data,
  selected,
}: NodeProps<AwsServiceNodeType>) {
  const commitGraphChange = useFlowStore((state) => state.commitGraphChange);
  const t = UI_TEXT[getBrowserLocale()];

  function renameNode(name: string) {
    commitGraphChange(({ nodes, edges }) => ({
      nodes: updateSyncedNodeGroup(id, nodes, (node) => ({
        ...node,
        data: {
          ...node.data,
          name,
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
      <AwsServiceIcon
        slug={data.slug}
        category={data.category}
        name={data.name}
        size={40}
      />
      <EditableNodeLabel
        value={data.name}
        editLabel={t.editNodeName}
        onCommit={renameNode}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
