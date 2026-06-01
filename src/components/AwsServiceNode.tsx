import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import type { AwsCategory } from "@/data/aws-services";

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
  data,
  selected,
}: NodeProps<AwsServiceNodeType>) {
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
      <span className="text-xs font-medium text-gray-700 text-center leading-tight max-w-20 truncate">
        {data.name}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
