import type { AppNode } from "@/types/flow";
import type { AwsServiceNodeData } from "@/components/nodes/AwsServiceNode";
import {
  deriveGatewayBorderSide,
  getGatewayNodeSize,
  getNodeSize,
  isVpcNode,
} from "@/lib/graph-utils";

/**
 * Migrates nodes from saved diagrams to the current node model. Runs once per
 * load (flowStore.loadArchitecture), so saved data from older app versions
 * keeps working without persisting a migration.
 */
export function normalizeLoadedNodes(nodes: AppNode[]): AppNode[] {
  const migrated = nodes.map(normalizeNatGatewayNode);
  const nodesById = new Map(migrated.map((node) => [node.id, node]));
  return migrated.map((node) => normalizeGatewayBorderSide(node, nodesById));
}

/**
 * NAT Gateway used to be a `gatewayService` (snapped to the VPC border). It is
 * now a regular subnet-scoped `awsService` with a circular shape.
 */
function normalizeNatGatewayNode(node: AppNode): AppNode {
  if (node.type !== "gatewayService") return node;

  const data = node.data as AwsServiceNodeData;
  if (data.serviceId !== "nat-gateway") return node;

  return {
    ...node,
    type: "awsService",
    data: {
      ...data,
      meta: { ...data.meta, shape: "circular" },
    },
  } as AppNode;
}

/**
 * Border gateways saved before `gatewayBorderSide` existed get their side
 * derived from the saved position, so repinVpcEdgeGateways can keep them
 * glued to the VPC border across resizes.
 */
function normalizeGatewayBorderSide(
  node: AppNode,
  nodesById: Map<string, AppNode>,
): AppNode {
  if (node.type !== "gatewayService" || !node.parentId) return node;

  const data = node.data as AwsServiceNodeData;
  if (data.gatewayBorderSide) return node;

  const parent = nodesById.get(node.parentId);
  if (!parent || !isVpcNode(parent)) return node;

  const { width: nodeW, height: nodeH } = getGatewayNodeSize(node);
  const { width: vpcW, height: vpcH } = getNodeSize(parent);
  const side = deriveGatewayBorderSide(node.position, nodeW, nodeH, vpcW, vpcH);
  if (!side) return node;

  return { ...node, data: { ...data, gatewayBorderSide: side } } as AppNode;
}
