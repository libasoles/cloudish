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

  const isCircular =
    data.serviceId === "internet-gateway" ||
    data.serviceId === "vpn-gateway";

  if (isCircular) {
    return (
      <div className="flex flex-col items-center gap-1.5 w-14">
        <Handle type="target" position={Position.Left} style={{ top: 28 }} />
        <div
          className={cn(
            "size-14 rounded-full bg-white border-2 shadow-sm flex items-center justify-center",
            data.pulseKey && "node-click-pulse",
            selected
              ? "border-blue-500 shadow-md ring-2 ring-primary ring-offset-4 ring-offset-background"
              : "border-gray-200",
          )}
        >
          <AwsServiceIcon
            slug={data.slug}
            category={data.category}
            name={data.name}
            size={40}
          />
        </div>
        <EditableNodeLabel
          value={data.name}
          editLabel={t.editNodeName}
          className="text-white"
          onCommit={renameNode}
        />
        <Handle type="source" position={Position.Right} style={{ top: 28 }} />
      </div>
    );
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
