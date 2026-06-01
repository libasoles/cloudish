import {
  NodeResizer,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/store/flowStore";
import {
  redistributeAzNodes,
  redistributeVpcNodes,
  redistributeSubnetNodes,
  isAzNode,
} from "@/lib/graph-utils";
import type { NetworkContainerNodeData } from "@/types/flow";

export type NetworkContainerNodeType = Node<
  NetworkContainerNodeData,
  "networkContainer"
>;

const MIN_CONTAINER_WIDTH = 220;
const MIN_CONTAINER_HEIGHT = 140;

export default function NetworkContainerNode({
  id,
  data,
  selected,
}: NodeProps<NetworkContainerNodeType>) {
  const { setNodes, dropTargetNodeId, toggleAzSync } = useFlowStore();
  const isVpc = data.containerType === "vpc";
  const isRegion = data.containerType === "region";
  const isAz = data.containerType === "az";
  const isPrivateSubnet = data.subnetType === "Private";
  const isDropTarget = dropTargetNodeId === id;

  const handleResize = (
    _: unknown,
    params: { width: number; height: number },
  ) => {
    if (isRegion) {
      setNodes((prev) => redistributeVpcNodes(id, params.width, params.height, prev));
    } else if (isVpc) {
      setNodes((prev) => {
        let result = redistributeAzNodes(id, params.width, params.height, prev);
        const azNodes = result.filter((n) => n.parentId === id && isAzNode(n));
        for (const az of azNodes) {
          const azW = (az.style?.width as number) ?? 300;
          const azH = (az.style?.height as number) ?? 360;
          result = redistributeSubnetNodes(az.id, azW, azH, result);
        }
        return result;
      });
    }
  };

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-lg border bg-card/20",
        isVpc
          ? "border-amber-400/55 bg-amber-400/10"
          : isRegion
            ? "border-purple-500/45 bg-purple-500/10"
            : isAz
              ? "border-indigo-400/55 bg-indigo-400/5 border-dashed"
              : isPrivateSubnet
                ? "border-blue-500/45 bg-blue-500/10"
                : "border-emerald-500/45 bg-emerald-500/10",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDropTarget && "ring-2 ring-emerald-400 ring-offset-2 ring-offset-background",
        data.pulseKey && "node-click-pulse",
      )}
    >
      {!isAz && (
        <NodeResizer
          minWidth={MIN_CONTAINER_WIDTH}
          minHeight={MIN_CONTAINER_HEIGHT}
          onResize={handleResize}
          isVisible={selected}
          lineClassName={cn(
            "!border-2",
            isVpc
              ? "!border-amber-400/70"
              : isRegion
                ? "!border-purple-400/70"
                : isPrivateSubnet
                  ? "!border-blue-400/70"
                  : "!border-emerald-400/70",
          )}
          handleClassName={cn(
            "!h-3 !w-3 !rounded-full !border-2 !bg-background",
            isVpc
              ? "!border-amber-400"
              : isRegion
                ? "!border-purple-400"
                : isPrivateSubnet
                  ? "!border-blue-400"
                  : "!border-emerald-400",
          )}
        />
      )}
      <div
        className={cn(
          "absolute left-3 top-0 -translate-y-1/2 flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold leading-none shadow-sm",
          isVpc
            ? "border-amber-400/60 bg-background text-amber-200"
            : isRegion
              ? "border-purple-500/50 bg-background text-purple-200"
              : isAz
                ? "border-indigo-400/60 bg-background text-indigo-200"
                : isPrivateSubnet
                  ? "border-blue-500/50 bg-background text-blue-200"
                  : "border-emerald-500/50 bg-background text-emerald-200",
        )}
      >
        {data.label}
        {isAz && (
          <span
            className="nodrag nopan flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={data.synced ?? false}
              onChange={(e) => toggleAzSync(id, e.target.checked)}
              className="h-3 w-3 cursor-pointer accent-indigo-400"
              title="Sync AZs"
            />
          </span>
        )}
      </div>
    </div>
  );
}
