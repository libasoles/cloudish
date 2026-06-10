import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { User, Cloud, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import { CustomerGatewayIcon } from "@/components/icons/CustomerGatewayIcon";
import { SimpleDatabaseIcon } from "@/components/icons/SimpleDatabaseIcon";
import { getCustomerGatewayHandleIds } from "@/lib/vpn-gateway-edges";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useNodeCommit } from "@/hooks/useNodeCommit";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  internet: Cloud,
  web: Monitor,
  mobile: Smartphone,
  database: SimpleDatabaseIcon,
};

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

export type MiscellaneousNodeData = {
  label: string;
  fields?: Record<string, string | boolean | number>;
  pulseKey?: string;
};

export type MiscellaneousNodeType = Node<
  MiscellaneousNodeData,
  "user" | "internet" | "web" | "mobile" | "database"
>;

export default function MiscellaneousNode({
  id,
  type,
  data,
  selected,
}: NodeProps<MiscellaneousNodeType>) {
  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);
  const t = UI_TEXT[getBrowserLocale()];
  const commitNodeUpdate = useNodeCommit(id);

  const label = String(data.fields?.label ?? data.label);
  const vpnHandleIds = getCustomerGatewayHandleIds(id, edges, nodes);
  const IconComponent = ICON_MAP[type ?? "user"] ?? User;

  function vpnHandleStyle(handleId: string): React.CSSProperties | undefined {
    return vpnHandleIds.has(handleId)
      ? { ...VPN_HANDLE_BASE, transform: VPN_HANDLE_TRANSFORM[handleId] }
      : undefined;
  }

  function vpnHandleClassName(handleId: string, className?: string): string | undefined {
    if (!vpnHandleIds.has(handleId)) return className;
    return cn(className, "customer-gateway-handle");
  }

  function renameNode(newLabel: string) {
    commitNodeUpdate((node) => ({
      ...node,
      data: {
        ...node.data,
        label: newLabel,
        fields: { ...(node.data as MiscellaneousNodeData).fields, label: newLabel },
      },
    }));
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 px-2 py-1 rounded-xl min-w-20",
        data.pulseKey && "node-click-pulse",
        selected && "ring-2 ring-primary ring-offset-4 ring-offset-background",
      )}
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
      <IconComponent className="size-14 text-white" />
      <EditableNodeLabel
        value={label}
        editLabel={t.editNodeName}
        className="text-white"
        onCommit={renameNode}
      />
    </div>
  );
}
