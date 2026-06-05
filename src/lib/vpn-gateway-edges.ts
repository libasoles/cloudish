import type { AppEdge, AppNode } from "@/types/flow";

export const VPN_GATEWAY_LABEL = "VPN";

export function isVpnGatewayNode(node: AppNode | undefined): boolean {
  return (
    (node?.data as Record<string, unknown> | undefined)?.serviceId ===
    "vpn-gateway"
  );
}

export function isVpnGatewayIncomingEdge(
  edge: Pick<AppEdge, "target">,
  nodes: AppNode[],
): boolean {
  return isVpnGatewayNode(nodes.find((node) => node.id === edge.target));
}

export function resolveVpnGatewayEdgeLabel(
  targetId: string,
  nodes: AppNode[],
): string | null {
  return isVpnGatewayNode(nodes.find((node) => node.id === targetId))
    ? VPN_GATEWAY_LABEL
    : null;
}

export function getCustomerGatewayHandleIds(
  nodeId: string,
  edges: AppEdge[],
  nodes: AppNode[],
): Set<string> {
  const handleIds = new Set<string>();

  for (const edge of edges) {
    if (edge.source !== nodeId || !isVpnGatewayIncomingEdge(edge, nodes)) {
      continue;
    }

    handleIds.add(edge.sourceHandle ?? "right");
  }

  return handleIds;
}
