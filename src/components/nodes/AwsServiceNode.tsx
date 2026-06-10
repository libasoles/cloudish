import { type NodeProps, type Node } from "@xyflow/react";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import CircularNode from "@/components/nodes/CircularNode";
import RectangularNode from "@/components/nodes/RectangularNode";
import ApiGatewayNode from "@/components/nodes/ApiGatewayNode";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import { buildVpnHandleDecorations } from "@/components/nodes/vpn-handle-decorations";
import type { AwsCategory, PlacementScope } from "@/data/aws-services";
import type { BandSide } from "@/lib/placement";
import { getCustomerGatewayHandleIds } from "@/lib/vpn-gateway-edges";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import type { ApiGatewayRoute } from "@/types/flow";
import { useNodeCommit } from "@/hooks/useNodeCommit";

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
  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);
  const t = UI_TEXT[getBrowserLocale()];
  const commitNodeUpdate = useNodeCommit(id);

  const vpnHandleIds = getCustomerGatewayHandleIds(id, edges, nodes);
  const vpnDecorations = buildVpnHandleDecorations(vpnHandleIds);

  function renameNode(name: string) {
    commitNodeUpdate((node) => ({ ...node, data: { ...node.data, name } }));
  }

  if (data.serviceId === "api-gateway") {
    return (
      <ApiGatewayNode
        selected={selected}
        pulseKey={data.pulseKey}
        slug={data.slug}
        category={data.category}
        name={data.name}
        routes={data.routes}
        editLabel={t.editNodeName}
        onRename={renameNode}
        handleDecorations={vpnDecorations}
      />
    );
  }

  if (data.meta?.shape === "circular") {
    return (
      <CircularNode
        selected={selected}
        pulseKey={data.pulseKey}
        handleDecorations={vpnDecorations}
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
    <RectangularNode
      selected={selected}
      pulseKey={data.pulseKey}
      className="flex flex-col items-center gap-1 px-3 py-2 min-w-20"
      handleDecorations={vpnDecorations}
    >
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
    </RectangularNode>
  );
}
