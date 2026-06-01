import type { Rect } from "@xyflow/react";
import type { AppNode, FlowPosition, NetworkContainerNodeData } from "@/types/flow";

export const CONTAINER_WIDTH = 320;
export const CONTAINER_HEIGHT = 220;
export const DEFAULT_NODE_WIDTH = 150;
export const DEFAULT_NODE_HEIGHT = 40;

export const REGION_WIDTH = 900;
export const REGION_HEIGHT = 600;
export const VPC_WIDTH = 600;
export const VPC_HEIGHT = 400;
export const SUBNET_WIDTH = 320;
export const SUBNET_HEIGHT = 220;

export const REGION_STYLE = { width: REGION_WIDTH, height: REGION_HEIGHT } as const;
export const VPC_STYLE = { width: VPC_WIDTH, height: VPC_HEIGHT } as const;
export const SUBNET_STYLE = { width: SUBNET_WIDTH, height: SUBNET_HEIGHT } as const;
export const CONTAINER_STYLE = SUBNET_STYLE;

export function isNetworkContainerNode(node: AppNode) {
  return node.type === "networkContainer";
}

export function isSubnetNode(node: AppNode) {
  return (
    isNetworkContainerNode(node) &&
    (node.data as NetworkContainerNodeData).containerType === "subnet"
  );
}

export function isVpcNode(node: AppNode) {
  return (
    isNetworkContainerNode(node) &&
    (node.data as NetworkContainerNodeData).containerType === "vpc"
  );
}

export function isRegionNode(node: AppNode) {
  return (
    isNetworkContainerNode(node) &&
    (node.data as NetworkContainerNodeData).containerType === "region"
  );
}

export function isAzNode(node: AppNode) {
  return (
    isNetworkContainerNode(node) &&
    (node.data as NetworkContainerNodeData).containerType === "az"
  );
}

export function orderNodesForSubflows(nodes: AppNode[]) {
  const getContainerOrder = (node: AppNode): number => {
    if (!isNetworkContainerNode(node)) return 5;
    if (isRegionNode(node)) return 0;
    if (isVpcNode(node)) return 1;
    if (isAzNode(node)) return 2;
    if (isSubnetNode(node)) return 3;
    return 4;
  };

  return [...nodes].sort((a, b) => getContainerOrder(a) - getContainerOrder(b));
}

export function getNodeSize(node: AppNode) {
  return {
    width: node.width ?? node.measured?.width ?? DEFAULT_NODE_WIDTH,
    height: node.height ?? node.measured?.height ?? DEFAULT_NODE_HEIGHT,
  };
}

export function getAbsolutePosition(
  node: AppNode,
  nodesById: Map<string, AppNode>,
  visited = new Set<string>(),
): FlowPosition {
  if (!node.parentId || visited.has(node.id)) {
    return node.position;
  }

  visited.add(node.id);
  const parentNode = nodesById.get(node.parentId);
  if (!parentNode) {
    return node.position;
  }

  const parentPosition = getAbsolutePosition(parentNode, nodesById, visited);

  return {
    x: parentPosition.x + node.position.x,
    y: parentPosition.y + node.position.y,
  };
}

export function getNodeRect(node: AppNode, nodesById: Map<string, AppNode>): Rect {
  return {
    ...getAbsolutePosition(node, nodesById),
    ...getNodeSize(node),
  };
}

export function isRectIntersecting(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function findIntersectingContainer(
  nodeRect: Rect,
  nodes: AppNode[],
  nodesById: Map<string, AppNode>,
  childNode?: AppNode,
) {
  // Depth = how specific the container is (higher = more specific/inner)
  const containerDepth = (n: AppNode): number => {
    if (isSubnetNode(n)) return 4;
    if (isAzNode(n)) return 3;
    if (isVpcNode(n)) return 2;
    if (isRegionNode(n)) return 1;
    return 0;
  };

  return nodes
    .filter((node) => {
      if (!isNetworkContainerNode(node) || node.id === childNode?.id) {
        return false;
      }

      // Region is always top-level: cannot have a parent
      if (childNode && isRegionNode(childNode)) return false;

      // VPC can only parent to Region
      if (childNode && isVpcNode(childNode) && !isRegionNode(node)) return false;

      // AZ can parent to VPC or Region
      if (childNode && isAzNode(childNode) && !isVpcNode(node) && !isRegionNode(node)) return false;

      // Subnet can parent to AZ or VPC
      if (childNode && isSubnetNode(childNode) && !isAzNode(node) && !isVpcNode(node)) return false;

      return isRectIntersecting(nodeRect, getNodeRect(node, nodesById));
    })
    .sort((a, b) => containerDepth(b) - containerDepth(a))[0];
}

export function getParentedPosition(
  position: FlowPosition,
  size: { width: number; height: number },
  nodes: AppNode[],
) {
  const nodeRect = { ...position, ...size };
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const parentNode = findIntersectingContainer(nodeRect, nodes, nodesById);

  if (!parentNode) {
    return { position };
  }

  const parentPosition = getAbsolutePosition(parentNode, nodesById);

  return {
    parentId: parentNode.id,
    position: {
      x: position.x - parentPosition.x,
      y: position.y - parentPosition.y,
    },
  };
}

const REGION_HEADER_H = 28;
const AZ_PAD = 8;
const VPC_PAD = 12;

export function buildAzNodes(
  parentId: string,
  parentW: number,
  parentH: number,
  count: number,
) {
  const azH = parentH - REGION_HEADER_H - AZ_PAD;
  const azW = Math.floor((parentW - AZ_PAD * (count + 1)) / count);

  return Array.from({ length: count }, (_, i) => ({
    id: `az-${parentId}-${i + 1}`,
    type: "networkContainer" as const,
    parentId,
    draggable: false,
    selectable: true,
    position: { x: AZ_PAD + i * (azW + AZ_PAD), y: REGION_HEADER_H },
    data: {
      containerType: "az" as const,
      label: `AZ ${i + 1}`,
    } as NetworkContainerNodeData,
    style: { width: azW, height: azH },
    extent: "parent" as const,
  })) as AppNode[];
}

export function redistributeAzNodes(
  parentId: string,
  parentW: number,
  parentH: number,
  nodes: AppNode[],
): AppNode[] {
  const azChildren = nodes.filter(
    (n) => n.parentId === parentId && isAzNode(n),
  );
  if (!azChildren.length) return nodes;

  const count = azChildren.length;
  const azH = parentH - REGION_HEADER_H - AZ_PAD;
  const azW = Math.floor((parentW - AZ_PAD * (count + 1)) / count);

  return nodes.map((n) => {
    const azIndex = azChildren.findIndex((az) => az.id === n.id);
    if (azIndex === -1) return n;

    return {
      ...n,
      position: { x: AZ_PAD + azIndex * (azW + AZ_PAD), y: REGION_HEADER_H },
      style: { ...n.style, width: azW, height: azH },
    };
  });
}

export function buildVpcNodes(
  regionId: string,
  regionW: number,
  regionH: number,
  count: number,
): AppNode[] {
  const vpcH = regionH - REGION_HEADER_H - VPC_PAD;
  const vpcW = Math.floor((regionW - VPC_PAD * (count + 1)) / count);

  return Array.from({ length: count }, (_, i) => ({
    id: `vpc-${regionId}-${i + 1}`,
    type: "networkContainer" as const,
    parentId: regionId,
    draggable: false,
    selectable: true,
    position: { x: VPC_PAD + i * (vpcW + VPC_PAD), y: REGION_HEADER_H },
    data: {
      containerType: "vpc" as const,
      label: `VPC ${i + 1}`,
    } as NetworkContainerNodeData,
    style: { width: vpcW, height: vpcH },
    extent: "parent" as const,
  })) as AppNode[];
}

export function redistributeVpcNodes(
  regionId: string,
  regionW: number,
  regionH: number,
  nodes: AppNode[],
): AppNode[] {
  const vpcChildren = nodes.filter(
    (n) => n.parentId === regionId && isVpcNode(n) && n.draggable === false,
  );
  if (!vpcChildren.length) return nodes;

  const count = vpcChildren.length;
  const vpcH = regionH - REGION_HEADER_H - VPC_PAD;
  const vpcW = Math.floor((regionW - VPC_PAD * (count + 1)) / count);

  return nodes.map((n) => {
    const vpcIndex = vpcChildren.findIndex((v) => v.id === n.id);
    if (vpcIndex === -1) return n;

    return {
      ...n,
      position: { x: VPC_PAD + vpcIndex * (vpcW + VPC_PAD), y: REGION_HEADER_H },
      style: { ...n.style, width: vpcW, height: vpcH },
    };
  });
}
