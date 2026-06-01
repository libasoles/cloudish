import type { Node, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { NetworkContainerNodeData } from "@/types/flow";

export type NetworkContainerNodeType = Node<
  NetworkContainerNodeData,
  "networkContainer"
>;

export default function NetworkContainerNode({
  data,
  selected,
}: NodeProps<NetworkContainerNodeType>) {
  const isVpc = data.containerType === "vpc";
  const isPrivateSubnet = data.subnetType === "Private";

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-lg border bg-card/20",
        isVpc
          ? "border-amber-400/55 bg-amber-400/10"
          : isPrivateSubnet
            ? "border-blue-500/45 bg-blue-500/10"
            : "border-emerald-500/45 bg-emerald-500/10",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <div
        className={cn(
          "absolute left-3 top-0 -translate-y-1/2 rounded border px-2 py-0.5 text-[11px] font-semibold leading-none shadow-sm",
          isVpc
            ? "border-amber-400/60 bg-background text-amber-200"
            : isPrivateSubnet
              ? "border-blue-500/50 bg-background text-blue-200"
              : "border-emerald-500/50 bg-background text-emerald-200",
        )}
      >
        {data.label}
      </div>
    </div>
  );
}
