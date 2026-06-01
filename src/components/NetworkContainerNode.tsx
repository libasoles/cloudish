import {
  NodeResizeControl,
  ResizeControlVariant,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { NetworkContainerNodeData } from "@/types/flow";

export type NetworkContainerNodeType = Node<
  NetworkContainerNodeData,
  "networkContainer"
>;

const MIN_CONTAINER_WIDTH = 220;
const MIN_CONTAINER_HEIGHT = 140;

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
        data.pulseKey && "node-click-pulse",
      )}
    >
      <NodeResizeControl
        position="bottom-right"
        variant={ResizeControlVariant.Handle}
        minWidth={MIN_CONTAINER_WIDTH}
        minHeight={MIN_CONTAINER_HEIGHT}
        className="bottom-0! left-auto! right-0! top-auto! translate-x-0! translate-y-0! h-7! w-7! border-0! bg-transparent!"
      >
        <div
          aria-hidden="true"
          className={cn(
            "absolute bottom-1 right-1 h-4 w-4 overflow-hidden rounded-[2px] bg-[repeating-linear-gradient(135deg,transparent_0_4px,currentColor_4px_6px,transparent_6px_8px)]",
            isVpc
              ? "text-amber-300/90"
              : isPrivateSubnet
                ? "text-blue-300/90"
                : "text-emerald-300/90",
          )}
        />
      </NodeResizeControl>
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
