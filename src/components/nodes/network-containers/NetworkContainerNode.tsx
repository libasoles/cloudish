import {
  NodeResizer,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { cva } from "class-variance-authority";
import { Link } from "lucide-react";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import { AwsLogoIcon } from "@/components/icons/AwsLogoIcon";
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

type ContainerTone =
  | "aws"
  | "region"
  | "vpc"
  | "az"
  | "asg"
  | "generic"
  | "privateSubnet"
  | "publicSubnet";

const containerNodeVariants = cva(
  "relative h-full w-full rounded-lg border bg-card/20",
  {
    variants: {
      tone: {
        aws: "border-[#1564a0]/50 bg-[#1564a0]/[0.06]",
        region: "border-purple-400/35 bg-purple-400/5",
        vpc: "border-violet-400/45 bg-violet-400/8",
        az: "border-indigo-400/45 bg-indigo-400/4 border-dashed",
        asg: "border-orange-400/50 bg-orange-400/5 border-dashed",
        generic: "border-zinc-400/40 bg-zinc-400/5 border-dashed",
        privateSubnet: "border-blue-400/40 bg-blue-400/7",
        publicSubnet: "border-emerald-400/40 bg-emerald-400/7",
      },
    },
  },
);

const resizeLineVariants = cva("!border-2", {
  variants: {
    tone: {
      aws: "!border-[#1564a0]/70",
      region: "!border-purple-400/70",
      vpc: "!border-violet-500/70",
      az: "!border-indigo-400/70",
      asg: "!border-orange-400/70",
      generic: "!border-zinc-400/70",
      privateSubnet: "!border-blue-400/70",
      publicSubnet: "!border-emerald-400/70",
    },
  },
});

const resizeHandleVariants = cva(
  "!h-3 !w-3 !rounded-full !border-2 !bg-background",
  {
    variants: {
      tone: {
        aws: "!border-[#1564a0]",
        region: "!border-purple-400",
        vpc: "!border-violet-500",
        az: "!border-indigo-400",
        asg: "!border-orange-400",
        generic: "!border-zinc-400",
        privateSubnet: "!border-blue-400",
        publicSubnet: "!border-emerald-400",
      },
    },
  },
);

const labelVariants = cva(
  "absolute left-3 top-0 -translate-y-1/2 flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold leading-none shadow-sm",
  {
    variants: {
      tone: {
        aws: "border-amber-500/60 bg-background text-amber-300",
        region: "border-purple-500/50 bg-background text-purple-200",
        vpc: "border-violet-500/60 bg-background text-violet-200",
        az: "border-indigo-400/60 bg-background text-indigo-200",
        asg: "border-orange-400/60 bg-background text-orange-200",
        generic: "border-zinc-400/50 bg-background text-zinc-300",
        privateSubnet: "border-blue-500/50 bg-background text-blue-200",
        publicSubnet: "border-emerald-500/50 bg-background text-emerald-200",
      },
    },
  },
);

function getContainerTone(data: NetworkContainerNodeData): ContainerTone {
  if (data.containerType === "aws") {
    return "aws";
  }

  if (data.containerType === "region") {
    return "region";
  }

  if (data.containerType === "vpc") {
    return "vpc";
  }

  if (data.containerType === "az") {
    return "az";
  }

  if (data.containerType === "asg") {
    return "asg";
  }

  if (data.containerType === "generic") {
    return "generic";
  }

  if (data.subnetType === "Private") {
    return "privateSubnet";
  }

  return "publicSubnet";
}

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
  const dropBandSide = useFlowStore((state) =>
    state.dropTargetNodeId === id ? state.dropBandSide : null,
  );
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
  const isAws = data.containerType === "aws";
  const containerTone = getContainerTone(data);
  const displayLabel = String(data.label);

  const STRIP_DEFAULT = 20;
  const si = data.scopeInsets;
  const stripW = {
    right:  si?.right  ? si.right  : STRIP_DEFAULT,
    left:   si?.left   ? si.left   : STRIP_DEFAULT,
  };
  const stripH = {
    top:    si?.top    ? si.top    : STRIP_DEFAULT,
    bottom: si?.bottom ? si.bottom : STRIP_DEFAULT,
  };

  const handleResize = (
    _: unknown,
    params: { width: number; height: number },
  ) => {
    if (isRegion || isVpc) {
      setNodes((prev) => resizeContainerNode(id, params.width, params.height, prev));
    } else if (isAsg || isGeneric || isAws) {
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
        containerNodeVariants({ tone: containerTone }),
        selected && "ring-2 ring-primary ring-offset-4 ring-offset-background",
        isDropTarget && !dropBandSide && "ring-2 ring-emerald-400 ring-offset-2 ring-offset-background",
        isDropTarget && dropBandSide && "ring-2 ring-amber-400 ring-offset-2 ring-offset-background",
        data.pulseKey && "node-click-pulse",
      )}
    >
      {isDropTarget && dropBandSide === "top" && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 rounded-t-[inherit] bg-amber-400/30 shadow-[0_0_14px_2px_rgb(251_191_36/0.25)]"
          style={{ height: stripH.top }}
        />
      )}
      {isDropTarget && dropBandSide === "bottom" && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[inherit] bg-amber-400/30 shadow-[0_0_14px_2px_rgb(251_191_36/0.25)]"
          style={{ height: stripH.bottom }}
        />
      )}
      {isDropTarget && dropBandSide === "left" && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-l-[inherit] bg-amber-400/30 shadow-[0_0_14px_2px_rgb(251_191_36/0.25)]"
          style={{ width: stripW.left }}
        />
      )}
      {isDropTarget && dropBandSide === "right" && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 rounded-r-[inherit] bg-amber-400/30 shadow-[0_0_14px_2px_rgb(251_191_36/0.25)]"
          style={{ width: stripW.right }}
        />
      )}
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
          lineClassName={resizeLineVariants({ tone: containerTone })}
          handleClassName={resizeHandleVariants({ tone: containerTone })}
        />
      )}
      {isAws ? (
        <div className="absolute left-0 top-0 flex items-center rounded-tl-lg px-3 py-2 bg-[#1564a0]">
          <AwsLogoIcon className="h-5 w-auto text-white" />
        </div>
      ) : (
        <div className={labelVariants({ tone: containerTone })}>
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
      )}
    </div>
  );
}
