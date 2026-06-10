import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import CircularNode from "@/components/nodes/CircularNode";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import { CustomerGatewayIcon } from "@/components/icons/CustomerGatewayIcon";
import type { AwsCategory, PlacementScope } from "@/data/aws-services";
import type { BandSide } from "@/lib/placement";
import { getCustomerGatewayHandleIds } from "@/lib/vpn-gateway-edges";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import type { ApiGatewayRoute } from "@/types/flow";
import { useNodeCommit } from "@/hooks/useNodeCommit";

const VPN_HANDLE_BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const VPN_HANDLE_TRANSFORM: Record<string, string> = {
  left: "translate(-50%, -50%)",
  right: "translate(50%, -50%)",
  top: "translate(-50%, -50%)",
  bottom: "translate(-50%, 50%)",
};

export type NodeShape = "circular";

export type AwsServiceNodeData = {
  name: string;
  slug: string;
  category: AwsCategory;
  serviceId?: string;
  description?: string;
  fields?: Record<string, string | boolean | number>;
  pulseKey?: string;
  routes?: ApiGatewayRoute[];
  meta?: {
    shape?: NodeShape;
  };
  /** Placement scope — controls which containers this node may nest inside. */
  placementScope?: PlacementScope;
  /** Which band side of its container this node lives on (set when expelled). */
  bandSide?: BandSide;
};

export type AwsServiceNodeType = Node<AwsServiceNodeData, "awsService">;

export default function AwsServiceNode({
  id,
  data,
  selected,
}: NodeProps<AwsServiceNodeType>) {
  const [isHovering, setIsHovering] = useState(false);
  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);
  const t = UI_TEXT[getBrowserLocale()];
  const commitNodeUpdate = useNodeCommit(id);

  const vpnHandleIds = getCustomerGatewayHandleIds(id, edges, nodes);

  function vpnHandleStyle(handleId: string): React.CSSProperties | undefined {
    return vpnHandleIds.has(handleId)
      ? { ...VPN_HANDLE_BASE, transform: VPN_HANDLE_TRANSFORM[handleId] }
      : undefined;
  }

  function vpnHandleClassName(
    handleId: string,
    className?: string,
  ): string | undefined {
    if (!vpnHandleIds.has(handleId)) return className;
    return cn(className, "customer-gateway-handle");
  }

  function renameNode(name: string) {
    commitNodeUpdate((node) => ({ ...node, data: { ...node.data, name } }));
  }

  if (data.serviceId === "api-gateway") {
    const visibleRoutes = (data.routes ?? []).filter(
      (r) => r.path.trim() !== "",
    );
    return (
      <div
        className={cn(
          "flex flex-col bg-white rounded-xl border-2 shadow-sm min-w-36",
          data.pulseKey && "node-click-pulse",
          selected
            ? "border-blue-500 shadow-md ring-2 ring-primary ring-offset-4 ring-offset-background"
            : "border-gray-200",
          isHovering && "node-hovering",
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className={vpnHandleClassName("left")}
          style={vpnHandleStyle("left")}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className={vpnHandleClassName("right")}
          style={{ top: 28, ...vpnHandleStyle("right") }}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className={vpnHandleClassName("top", "handle-vertical")}
          style={vpnHandleStyle("top")}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className={vpnHandleClassName("bottom", "handle-vertical")}
          style={vpnHandleStyle("bottom")}
        />
        <div className="flex flex-col items-center gap-1 px-3 py-2">
          <AwsServiceIcon
            slug={data.slug}
            category={data.category}
            name={data.name}
            size="medium"
          />
          <EditableNodeLabel
            value={data.name}
            editLabel={t.editNodeName}
            onCommit={renameNode}
          />
        </div>
        {visibleRoutes.length > 0 && (
          <div className="border-t border-gray-100 divide-y divide-gray-100">
            {visibleRoutes.map((route) => (
              <div
                key={route.id}
                className="relative flex items-center gap-1.5 px-3 py-1.5"
              >
                <span className="text-xs font-semibold text-violet-600">
                  {route.method}
                </span>
                <span className="text-xs text-gray-600 font-mono truncate">
                  {route.path}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`route-${route.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (data.meta?.shape === "circular") {
    return (
      <CircularNode
        selected={selected}
        pulseKey={data.pulseKey}
        label={
          <EditableNodeLabel
            value={data.name}
            editLabel={t.editNodeName}
            className="text-white"
            onCommit={renameNode}
          />
        }
      >
        <AwsServiceIcon
          slug={data.slug}
          category={data.category}
          name={data.name}
          size="large"
        />
      </CircularNode>
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
        isHovering && "node-hovering",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={vpnHandleClassName("left")}
        style={vpnHandleStyle("left")}
      >
        {vpnHandleIds.has("left") && (
          <CustomerGatewayIcon className="size-7 text-purple-600 pointer-events-none" />
        )}
      </Handle>
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={vpnHandleClassName("right")}
        style={vpnHandleStyle("right")}
      >
        {vpnHandleIds.has("right") && (
          <CustomerGatewayIcon className="size-7 text-purple-600 pointer-events-none" />
        )}
      </Handle>
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={vpnHandleClassName("top", "handle-vertical")}
        style={vpnHandleStyle("top")}
      >
        {vpnHandleIds.has("top") && (
          <CustomerGatewayIcon className="size-7 text-purple-600 pointer-events-none" />
        )}
      </Handle>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={vpnHandleClassName("bottom", "handle-vertical")}
        style={vpnHandleStyle("bottom")}
      >
        {vpnHandleIds.has("bottom") && (
          <CustomerGatewayIcon className="size-7 text-purple-600 pointer-events-none" />
        )}
      </Handle>
      <AwsServiceIcon
        slug={data.slug}
        category={data.category}
        name={data.name}
        size="medium"
      />
      <EditableNodeLabel
        value={data.name}
        editLabel={t.editNodeName}
        onCommit={renameNode}
      />
    </div>
  );
}
