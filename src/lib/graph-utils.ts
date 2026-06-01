import type { Rect } from "@xyflow/react";
import type {
  AppNode,
  FlowPosition,
  NetworkContainerNodeData,
  NetworkContainerType,
} from "@/types/flow";

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

export function getNetworkContainerType(node: AppNode) {
  if (!isNetworkContainerNode(node)) return null;
  return (node.data as NetworkContainerNodeData).containerType;
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
  const style = node.style as { width?: number; height?: number } | undefined;
  return {
    width: node.measured?.width ?? node.width ?? style?.width ?? DEFAULT_NODE_WIDTH,
    height: node.measured?.height ?? node.height ?? style?.height ?? DEFAULT_NODE_HEIGHT,
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

const REGION_HEADER_H = 36;
const AZ_PAD = 12;
const VPC_PAD = 18;
const SUBNET_PAD = 12;

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
      width: azW,
      height: azH,
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

export function buildSubnetNodes(
  azId: string,
  azW: number,
  azH: number,
  count: number,
): AppNode[] {
  const subnetW = azW - SUBNET_PAD * 2;
  const subnetH = Math.floor(
    (azH - REGION_HEADER_H - SUBNET_PAD * (count + 1)) / count,
  );

  return Array.from({ length: count }, (_, i) => ({
    id: `subnet-${azId}-${i + 1}`,
    type: "networkContainer" as const,
    parentId: azId,
    draggable: false,
    selectable: true,
    position: {
      x: SUBNET_PAD,
      y: REGION_HEADER_H + SUBNET_PAD + i * (subnetH + SUBNET_PAD),
    },
    data: {
      containerType: "subnet" as const,
      label: `Public Subnet ${i + 1}`,
      subnetType: "Public" as const,
    } as NetworkContainerNodeData,
    style: { width: subnetW, height: subnetH },
    extent: "parent" as const,
  })) as AppNode[];
}

export function redistributeSubnetNodes(
  azId: string,
  azW: number,
  azH: number,
  nodes: AppNode[],
): AppNode[] {
  const subnetChildren = nodes.filter(
    (n) => n.parentId === azId && isSubnetNode(n),
  );
  if (!subnetChildren.length) return nodes;

  const count = subnetChildren.length;
  const subnetW = azW - SUBNET_PAD * 2;
  const subnetH = Math.floor(
    (azH - REGION_HEADER_H - SUBNET_PAD * (count + 1)) / count,
  );

  return nodes.map((n) => {
    const subnetIndex = subnetChildren.findIndex((s) => s.id === n.id);
    if (subnetIndex === -1) return n;

    return {
      ...n,
      width: subnetW,
      height: subnetH,
      position: {
        x: SUBNET_PAD,
        y: REGION_HEADER_H + SUBNET_PAD + subnetIndex * (subnetH + SUBNET_PAD),
      },
      style: { ...n.style, width: subnetW, height: subnetH },
    };
  });
}

export function mirrorNodeToSiblingAzs(
  newNode: AppNode,
  nodes: AppNode[],
  makeId: (sibAzId: string) => string,
): AppNode[] {
  if (!newNode.parentId) return [];

  const nodesById = new Map(nodes.map((n) => [n.id, n]));

  const directParent = nodesById.get(newNode.parentId);
  if (!directParent) return [];

  // Walk up to find the AZ ancestor (direct parent or grandparent)
  const findAzAncestor = (startId: string): AppNode | null => {
    let currentId: string | undefined = startId;
    while (currentId) {
      const current = nodesById.get(currentId);
      if (!current) break;
      if (isAzNode(current)) return current;
      currentId = current.parentId;
    }
    return null;
  };

  const az = isAzNode(directParent) ? directParent : findAzAncestor(newNode.parentId);
  if (!az || !(az.data as NetworkContainerNodeData).synced) return [];

  const siblingAzs = nodes.filter(
    (n) =>
      n.id !== az.id &&
      n.parentId === az.parentId &&
      isAzNode(n) &&
      (n.data as NetworkContainerNodeData).synced,
  );
  if (!siblingAzs.length) return [];

  const mirrors: AppNode[] = [];
  for (const sibAz of siblingAzs) {
    let targetParentId: string = sibAz.id;

    // If node is inside a subnet (not directly in the AZ), match by subnet index
    if (newNode.parentId !== az.id && isSubnetNode(directParent)) {
      const azSubnets = nodes.filter((n) => n.parentId === az.id && isSubnetNode(n));
      const subnetIdx = azSubnets.findIndex((s) => s.id === newNode.parentId);
      const sibSubnets = nodes.filter((n) => n.parentId === sibAz.id && isSubnetNode(n));
      if (subnetIdx >= 0 && subnetIdx < sibSubnets.length) {
        targetParentId = sibSubnets[subnetIdx].id;
      }
    }

    mirrors.push({ ...newNode, id: makeId(sibAz.id), parentId: targetParentId });
  }

  return mirrors;
}

export function redistributeVpcNodes(
  regionId: string,
  regionW: number,
  regionH: number,
  nodes: AppNode[],
): AppNode[] {
  const vpcChildren = nodes.filter(
    (n) => n.parentId === regionId && isVpcNode(n),
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
      width: vpcW,
      height: vpcH,
      position: { x: VPC_PAD + vpcIndex * (vpcW + VPC_PAD), y: REGION_HEADER_H },
      style: { ...n.style, width: vpcW, height: vpcH },
    };
  });
}

export function redistributeNestedContainerNodes(nodes: AppNode[]): AppNode[] {
  let result = nodes;

  const redistributeSubnetsForAzs = () => {
    const resultById = new Map(result.map((node) => [node.id, node]));
    const azNodes = result.filter(isAzNode);

    for (const az of azNodes) {
      const currentAz = resultById.get(az.id);
      if (!currentAz) continue;
      const { width, height } = getNodeSize(currentAz);
      result = redistributeSubnetNodes(currentAz.id, width, height, result);
    }
  };

  const regionNodes = result.filter(isRegionNode);
  for (const region of regionNodes) {
    const { width, height } = getNodeSize(region);
    result = redistributeVpcNodes(region.id, width, height, result);
  }

  const vpcNodes = result.filter(isVpcNode);
  for (const vpc of vpcNodes) {
    const currentVpc = result.find((node) => node.id === vpc.id);
    if (!currentVpc) continue;
    const { width, height } = getNodeSize(currentVpc);
    result = redistributeAzNodes(currentVpc.id, width, height, result);
  }

  redistributeSubnetsForAzs();

  return result;
}

export function redistributeChildContainers(
  parentId: string,
  childType: NetworkContainerType,
  nodes: AppNode[],
): AppNode[] {
  const parent = nodes.find((node) => node.id === parentId);
  if (!parent) return nodes;

  const { width, height } = getNodeSize(parent);
  let result = nodes;

  if (childType === "vpc") {
    result = redistributeVpcNodes(parentId, width, height, result);
  } else if (childType === "az") {
    result = redistributeAzNodes(parentId, width, height, result);
  } else if (childType === "subnet") {
    result = redistributeSubnetNodes(parentId, width, height, result);
  }

  return redistributeNestedContainerNodes(result);
}
