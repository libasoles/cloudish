import {
  NodeResizer,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import { resizeContainerNode } from "@/lib/graph-utils";
import type {
  NetworkContainerNodeData,
  NetworkContainerType,
} from "@/types/flow";

export type NetworkContainerNodeType = Node<
  NetworkContainerNodeData,
  "networkContainer"
>;

const MIN_CONTAINER_WIDTH = 220;
const MIN_CONTAINER_HEIGHT = 140;

function DropPreviewLayout({
  childType,
  count,
}: {
  childType: NetworkContainerType;
  count: number;
}) {
  const isColumnLayout = childType === "vpc" || childType === "az";
  const previewCount = Math.max(1, count);

  return (
    <div
      className="pointer-events-none absolute inset-x-3 bottom-3 top-9 z-0"
      style={{
        display: "grid",
        gap: childType === "vpc" ? 18 : 12,
        gridTemplateColumns: isColumnLayout
          ? `repeat(${previewCount}, minmax(0, 1fr))`
          : undefined,
        gridTemplateRows: !isColumnLayout
          ? `repeat(${previewCount}, minmax(0, 1fr))`
          : undefined,
      }}
    >
      {Array.from({ length: previewCount }, (_, index) => (
        <div
          key={index}
          className={cn(
            "rounded-md border border-emerald-300/55 bg-emerald-300/10",
            index === previewCount - 1 &&
              "border-dashed bg-emerald-300/20 shadow-[0_0_18px_rgb(52_211_153_/_0.18)]",
          )}
        />
      ))}
    </div>
  );
}

export default function NetworkContainerNode({
  id,
  data,
  selected,
}: NodeProps<NetworkContainerNodeType>) {
  const t = UI_TEXT[getBrowserLocale()];
  const { nodes, setNodes, dropTargetNodeId, dropPreview, toggleAzSync } =
    useFlowStore();
  const isVpc = data.containerType === "vpc";
  const isRegion = data.containerType === "region";
  const isAz = data.containerType === "az";
  const isPrivateSubnet = data.subnetType === "Private";
  const labelIndex = Number(String(data.label).match(/\d+$/)?.[0] ?? 1);
  const displayLabel =
    data.containerType === "subnet"
      ? t.subnetLabel(isPrivateSubnet ? t.private : t.public, labelIndex)
      : data.label;
  const isDropTarget = dropTargetNodeId === id;
  const previewChildType =
    dropPreview?.parentId === id ? dropPreview.childType : null;
  const previewChildCount = previewChildType
    ? nodes.filter(
        (node) =>
          node.parentId === id &&
          (node.data as { containerType?: NetworkContainerType }).containerType ===
            previewChildType,
      ).length + 1
    : 0;

  const handleResize = (
    _: unknown,
    params: { width: number; height: number },
  ) => {
    if (isRegion || isVpc) {
      setNodes((prev) => resizeContainerNode(id, params.width, params.height, prev));
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
      {previewChildType && (
        <DropPreviewLayout
          childType={previewChildType}
          count={previewChildCount}
        />
      )}
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
          "absolute left-3 top-0 -translate-y-1/2 flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold leading-none shadow-sm",
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
        {displayLabel}
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
              title={t.syncAzs}
              aria-label={t.syncAzs}
            />
          </span>
        )}
      </div>
    </div>
  );
}
