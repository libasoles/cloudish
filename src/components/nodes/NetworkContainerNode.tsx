import {
  NodeResizer,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Link } from "lucide-react";
import EditableNodeLabel from "@/components/EditableNodeLabel";
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

const MIN_CONTAINER_WIDTH = 264;
const MIN_CONTAINER_HEIGHT = 168;

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
  const setNodes = useFlowStore((state) => state.setNodes);
  const commitGraphChange = useFlowStore((state) => state.commitGraphChange);
  const isDropTarget = useFlowStore((state) => state.dropTargetNodeId === id);
  const previewChildType = useFlowStore((state) =>
    state.dropPreview?.parentId === id ? state.dropPreview.childType : null,
  );
  const previewChildCount = useFlowStore((state) => {
    if (state.dropPreview?.parentId !== id) {
      return 0;
    }

    const childType = state.dropPreview.childType;
    return (
      state.nodes.filter(
        (node) =>
          node.parentId === id &&
          (node.data as { containerType?: NetworkContainerType }).containerType ===
            childType,
      ).length + 1
    );
  });
  const isVpc = data.containerType === "vpc";
  const isRegion = data.containerType === "region";
  const isAz = data.containerType === "az";
  const isAsg = data.containerType === "asg";
  const isGeneric = data.containerType === "generic";
  const isPrivateSubnet = data.subnetType === "Private";
  const displayLabel = String(data.label);

  const handleResize = (
    _: unknown,
    params: { width: number; height: number },
  ) => {
    if (isRegion || isVpc) {
      setNodes((prev) => resizeContainerNode(id, params.width, params.height, prev));
    } else if (isAsg || isGeneric) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, style: { ...n.style, width: params.width, height: params.height } }
            : n,
        ),
      );
    }
  };

  const renameNode = (label: string) => {
    commitGraphChange(({ nodes, edges }) => ({
      nodes: nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                label,
              },
            }
          : node,
      ),
      edges,
    }));
  };

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-lg border bg-card/20",
        isVpc
          ? "border-violet-500/55 bg-violet-950/35"
          : isRegion
            ? "border-purple-500/45 bg-purple-500/10"
            : isAz
              ? "border-indigo-400/55 bg-indigo-400/5 border-dashed"
              : isAsg
                ? "border-orange-400/60 bg-orange-400/8 border-dashed"
                : isGeneric
                  ? "border-zinc-400/50 bg-zinc-400/8 border-dashed"
                  : isPrivateSubnet
                    ? "border-blue-500/45 bg-blue-500/10"
                    : "border-emerald-500/45 bg-emerald-500/10",
        selected && "ring-2 ring-primary ring-offset-4 ring-offset-background",
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
              ? "!border-violet-500/70"
              : isRegion
                ? "!border-purple-400/70"
                : isAsg
                  ? "!border-orange-400/70"
                  : isGeneric
                    ? "!border-zinc-400/70"
                    : isPrivateSubnet
                      ? "!border-blue-400/70"
                      : "!border-emerald-400/70",
          )}
          handleClassName={cn(
            "!h-3 !w-3 !rounded-full !border-2 !bg-background",
            isVpc
              ? "!border-violet-500"
              : isRegion
                ? "!border-purple-400"
                : isAsg
                  ? "!border-orange-400"
                  : isGeneric
                    ? "!border-zinc-400"
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
            ? "border-violet-500/60 bg-background text-violet-200"
            : isRegion
              ? "border-purple-500/50 bg-background text-purple-200"
              : isAz
                ? "border-indigo-400/60 bg-background text-indigo-200"
                : isAsg
                  ? "border-orange-400/60 bg-background text-orange-200"
                  : isGeneric
                    ? "border-zinc-400/50 bg-background text-zinc-300"
                    : isPrivateSubnet
                      ? "border-blue-500/50 bg-background text-blue-200"
                      : "border-emerald-500/50 bg-background text-emerald-200",
        )}
      >
        <EditableNodeLabel
          value={displayLabel}
          editLabel={t.editNodeName}
          className="max-w-48 text-current font-semibold"
          onCommit={renameNode}
        />
        {isAz && data.synced && (
          <Link className="h-3 w-3 shrink-0 text-indigo-300/80" />
        )}
      </div>
    </div>
  );
}
