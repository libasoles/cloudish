import type { NodeProps, Node } from "@xyflow/react";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import CircularNode from "@/components/nodes/CircularNode";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import { buildVpnHandleDecorations } from "@/components/nodes/vpn-handle-decorations";
import { getCustomerGatewayHandleIds } from "@/lib/vpn-gateway-edges";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useNodeCommit } from "@/hooks/useNodeCommit";
import type { AwsServiceNodeData } from "@/components/nodes/AwsServiceNode";

export type GatewayServiceNodeType = Node<AwsServiceNodeData, "gatewayService">;

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

  function renameNode(name: string) {
    commitNodeUpdate((node) => ({ ...node, data: { ...node.data, name } }));
  }

  return (
    <CircularNode
      selected={selected}
      pulseKey={data.pulseKey}
      handleDecorations={buildVpnHandleDecorations(vpnHandleIds)}
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
