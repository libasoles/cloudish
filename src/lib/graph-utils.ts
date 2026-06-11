import type { Rect } from "@xyflow/react";
import type {
  AppNode,
  FlowPosition,
  NetworkContainerNodeData,
  NetworkContainerType,
} from "@/types/flow";

export const CONTAINER_WIDTH = 384;
export const CONTAINER_HEIGHT = 264;
export const DEFAULT_NODE_WIDTH = 150;
export const DEFAULT_NODE_HEIGHT = 40;

// Approximate *visual* footprint of an icon-style leaf node (icon + label).
// DEFAULT_NODE_WIDTH/HEIGHT is the hit-test rect, not what gets rendered, so
// overlap avoidance uses this instead to keep nodes visually clear.
export const VISUAL_NODE_SIZE = { width: 96, height: 96 } as const;

export const AWS_WIDTH = 1360;
export const AWS_HEIGHT = 920;

export const REGION_WIDTH = 1160;
export const REGION_HEIGHT = 760;
export const VPC_WIDTH = 760;
export const VPC_HEIGHT = 520;
export const SUBNET_WIDTH = 384;
export const SUBNET_HEIGHT = 264;

export const AZ_WIDTH = 580;
export const AZ_HEIGHT = 400;

export const ASG_WIDTH = 480;
export const ASG_HEIGHT = 312;
export const ASG_STYLE = { width: ASG_WIDTH, height: ASG_HEIGHT } as const;
export const GATEWAY_EDGE_CLEARANCE = 16;

export const AWS_STYLE = { width: AWS_WIDTH, height: AWS_HEIGHT } as const;
export const REGION_STYLE = { width: REGION_WIDTH, height: REGION_HEIGHT } as const;
export const VPC_STYLE = { width: VPC_WIDTH, height: VPC_HEIGHT } as const;
export const AZ_STYLE = { width: AZ_WIDTH, height: AZ_HEIGHT } as const;
export const SUBNET_STYLE = { width: SUBNET_WIDTH, height: SUBNET_HEIGHT } as const;
export const CONTAINER_STYLE = SUBNET_STYLE;

export type ContainerInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const EMPTY_CONTAINER_INSETS: ContainerInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

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

export function isAwsNode(node: AppNode) {
  return (
    isNetworkContainerNode(node) &&
    (node.data as NetworkContainerNodeData).containerType === "aws"
  );
}

export function getNetworkContainerType(node: AppNode) {
  if (!isNetworkContainerNode(node)) return null;
  return (node.data as NetworkContainerNodeData).containerType;
}

export function orderNodesForSubflows(nodes: AppNode[]) {
  const getContainerOrder = (node: AppNode): number => {
    if (!isNetworkContainerNode(node)) return 6;
    if (isAwsNode(node)) return 0;
    if (isRegionNode(node)) return 1;
    if (isVpcNode(node)) return 2;
    if (isAzNode(node)) return 3;
    if (isSubnetNode(node)) return 4;
    return 5;
  };

  return [...nodes].sort((a, b) => getContainerOrder(a) - getContainerOrder(b));
}

export function getNodeSize(node: AppNode) {
  const style = node.style as { width?: number; height?: number } | undefined;
  return {
    width: node.width ?? style?.width ?? node.measured?.width ?? DEFAULT_NODE_WIDTH,
    height: node.height ?? style?.height ?? node.measured?.height ?? DEFAULT_NODE_HEIGHT,
  };
}

// Fallback dimensions for a gateway node before React Flow measures it.
// Matches the w-14 (56px) width and circle-icon + label height (~80px) in GatewayServiceNode.
export const GATEWAY_NODE_FALLBACK_W = 56;
export const GATEWAY_NODE_FALLBACK_H = 80;

// Vertical distance from the top of any service node to the center of its icon.
// Circular nodes: size-14 circle (56px) → center at 28px.
// Rectangular nodes: py-2 (8px) top padding + size-10 icon (40px) / 2 = 28px.
export const NODE_ICON_CENTER_Y = 28;

export function getGatewayNodeSize(node: AppNode) {
  const style = node.style as { width?: number; height?: number } | undefined;
  return {
    width:  node.width  ?? style?.width  ?? node.measured?.width  ?? GATEWAY_NODE_FALLBACK_W,
    height: node.height ?? style?.height ?? node.measured?.height ?? GATEWAY_NODE_FALLBACK_H,
  };
}

// Snaps a gateway node's position so it sits exactly 50% inside / 50% outside
// the VPC border it is crossing or nearest to. Also handles gateways that are
// fully outside the VPC (e.g., after an overshoot drag) or fully inside it
// (dragged across the interior toward another edge) by projecting to the
// nearest border. The parallel axis stays free so the user can slide along the edge.
// When the node crosses two borders at once (corner drop), the border whose edge
// is closest to the node center wins.
export function snapGatewayNodeToVpcBorder(
  pos: { x: number; y: number },
  nodeW: number,
  nodeH: number,
  vpcW: number,
  vpcH: number,
): { x: number; y: number } {
  const crossLeft   = pos.x < 0 && pos.x + nodeW > 0;
  const crossRight  = pos.x < vpcW && pos.x + nodeW > vpcW;
  const crossTop    = pos.y < 0 && pos.y + nodeH > 0;
  const crossBottom = pos.y < vpcH && pos.y + nodeH > vpcH;

  // No border crossed — fully outside or fully inside: snap to the nearest border.
  if (!crossLeft && !crossRight && !crossTop && !crossBottom) {
    const fullyRight  = pos.x >= vpcW;
    const fullyLeft   = pos.x + nodeW <= 0;
    const fullyBottom = pos.y >= vpcH;
    const fullyTop    = pos.y + nodeH <= 0;

    if (fullyRight && !fullyTop && !fullyBottom) return { x: vpcW - nodeW / 2, y: pos.y };
    if (fullyLeft  && !fullyTop && !fullyBottom) return { x: -nodeW / 2, y: pos.y };
    if (fullyBottom && !fullyLeft && !fullyRight) return { x: pos.x, y: vpcH - nodeH / 2 };
    if (fullyTop   && !fullyLeft && !fullyRight) return { x: pos.x, y: -nodeH / 2 };

    // Corner overshoot or fully inside: pick closest border by center distance.
    // Border gateways always live on a border — a drop in the VPC interior
    // re-resolves to whichever edge is nearest (soft snap, repositionable).
    const cx = pos.x + nodeW / 2;
    const cy = pos.y + nodeH / 2;
    const dLeft   = Math.abs(cx);
    const dRight  = Math.abs(cx - vpcW);
    const dTop    = Math.abs(cy);
    const dBottom = Math.abs(cy - vpcH);
    const minD = Math.min(dLeft, dRight, dTop, dBottom);
    if (minD === dRight)  return { x: vpcW - nodeW / 2, y: pos.y };
    if (minD === dLeft)   return { x: -nodeW / 2, y: pos.y };
    if (minD === dBottom) return { x: pos.x, y: vpcH - nodeH / 2 };
    return { x: pos.x, y: -nodeH / 2 };
  }

  let x = pos.x;
  let y = pos.y;

  const xCross = crossLeft || crossRight;
  const yCross = crossTop  || crossBottom;

  if (xCross && yCross) {
    // Corner: pick whichever border the node center is closest to.
    const cx = pos.x + nodeW / 2;
    const cy = pos.y + nodeH / 2;
    const minDX = Math.min(Math.abs(cx), Math.abs(cx - vpcW));
    const minDY = Math.min(Math.abs(cy), Math.abs(cy - vpcH));
    if (minDX <= minDY) {
      x = crossLeft ? -nodeW / 2 : vpcW - nodeW / 2;
    } else {
      y = crossTop ? -nodeH / 2 : vpcH - nodeH / 2;
    }
    return { x, y };
  }

  if (crossLeft)   x = -nodeW / 2;
  if (crossRight)  x = vpcW - nodeW / 2;
  if (crossTop)    y = -nodeH / 2;
  if (crossBottom) y = vpcH - nodeH / 2;

  return { x, y };
}

export type GatewayBorderSide = "top" | "right" | "bottom" | "left";

// Which VPC border a gateway at `pos` belongs to, resolved with the exact same
// rules as snapGatewayNodeToVpcBorder. Returns null when the node is fully
// inside the VPC (no border to pin to).
export function deriveGatewayBorderSide(
  pos: { x: number; y: number },
  nodeW: number,
  nodeH: number,
  vpcW: number,
  vpcH: number,
): GatewayBorderSide | null {
  const snapped = snapGatewayNodeToVpcBorder(pos, nodeW, nodeH, vpcW, vpcH);
  if (snapped.x === -nodeW / 2) return "left";
  if (snapped.x === vpcW - nodeW / 2) return "right";
  if (snapped.y === -nodeH / 2) return "top";
  if (snapped.y === vpcH - nodeH / 2) return "bottom";
  return null;
}

// Re-glues every gateway child of a VPC to its stored border after the VPC
// changes size, keeping the 50% in / 50% out invariant. Without this, a resize
// leaves border gateways floating (fully inside or outside), which makes the
// gateway-inset calculation oscillate between layout passes instead of
// reaching a fixed point. Returns the input array untouched when nothing moves.
// `excludeIds` (the nodes currently being dragged) makes the snap soft: a
// gateway "in hand" follows the pointer freely instead of being yanked back to
// its stored border on every drag frame; syncNodeSubnet re-snaps it on drop.
export function repinVpcEdgeGateways(
  vpcId: string,
  nodes: AppNode[],
  excludeIds?: ReadonlySet<string>,
): AppNode[] {
  const vpc = nodes.find((n) => n.id === vpcId);
  if (!vpc || !isVpcNode(vpc)) return nodes;

  const { width: vpcW, height: vpcH } = getNodeSize(vpc);
  let changed = false;

  const result = nodes.map((node) => {
    if (!isGatewayServiceNode(node) || node.parentId !== vpcId) return node;
    if (excludeIds?.has(node.id)) return node;

    const { width: nodeW, height: nodeH } = getGatewayNodeSize(node);
    const data = node.data as { gatewayBorderSide?: GatewayBorderSide };
    const side =
      data.gatewayBorderSide ??
      deriveGatewayBorderSide(node.position, nodeW, nodeH, vpcW, vpcH);
    if (!side) return node;

    const pinned = { ...node.position };
    if (side === "left")   pinned.x = -nodeW / 2;
    if (side === "right")  pinned.x = vpcW - nodeW / 2;
    if (side === "top")    pinned.y = -nodeH / 2;
    if (side === "bottom") pinned.y = vpcH - nodeH / 2;

    // Keep the free axis within the border span so a shrinking VPC never
    // strands the gateway past a corner.
    if (side === "left" || side === "right") {
      pinned.y = Math.min(Math.max(pinned.y, 0), Math.max(0, vpcH - nodeH));
    } else {
      pinned.x = Math.min(Math.max(pinned.x, 0), Math.max(0, vpcW - nodeW));
    }

    const samePosition =
      pinned.x === node.position.x && pinned.y === node.position.y;
    if (samePosition && data.gatewayBorderSide) return node;

    changed = true;
    return {
      ...node,
      position: pinned,
      data: { ...node.data, gatewayBorderSide: side },
    };
  });

  return changed ? result : nodes;
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

function isRectContained(inner: Rect, outer: Rect) {
  return (
    inner.x >= outer.x &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y >= outer.y &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

function isGatewayServiceNode(node: AppNode) {
  return node.type === "gatewayService";
}

function isVpcEdgeGateway(gatewayRect: Rect, vpcRect: Rect) {
  return (
    isRectIntersecting(gatewayRect, vpcRect) &&
    !isRectContained(gatewayRect, vpcRect)
  );
}

// Calculates how much a region must grow outward so that VPC-edge gateways
// stay visually inside it. Uses absolute positions so it handles multi-VPC
// regions. The content rect (the un-grown region box) is derived from the
// region's current stored insets, making the result idempotent — repeated
// calls with unchanged gateway positions always produce the same insets.
function getRegionGatewayOuterInsets(
  regionId: string,
  nodes: AppNode[],
): ContainerInsets {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const region = nodesById.get(regionId);
  if (!region || !isRegionNode(region)) return EMPTY_CONTAINER_INSETS;

  const { width: regionW, height: regionH } = getNodeSize(region);
  const storedInsets = (region.data as { gatewayInsets?: ContainerInsets }).gatewayInsets ?? EMPTY_CONTAINER_INSETS;

  // Content box: the stable un-grown region dimensions and position.
  const baseW = regionW - storedInsets.left - storedInsets.right;
  const baseH = regionH - storedInsets.top - storedInsets.bottom;
  const contentX = region.position.x + storedInsets.left;
  const contentY = region.position.y + storedInsets.top;
  const contentRight = contentX + baseW;
  const contentBottom = contentY + baseH;

  // VPC children — used to detect which gateways are VPC-edge gateways.
  const vpcChildren = nodes.filter((n) => n.parentId === regionId && isVpcNode(n));
  const vpcIds = new Set(vpcChildren.map((vpc) => vpc.id));

  const result = nodes.reduce<ContainerInsets>((insets, node) => {
    // Only gateways parented directly to a VPC count. A gateway nested in an
    // AZ/subnet moves whenever this very redistribution resizes its container,
    // so feeding it back into the insets would oscillate forever.
    if (!isGatewayServiceNode(node) || !node.parentId || !vpcIds.has(node.parentId)) {
      return insets;
    }

    const gatewayRect = getNodeRect(node, nodesById);
    const isEdgeGateway = vpcChildren.some((vpc) =>
      isVpcEdgeGateway(gatewayRect, getNodeRect(vpc, nodesById)),
    );

    if (!isEdgeGateway) return insets;

    const gatewayRight = gatewayRect.x + gatewayRect.width;
    const gatewayBottom = gatewayRect.y + gatewayRect.height;

    return {
      left:   gatewayRect.x < contentX       ? Math.max(insets.left,   contentX - gatewayRect.x + GATEWAY_EDGE_CLEARANCE)  : insets.left,
      right:  gatewayRight  > contentRight    ? Math.max(insets.right,  gatewayRight - contentRight + GATEWAY_EDGE_CLEARANCE) : insets.right,
      top:    gatewayRect.y < contentY        ? Math.max(insets.top,    contentY - gatewayRect.y + GATEWAY_EDGE_CLEARANCE)   : insets.top,
      bottom: gatewayBottom > contentBottom   ? Math.max(insets.bottom, gatewayBottom - contentBottom + GATEWAY_EDGE_CLEARANCE) : insets.bottom,
    };
  }, EMPTY_CONTAINER_INSETS);
  return result;
}

export function getVpcGatewayLayoutInsets(
  vpcId: string,
  nodes: AppNode[],
): ContainerInsets {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const vpc = nodesById.get(vpcId);
  if (!vpc || !isVpcNode(vpc)) {
    return EMPTY_CONTAINER_INSETS;
  }

  const vpcRect = getNodeRect(vpc, nodesById);
  const vpcRight = vpcRect.x + vpcRect.width;
  const vpcBottom = vpcRect.y + vpcRect.height;

  return nodes.reduce<ContainerInsets>((insets, node) => {
    // Same parent filter as getRegionGatewayOuterInsets: only direct VPC
    // children are border gateways; nested gateways must never feed insets.
    if (!isGatewayServiceNode(node) || node.parentId !== vpcId) {
      return insets;
    }

    const gatewayRect = getNodeRect(node, nodesById);
    if (!isVpcEdgeGateway(gatewayRect, vpcRect)) {
      return insets;
    }

    const gatewayRight = gatewayRect.x + gatewayRect.width;
    const gatewayBottom = gatewayRect.y + gatewayRect.height;

    return {
      top:
        gatewayRect.y < vpcRect.y && gatewayBottom > vpcRect.y
          ? Math.max(insets.top, gatewayBottom - vpcRect.y + GATEWAY_EDGE_CLEARANCE)
          : insets.top,
      right:
        gatewayRect.x < vpcRight && gatewayRight > vpcRight
          ? Math.max(insets.right, vpcRight - gatewayRect.x + GATEWAY_EDGE_CLEARANCE)
          : insets.right,
      bottom:
        gatewayRect.y < vpcBottom && gatewayBottom > vpcBottom
          ? Math.max(insets.bottom, vpcBottom - gatewayRect.y + GATEWAY_EDGE_CLEARANCE)
          : insets.bottom,
      left:
        gatewayRect.x < vpcRect.x && gatewayRight > vpcRect.x
          ? Math.max(insets.left, gatewayRight - vpcRect.x + GATEWAY_EDGE_CLEARANCE)
          : insets.left,
    };
  }, EMPTY_CONTAINER_INSETS);
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

      // AWS is always top-level: cannot have a parent
      if (childNode && isAwsNode(childNode)) return false;

      // Region can only parent to an AWS container
      if (childNode && isRegionNode(childNode) && !isAwsNode(node)) return false;

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

// Minimum clearance kept between a freshly placed node and its neighbours.
const OVERLAP_AVOID_GAP = 12;
// How far the spiral search will wander (in rings) before giving up.
const OVERLAP_AVOID_MAX_RINGS = 24;

function rectsOverlapWithGap(a: Rect, b: Rect, gap: number) {
  return isRectIntersecting(
    { x: a.x - gap, y: a.y - gap, width: a.width + gap * 2, height: a.height + gap * 2 },
    b,
  );
}

/**
 * Finds an absolute position near `desired` where a node of `size` does not
 * overlap any of `obstacles`. Returns `desired` unchanged when it is already
 * clear. Otherwise spirals outward and returns the nearest free spot.
 *
 * Used only when *adding* a node — existing nodes can still be dragged on top
 * of one another. `obstacles` should be the absolute rects of leaf nodes
 * (containers are intentionally excluded, since nodes nest inside them).
 */
export function findNonOverlappingPosition(
  desired: FlowPosition,
  size: { width: number; height: number },
  obstacles: Rect[],
): FlowPosition {
  const isFree = (pos: FlowPosition) => {
    const rect = { ...pos, ...size };
    return !obstacles.some((o) => rectsOverlapWithGap(rect, o, OVERLAP_AVOID_GAP));
  };

  if (isFree(desired)) {
    return desired;
  }

  const stepX = size.width + OVERLAP_AVOID_GAP;
  const stepY = size.height + OVERLAP_AVOID_GAP;

  for (let ring = 1; ring <= OVERLAP_AVOID_MAX_RINGS; ring++) {
    let best: FlowPosition | null = null;
    let bestDist = Infinity;

    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        // Only the outer perimeter of this ring is new.
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;

        const candidate = {
          x: desired.x + dx * stepX,
          y: desired.y + dy * stepY,
        };
        if (!isFree(candidate)) continue;

        const dist = (candidate.x - desired.x) ** 2 + (candidate.y - desired.y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = candidate;
        }
      }
    }

    if (best) return best;
  }

  return desired;
}

/**
 * Convenience wrapper over `findNonOverlappingPosition` that derives obstacle
 * rects from the current graph: all non-container leaf nodes, in absolute
 * coordinates. `excludeId` skips a node (e.g. one being repositioned).
 */
export function avoidNodeOverlap(
  desired: FlowPosition,
  size: { width: number; height: number },
  nodes: AppNode[],
  excludeId?: string,
): FlowPosition {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const obstacles = nodes
    .filter((node) => node.id !== excludeId && !isNetworkContainerNode(node))
    .map((node) => getNodeRect(node, nodesById));

  return findNonOverlappingPosition(desired, size, obstacles);
}

const REGION_HEADER_H = 36;
const CONTAINER_INNER_GAP = 24;
const CONTAINER_CONTENT_TOP = REGION_HEADER_H + CONTAINER_INNER_GAP;

export function buildAzNodes(
  parentId: string,
  parentW: number,
  parentH: number,
  count: number,
  insets: ContainerInsets = EMPTY_CONTAINER_INSETS,
) {
  const leftPad = Math.max(CONTAINER_INNER_GAP, insets.left);
  const rightPad = Math.max(CONTAINER_INNER_GAP, insets.right);
  const topPad = Math.max(CONTAINER_CONTENT_TOP, insets.top);
  const bottomPad = Math.max(CONTAINER_INNER_GAP, insets.bottom);
  const azH = Math.max(1, parentH - topPad - bottomPad);
  const azW = Math.max(
    1,
    Math.floor(
      (parentW - leftPad - rightPad - CONTAINER_INNER_GAP * (count - 1)) /
        count,
    ),
  );

  return Array.from({ length: count }, (_, i) => ({
    id: `az-${parentId}-${i + 1}`,
    type: "networkContainer" as const,
    parentId,
    draggable: false,
    selectable: true,
    position: { x: leftPad + i * (azW + CONTAINER_INNER_GAP), y: topPad },
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
  insets = getVpcGatewayLayoutInsets(parentId, nodes),
): AppNode[] {
  const azChildren = nodes.filter(
    (n) => n.parentId === parentId && isAzNode(n),
  );
  if (!azChildren.length) return nodes;

  const count = azChildren.length;
  const leftPad = Math.max(CONTAINER_INNER_GAP, insets.left);
  const rightPad = Math.max(CONTAINER_INNER_GAP, insets.right);
  const topPad = Math.max(CONTAINER_CONTENT_TOP, insets.top);
  const bottomPad = Math.max(CONTAINER_INNER_GAP, insets.bottom);
  const azH = Math.max(1, parentH - topPad - bottomPad);
  const azW = Math.max(
    1,
    Math.floor(
      (parentW - leftPad - rightPad - CONTAINER_INNER_GAP * (count - 1)) /
        count,
    ),
  );

  return nodes.map((n) => {
    const azIndex = azChildren.findIndex((az) => az.id === n.id);
    if (azIndex === -1) return n;

    return {
      ...n,
      width: azW,
      height: azH,
      position: {
        x: leftPad + azIndex * (azW + CONTAINER_INNER_GAP),
        y: topPad,
      },
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
  const vpcH = regionH - CONTAINER_CONTENT_TOP - CONTAINER_INNER_GAP;
  const vpcW = Math.floor(
    (regionW - CONTAINER_INNER_GAP * (count + 1)) / count,
  );

  return Array.from({ length: count }, (_, i) => ({
    id: `vpc-${regionId}-${i + 1}`,
    type: "networkContainer" as const,
    parentId: regionId,
    draggable: false,
    selectable: true,
    position: {
      x: CONTAINER_INNER_GAP + i * (vpcW + CONTAINER_INNER_GAP),
      y: CONTAINER_CONTENT_TOP,
    },
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
  getSubnetLabel: (subnetType: string, index: number) => string,
): AppNode[] {
  const subnetW = azW - CONTAINER_INNER_GAP * 2;
  const subnetH = Math.floor(
    (azH - CONTAINER_CONTENT_TOP - CONTAINER_INNER_GAP * count) / count,
  );

  return Array.from({ length: count }, (_, i) => ({
    id: `subnet-${azId}-${i + 1}`,
    type: "networkContainer" as const,
    parentId: azId,
    draggable: false,
    selectable: true,
    position: {
      x: CONTAINER_INNER_GAP,
      y: CONTAINER_CONTENT_TOP + i * (subnetH + CONTAINER_INNER_GAP),
    },
    data: {
      containerType: "subnet" as const,
      label: getSubnetLabel("Public", i + 1),
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
  const subnetW = azW - CONTAINER_INNER_GAP * 2;
  const subnetH = Math.floor(
    (azH - CONTAINER_CONTENT_TOP - CONTAINER_INNER_GAP * count) / count,
  );

  return nodes.map((n) => {
    const subnetIndex = subnetChildren.findIndex((s) => s.id === n.id);
    if (subnetIndex === -1) return n;

    return {
      ...n,
      width: subnetW,
      height: subnetH,
      position: {
        x: CONTAINER_INNER_GAP,
        y: CONTAINER_CONTENT_TOP + subnetIndex * (subnetH + CONTAINER_INNER_GAP),
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

  // Recover stable content-box dimensions from stored insets so repeated passes
  // with unchanged gateways/scope-bands produce the identical layout (idempotent).
  // Both gatewayInsets and scopeInsets contribute to region growth; the VPC content
  // area must exclude BOTH sets of margins so VPCs never overlap band nodes.
  const regionNode = nodes.find((n) => n.id === regionId);
  const storedGatewayInsets = regionNode
    ? ((regionNode.data as { gatewayInsets?: ContainerInsets }).gatewayInsets ?? EMPTY_CONTAINER_INSETS)
    : EMPTY_CONTAINER_INSETS;
  const storedScopeInsets = regionNode
    ? ((regionNode.data as { scopeInsets?: ContainerInsets }).scopeInsets ?? EMPTY_CONTAINER_INSETS)
    : EMPTY_CONTAINER_INSETS;
  // trueBaseW/H = the original content box without any inset growth
  const trueBaseW = regionW - storedGatewayInsets.left - storedGatewayInsets.right
                             - storedScopeInsets.left  - storedScopeInsets.right;
  const trueBaseH = regionH - storedGatewayInsets.top  - storedGatewayInsets.bottom
                             - storedScopeInsets.top   - storedScopeInsets.bottom;
  const contentX = (regionNode?.position.x ?? 0) + storedGatewayInsets.left + storedScopeInsets.left;
  const contentY = (regionNode?.position.y ?? 0) + storedGatewayInsets.top  + storedScopeInsets.top;

  // Compute how much the region must grow to keep VPC-edge gateways inside it.
  const newInsets = getRegionGatewayOuterInsets(regionId, nodes);
  // Region dimensions = content + new gateway margins + existing scope band margins
  const newRegionW = trueBaseW + newInsets.left + newInsets.right
                               + storedScopeInsets.left + storedScopeInsets.right;
  const newRegionH = trueBaseH + newInsets.top  + newInsets.bottom
                               + storedScopeInsets.top  + storedScopeInsets.bottom;
  const newRegionX = contentX - newInsets.left - storedScopeInsets.left;
  const newRegionY = contentY - newInsets.top - storedScopeInsets.top;

  const count = vpcChildren.length;
  // VPCs fill only the true content area (not the gateway or scope-band margins)
  const vpcH = trueBaseH - CONTAINER_CONTENT_TOP - CONTAINER_INNER_GAP;
  const vpcW = Math.floor(
    (trueBaseW - CONTAINER_INNER_GAP * (count + 1)) / count,
  );

  // How much the region's origin shifts due to gateway inset changes.
  // Non-VPC direct children (e.g. scope-band nodes) must be adjusted by the
  // inverse delta so their absolute canvas position stays fixed.
  const oldRegionX = regionNode?.position.x ?? 0;
  const oldRegionY = regionNode?.position.y ?? 0;
  const deltaX = newRegionX - oldRegionX;
  const deltaY = newRegionY - oldRegionY;

  return nodes.map((n) => {
    if (n.id === regionId) {
      return {
        ...n,
        width: newRegionW,
        height: newRegionH,
        position: { x: newRegionX, y: newRegionY },
        style: { ...n.style, width: newRegionW, height: newRegionH },
        data: { ...n.data, gatewayInsets: newInsets },
      };
    }

    const vpcIndex = vpcChildren.findIndex((v) => v.id === n.id);
    if (vpcIndex === -1) {
      // Non-VPC direct child of the Region (e.g. scope-band nodes): compensate for
      // the Region's position shift so its absolute canvas position is preserved.
      if (n.parentId === regionId && (deltaX !== 0 || deltaY !== 0)) {
        return {
          ...n,
          position: { x: n.position.x - deltaX, y: n.position.y - deltaY },
        };
      }
      return n;
    }

    return {
      ...n,
      width: vpcW,
      height: vpcH,
      position: {
        // VPC starts after gateway insets AND scope band left insets
        x:
          newInsets.left +
          storedScopeInsets.left +
          CONTAINER_INNER_GAP +
          vpcIndex * (vpcW + CONTAINER_INNER_GAP),
        y: newInsets.top + storedScopeInsets.top + CONTAINER_CONTENT_TOP,
      },
      style: { ...n.style, width: vpcW, height: vpcH },
    };
  });
}

export function redistributeVpcInnerLayout(
  vpcId: string,
  nodes: AppNode[],
  excludeFromRepin?: ReadonlySet<string>,
) {
  const vpc = nodes.find((node) => node.id === vpcId);
  if (!vpc || !isVpcNode(vpc)) return nodes;

  // Glue border gateways to the current VPC size BEFORE measuring insets, so
  // the inset calculation sees the settled 50/50 positions and stays constant.
  const pinnedNodes = repinVpcEdgeGateways(vpcId, nodes, excludeFromRepin);

  const { width, height } = getNodeSize(vpc);
  let result = redistributeAzNodes(vpcId, width, height, pinnedNodes);
  result = redistributeSubnetNodes(vpcId, width, height, result);

  const azChildren = result.filter(
    (node) => node.parentId === vpcId && isAzNode(node),
  );

  for (const az of azChildren) {
    const currentAz = result.find((node) => node.id === az.id);
    if (!currentAz) continue;
    const { width: azW, height: azH } = getNodeSize(currentAz);
    result = resizeContainerNode(currentAz.id, azW, azH, result);
  }

  return result;
}

// `draggingNodeIds`: nodes currently in a drag — excluded from the repin step
// so a dragged border gateway can escape its border (soft snap). Inset growth
// still sees the live position, but it is bounded (penetration depth never
// exceeds the gateway size + clearance), so no runaway feedback is possible.
export function redistributeGatewayAffectedVpcLayouts(
  nodes: AppNode[],
  draggingNodeIds?: ReadonlySet<string>,
) {
  let result = nodes;

  // First, grow VPC nodes outward to embrace edge gateways.
  // redistributeVpcNodes uses relative positions for detection, so this is
  // stable — repeated calls with unchanged gateway positions produce the same layout.
  const regionNodes = result.filter(isRegionNode);
  for (const region of regionNodes) {
    const currentRegion = result.find((n) => n.id === region.id);
    if (!currentRegion) continue;
    const { width, height } = getNodeSize(currentRegion);
    result = redistributeVpcNodes(currentRegion.id, width, height, result);
  }

  // Then, push VPC children (AZs) inward to avoid overlapping gateways.
  const vpcNodes = result.filter(isVpcNode);
  for (const vpc of vpcNodes) {
    result = redistributeVpcInnerLayout(vpc.id, result, draggingNodeIds);
  }

  return result;
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

function resizeNode(
  nodes: AppNode[],
  nodeId: string,
  width: number,
  height: number,
) {
  return nodes.map((node) => {
    if (node.id !== nodeId) return node;

    return {
      ...node,
      width,
      height,
      style: { ...node.style, width, height },
    };
  });
}

export function resizeContainerNode(
  nodeId: string,
  width: number,
  height: number,
  nodes: AppNode[],
  excludeFromRepin?: ReadonlySet<string>,
): AppNode[] {
  const containerNode = nodes.find((node) => node.id === nodeId);
  const containerType = containerNode
    ? getNetworkContainerType(containerNode)
    : null;

  if (!containerType) return nodes;

  let result = resizeNode(nodes, nodeId, width, height);

  if (containerType === "region") {
    result = redistributeVpcNodes(nodeId, width, height, result);

    const vpcChildren = result.filter(
      (node) => node.parentId === nodeId && isVpcNode(node),
    );

    for (const vpc of vpcChildren) {
      const currentVpc = result.find((node) => node.id === vpc.id);
      if (!currentVpc) continue;
      const { width: vpcW, height: vpcH } = getNodeSize(currentVpc);
      result = resizeContainerNode(
        currentVpc.id,
        vpcW,
        vpcH,
        result,
        excludeFromRepin,
      );
    }

    return result;
  }

  if (containerType === "vpc") {
    result = repinVpcEdgeGateways(nodeId, result, excludeFromRepin);
    result = redistributeAzNodes(nodeId, width, height, result);
    result = redistributeSubnetNodes(nodeId, width, height, result);

    const azChildren = result.filter(
      (node) => node.parentId === nodeId && isAzNode(node),
    );

    for (const az of azChildren) {
      const currentAz = result.find((node) => node.id === az.id);
      if (!currentAz) continue;
      const { width: azW, height: azH } = getNodeSize(currentAz);
      result = resizeContainerNode(currentAz.id, azW, azH, result);
    }

    return result;
  }

  if (containerType === "az") {
    return redistributeSubnetNodes(nodeId, width, height, result);
  }

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
