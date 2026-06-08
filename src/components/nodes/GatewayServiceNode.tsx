import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { CircularServiceIcon } from "@/components/CircularServiceIcon";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import { CustomerGatewayIcon } from "@/components/icons/CustomerGatewayIcon";
import { getCustomerGatewayHandleIds } from "@/lib/vpn-gateway-edges";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useNodeCommit } from "@/hooks/useNodeCommit";
import type { AwsServiceNodeData } from "@/components/nodes/AwsServiceNode";

export type GatewayServiceNodeType = Node<AwsServiceNodeData, "gatewayService">;

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

export default function GatewayServiceNode({
  id,
  data,
  selected,
}: NodeProps<GatewayServiceNodeType>) {
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

  function vpnHandleClassName(handleId: string, className?: string): string | undefined {
    if (!vpnHandleIds.has(handleId)) return className;
    return cn(className, "customer-gateway-handle");
  }

  function renameNode(name: string) {
    commitNodeUpdate((node) => ({ ...node, data: { ...node.data, name } }));
  }

  return (
    <div className="flex flex-col items-center gap-1.5 w-14">
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={vpnHandleClassName("left")}
        style={{ top: 28, ...vpnHandleStyle("left") }}
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
        style={{ top: 28, ...vpnHandleStyle("right") }}
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
        style={{ left: 28, ...vpnHandleStyle("top") }}
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
        style={{ left: 28, top: 56, ...vpnHandleStyle("bottom") }}
      >
        {vpnHandleIds.has("bottom") && (
          <CustomerGatewayIcon className="size-7 text-purple-600 pointer-events-none" />
        )}
      </Handle>
      <CircularServiceIcon
        slug={data.slug}
        category={data.category}
        name={data.name}
        selected={selected}
        pulseKey={data.pulseKey}
      />
      <EditableNodeLabel
        value={data.name}
        editLabel={t.editNodeName}
        className="text-white"
        onCommit={renameNode}
      />
    </div>
  );
}
