import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserNodeData = { label: string };
export type UserNodeType = Node<UserNodeData, "user">;

export default function UserNode({ data, selected }: NodeProps<UserNodeType>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 bg-white rounded-xl border-2 shadow-sm min-w-20",
        selected ? "border-blue-500 shadow-md" : "border-gray-200",
      )}
    >
      <Handle type="target" position={Position.Left} />
      <User className="size-10 text-gray-500" />
      <span className="text-xs font-medium text-gray-700 text-center leading-tight max-w-20 truncate">
        {data.label}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
