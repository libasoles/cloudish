import type { Rect } from "@xyflow/react";
import type { AppNode, FlowPosition, NetworkContainerNodeData } from "@/types/flow";

export const CONTAINER_WIDTH = 320;
export const CONTAINER_HEIGHT = 220;
export const DEFAULT_NODE_WIDTH = 150;
export const DEFAULT_NODE_HEIGHT = 40;

export const CONTAINER_STYLE = {
  width: CONTAINER_WIDTH,
  height: CONTAINER_HEIGHT,
} as const;

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

export function orderNodesForSubflows(nodes: AppNode[]) {
  return [...nodes].sort((a, b) => {
    if (isNetworkContainerNode(a) === isNetworkContainerNode(b)) {
      if (isVpcNode(a) !== isVpcNode(b)) {
        return isVpcNode(a) ? -1 : 1;
      }

      return 0;
    }

    return isNetworkContainerNode(a) ? -1 : 1;
  });
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
): FlowPosition {
  if (!node.parentId) {
    return node.position;
  }

  const parentNode = nodesById.get(node.parentId);
  if (!parentNode) {
    return node.position;
  }

  const parentPosition = getAbsolutePosition(parentNode, nodesById);

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
  return nodes
    .filter((node) => {
      if (!isNetworkContainerNode(node) || node.id === childNode?.id) {
        return false;
      }

      if (childNode && isVpcNode(childNode)) {
        return false;
      }

      if (childNode && isSubnetNode(childNode) && !isVpcNode(node)) {
        return false;
      }

      return isRectIntersecting(nodeRect, getNodeRect(node, nodesById));
    })
    .sort((a, b) => {
      if (isSubnetNode(a) !== isSubnetNode(b)) {
        return isSubnetNode(a) ? -1 : 1;
      }

      return 0;
    })[0];
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
