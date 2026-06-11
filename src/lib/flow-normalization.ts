import type { AppNode } from "@/types/flow";
import type { AwsServiceNodeData } from "@/components/nodes/AwsServiceNode";

/**
 * Migrates nodes from saved diagrams to the current node model. Runs once per
 * load (flowStore.loadArchitecture), so saved data from older app versions
 * keeps working without persisting a migration.
 */
export function normalizeLoadedNodes(nodes: AppNode[]): AppNode[] {
  return nodes.map(normalizeNatGatewayNode);
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
