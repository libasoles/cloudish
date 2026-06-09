import type { Rect } from "@xyflow/react";
import type { PlacementScope } from "@/data/aws-services";
import { AWS_SERVICES } from "@/data/aws-services";
import type { AppNode, NetworkContainerNodeData } from "@/types/flow";
import type { ContainerInsets } from "@/lib/graph-utils";
import {
  isSubnetNode,
  isAzNode,
  isVpcNode,
  isRegionNode,
  isNetworkContainerNode,
  getNodeSize,
  getNodeRect,
  getAbsolutePosition,
} from "@/lib/graph-utils";

// Numeric depth of the deepest allowed container per scope.
// Mirrors containerDepth() in findIntersectingContainer:
//   region=1, vpc=2, az=3, subnet=4
const SCOPE_MAX_DEPTH: Record<PlacementScope, number> = {
  global: 0,    // canvas only — no container parent allowed
  regional: 1,  // region max
  vpc: 2,       // vpc max
  subnet: 4,    // no extra restriction
};

export function scopeDepth(scope: PlacementScope): number {
  return SCOPE_MAX_DEPTH[scope];
}

function containerDepth(node: AppNode): number {
  if (isSubnetNode(node)) return 4;
  if (isAzNode(node)) return 3;
  if (isVpcNode(node)) return 2;
  if (isRegionNode(node)) return 1;
  return 0;
}

export function isContainerAllowedForScope(container: AppNode, scope: PlacementScope): boolean {
  return containerDepth(container) <= SCOPE_MAX_DEPTH[scope];
}

// Reads the placement scope for a service from the catalog.
export function getServicePlacementScope(serviceId: string): PlacementScope {
  const service = AWS_SERVICES.find((s) => s.id === serviceId);
  return service?.placementScope ?? "subnet";
}

// Given the drop point (center of the dropped node) and the allowed parent rect,
// determine which side of the band the node should go to.
//
// Rule: if the drop center is within BORDER_THRESHOLD of an edge, that edge wins.
// Otherwise the default side for the scope is used.
const BORDER_THRESHOLD = 0.18; // 18% of dimension from edge

export type BandSide = "top" | "right" | "bottom" | "left";

// Default side per scope (when drop is in the central zone)
const SCOPE_DEFAULT_SIDE: Record<PlacementScope, BandSide> = {
  global: "top",    // global services float above everything
  regional: "right", // data/storage services go to the right
  vpc: "right",
  subnet: "right",  // shouldn't be needed but safe fallback
};

// Edge-service ids that should prefer the left side when in the central zone
const EDGE_SERVICE_IDS = new Set(["api-gateway", "cloudfront", "route53", "waf"]);

export function resolveBandSide(
  dropAbsCenter: { x: number; y: number },
  allowedParentRect: Rect,
  scope: PlacementScope,
  serviceId?: string,
): BandSide {
  const { x, y, width, height } = allowedParentRect;

  const thresholdX = width * BORDER_THRESHOLD;
  const thresholdY = height * BORDER_THRESHOLD;

  const relX = dropAbsCenter.x - x;
  const relY = dropAbsCenter.y - y;

  // Border proximity wins — check in priority order: top, bottom, left, right
  if (relY < thresholdY) return "top";
  if (relY > height - thresholdY) return "bottom";
  if (relX < thresholdX) return "left";
  if (relX > width - thresholdX) return "right";

  // Central zone: use scope + service default
  if (serviceId && EDGE_SERVICE_IDS.has(serviceId)) return "left";
  return SCOPE_DEFAULT_SIDE[scope];
}

// ─── Band insets computation ──────────────────────────────────────────────────

// AwsServiceNode renders with min-w-20 (80px) and py-2+icon40+gap+label ≈ 80px tall.
// API Gateway renders wider because route rows need room for method + path text.
const BAND_NODE_SIZE = 80;
const BAND_NODE_H    = 80;
const API_GATEWAY_BAND_NODE_W = 144;
// Outer strip padding AND gap between consecutive nodes.
// Sized so that after subtracting the 4px React Flow handle protrusion from each side,
// the visible clearance (handle-tip to strip boundary) is ~28px — equal on both sides.
const BAND_PAD       = 32;

type BandNodeSize = {
  width: number;
  height: number;
};

function getNodeNumericDimension(
  node: AppNode,
  axis: "width" | "height",
): number | undefined {
  const style = node.style as { width?: number; height?: number } | undefined;
  const measured = node.measured as { width?: number; height?: number } | undefined;
  return node[axis] ?? style?.[axis] ?? measured?.[axis];
}

export function getBandNodeVisualSize(nodeOrServiceId?: AppNode | string): BandNodeSize {
  const serviceId =
    typeof nodeOrServiceId === "string"
      ? nodeOrServiceId
      : (nodeOrServiceId?.data as { serviceId?: string } | undefined)?.serviceId;
  const minWidth = serviceId === "api-gateway" ? API_GATEWAY_BAND_NODE_W : BAND_NODE_SIZE;

  if (typeof nodeOrServiceId === "object") {
    return {
      width: Math.max(minWidth, getNodeNumericDimension(nodeOrServiceId, "width") ?? minWidth),
      height: Math.max(BAND_NODE_H, getNodeNumericDimension(nodeOrServiceId, "height") ?? BAND_NODE_H),
    };
  }

  return { width: minWidth, height: BAND_NODE_H };
}

// Computes the insets (band widths) a container needs to reserve for scope-rejected
// nodes currently parented to it via the band mechanism.
// Nodes in the band are stored as children with parentId = containerId but with
// data.bandSide marking them as band nodes.
//
// Right/left bands stack nodes VERTICALLY → width inset is a fixed 1-column reservation.
// The container only grows TALLER when the stacked nodes overflow the content height.
//
// Top/bottom bands stack nodes HORIZONTALLY → height inset is a fixed 1-row reservation.
// The container only grows WIDER when the stacked nodes overflow the content width.
export function getScopeBandInsets(
  containerId: string,
  nodes: AppNode[],
): ContainerInsets {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const container = nodesById.get(containerId);
  if (!container || !isNetworkContainerNode(container)) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const bandChildren = nodes.filter(
    (n) => n.parentId === containerId && isBandNode(n),
  );

  const bandNodesBySide: Record<BandSide, AppNode[]> = {
    top: [],
    right: [],
    bottom: [],
    left: [],
  };
  for (const n of bandChildren) {
    const side = getBandSide(n);
    if (side) bandNodesBySide[side].push(n);
  }

  const data = container.data as NetworkContainerNodeData;
  const oldSi: ContainerInsets = data.scopeInsets   ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const gi:    ContainerInsets = data.gatewayInsets ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const { width: cW, height: cH } = getNodeSize(container);

  // True content dimensions: strip all previously-accumulated insets
  const contentW = cW - oldSi.left - oldSi.right - gi.left - gi.right;
  const contentH = cH - oldSi.top  - oldSi.bottom - gi.top  - gi.bottom;

  const maxNodeWidth = (side: BandSide) =>
    Math.max(0, ...bandNodesBySide[side].map((n) => getBandNodeVisualSize(n).width));
  const maxNodeHeight = (side: BandSide) =>
    Math.max(0, ...bandNodesBySide[side].map((n) => getBandNodeVisualSize(n).height));
  const totalNodeWidth = (side: BandSide) =>
    bandNodesBySide[side].reduce((sum, n) => sum + getBandNodeVisualSize(n).width, 0);
  const totalNodeHeight = (side: BandSide) =>
    bandNodesBySide[side].reduce((sum, n) => sum + getBandNodeVisualSize(n).height, 0);

  // Fixed-width/height reservation per occupied side (one column/row regardless of count)
  const rightW = bandNodesBySide.right.length > 0 ? BAND_PAD + maxNodeWidth("right") + BAND_PAD : 0;
  const leftW  = bandNodesBySide.left.length  > 0 ? BAND_PAD + maxNodeWidth("left")  + BAND_PAD : 0;
  const topH   = bandNodesBySide.top.length   > 0 ? BAND_PAD + maxNodeHeight("top")  + BAND_PAD : 0;
  const botH   = bandNodesBySide.bottom.length > 0 ? BAND_PAD + maxNodeHeight("bottom") + BAND_PAD : 0;

  // Right/left nodes stack vertically — only grow taller if they overflow the content height
  const maxVertNeed = Math.max(
    bandNodesBySide.right.length > 0
      ? BAND_PAD + totalNodeHeight("right") + bandNodesBySide.right.length * BAND_PAD
      : 0,
    bandNodesBySide.left.length > 0
      ? BAND_PAD + totalNodeHeight("left") + bandNodesBySide.left.length * BAND_PAD
      : 0,
  );
  const heightOverflow = Math.max(0, maxVertNeed - contentH);

  // Top/bottom nodes stack horizontally — only grow wider if they overflow the content width
  const maxHorizNeed = Math.max(
    bandNodesBySide.top.length > 0
      ? BAND_PAD + totalNodeWidth("top") + bandNodesBySide.top.length * BAND_PAD
      : 0,
    bandNodesBySide.bottom.length > 0
      ? BAND_PAD + totalNodeWidth("bottom") + bandNodesBySide.bottom.length * BAND_PAD
      : 0,
  );
  const widthOverflow = Math.max(0, maxHorizNeed - contentW);

  return {
    top:    topH,
    bottom: botH + heightOverflow,
    left:   leftW,
    right:  rightW + widthOverflow,
  };
}

// ─── Band node identity ───────────────────────────────────────────────────────

export function isBandNode(node: AppNode): boolean {
  return !!(node.data as { bandSide?: string }).bandSide;
}

export function getBandSide(node: AppNode): BandSide | undefined {
  const side = (node.data as { bandSide?: string }).bandSide;
  if (side === "top" || side === "right" || side === "bottom" || side === "left") {
    return side;
  }
  return undefined;
}

// ─── Band position computation ────────────────────────────────────────────────

// Returns the position (relative to the container) for a new band node.
// Stacks along the perpendicular axis (band=right/left → stack vertically,
// band=top/bottom → stack horizontally). slotIndex = number of existing nodes on that side.
export function getBandNodePosition(
  side: BandSide,
  slotIndex: number,
  containerW: number,
  containerH: number,
  nodeSize: BandNodeSize = { width: BAND_NODE_SIZE, height: BAND_NODE_H },
  previousNodeSizes: BandNodeSize[] = [],
): { x: number; y: number } {
  const previousHorizontalSpan =
    previousNodeSizes.length > 0
      ? previousNodeSizes.reduce((sum, size) => sum + size.width, 0) +
        previousNodeSizes.length * BAND_PAD
      : slotIndex * (BAND_NODE_SIZE + BAND_PAD);
  const previousVerticalSpan =
    previousNodeSizes.length > 0
      ? previousNodeSizes.reduce((sum, size) => sum + size.height, 0) +
        previousNodeSizes.length * BAND_PAD
      : slotIndex * (BAND_NODE_H + BAND_PAD);

  switch (side) {
    case "right":
      return {
        x: containerW + BAND_PAD,
        y: BAND_PAD + previousVerticalSpan,
      };
    case "left":
      return {
        x: -(nodeSize.width + BAND_PAD),
        y: BAND_PAD + previousVerticalSpan,
      };
    case "top":
      return {
        x: BAND_PAD + previousHorizontalSpan,
        y: -(nodeSize.height + BAND_PAD),
      };
    case "bottom":
      return {
        x: BAND_PAD + previousHorizontalSpan,
        y: containerH + BAND_PAD,
      };
  }
}

// ─── Container growing for scope bands ───────────────────────────────────────

// Recomputes scopeInsets for a container and applies the growth, analogous to
// how redistributeVpcNodes applies gatewayInsets.
export function redistributeScopeBandForContainer(
  containerId: string,
  nodes: AppNode[],
): AppNode[] {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const container = nodesById.get(containerId);
  if (!container || !isNetworkContainerNode(container)) return nodes;

  const newScopeInsets = getScopeBandInsets(containerId, nodes);
  const data = container.data as NetworkContainerNodeData;
  const oldInsets: ContainerInsets = data.scopeInsets ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const gateInsets: ContainerInsets = data.gatewayInsets ?? { top: 0, right: 0, bottom: 0, left: 0 };

  // Total insets = gatewayInsets + scopeInsets
  const totalOld = {
    top:    oldInsets.top    + gateInsets.top,
    right:  oldInsets.right  + gateInsets.right,
    bottom: oldInsets.bottom + gateInsets.bottom,
    left:   oldInsets.left   + gateInsets.left,
  };
  const totalNew = {
    top:    newScopeInsets.top    + gateInsets.top,
    right:  newScopeInsets.right  + gateInsets.right,
    bottom: newScopeInsets.bottom + gateInsets.bottom,
    left:   newScopeInsets.left   + gateInsets.left,
  };

  const { width: cW, height: cH } = getNodeSize(container);

  // Content-box (what the container was without the old total inset growth)
  const baseW = cW - totalOld.left - totalOld.right;
  const baseH = cH - totalOld.top  - totalOld.bottom;

  const newW = baseW + totalNew.left + totalNew.right;
  const newH = baseH + totalNew.top  + totalNew.bottom;

  // Shift so the content box stays fixed; only the band grows outward
  const absPos = getAbsolutePosition(container, nodesById);
  const newAbsX = absPos.x - (totalNew.left  - totalOld.left);
  const newAbsY = absPos.y - (totalNew.top   - totalOld.top);

  // Convert new absolute position back to parent-relative
  const parentAbsPos = container.parentId
    ? getAbsolutePosition(nodesById.get(container.parentId)!, nodesById)
    : { x: 0, y: 0 };

  const newRelPos = {
    x: newAbsX - parentAbsPos.x,
    y: newAbsY - parentAbsPos.y,
  };
  const deltaX = newRelPos.x - container.position.x;
  const deltaY = newRelPos.y - container.position.y;

  return nodes.map((n) => {
    if (n.id === containerId) {
      return {
        ...n,
        width: newW,
        height: newH,
        position: newRelPos,
        style: { ...n.style, width: newW, height: newH },
        data: { ...n.data, scopeInsets: newScopeInsets },
      };
    }
    if (n.parentId === containerId && (deltaX !== 0 || deltaY !== 0)) {
      return {
        ...n,
        position: {
          x: n.position.x - deltaX,
          y: n.position.y - deltaY,
        },
      };
    }
    return n;
  });
}

// Walk all region and vpc nodes and recompute their scope bands.
export function redistributeScopeAffectedLayouts(nodes: AppNode[]): AppNode[] {
  let result = nodes;
  const containerIds = result
    .filter((n) => isRegionNode(n) || isVpcNode(n))
    .map((n) => n.id);

  for (const id of containerIds) {
    result = redistributeScopeBandForContainer(id, result);
  }
  return result;
}

// ─── Placing a node into the band ────────────────────────────────────────────

// Given a container node and a scope/serviceId, returns the { parentId, position, data }
// patch to place a new node in the appropriate band slot.
export function computeBandPlacement(
  container: AppNode,
  side: BandSide,
  nodes: AppNode[],
  serviceId?: string,
): { parentId: string; position: { x: number; y: number } } {
  const { width: cW, height: cH } = getNodeSize(container);
  const data = container.data as NetworkContainerNodeData;
  const si: ContainerInsets = data.scopeInsets   ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const gi: ContainerInsets = data.gatewayInsets ?? { top: 0, right: 0, bottom: 0, left: 0 };

  // Use content dimensions so all nodes on the same band side stay aligned.
  // Total width/height already includes accumulated insets — strip them out.
  const contentW = cW - (si.left + gi.left) - (si.right  + gi.right);
  const contentH = cH - (si.top  + gi.top)  - (si.bottom + gi.bottom);

  const existingSideNodes = nodes.filter(
    (n) => n.parentId === container.id && getBandSide(n) === side,
  );
  const slotIndex = existingSideNodes.length;
  const nodeSize = getBandNodeVisualSize(serviceId);
  const previousNodeSizes = existingSideNodes.map(getBandNodeVisualSize);

  return {
    parentId: container.id,
    position: getBandNodePosition(
      side,
      slotIndex,
      contentW,
      contentH,
      nodeSize,
      previousNodeSizes,
    ),
  };
}

// ─── Find the correct allowed ancestor ───────────────────────────────────────

// Given a node's drop position rect and the full node list, walk up the
// intersecting container hierarchy until we find one allowed for the scope.
// Returns null if scope=global (no container allowed).
export function findAllowedAncestorForScope(
  nodeRect: Rect,
  scope: PlacementScope,
  nodes: AppNode[],
): AppNode | null {
  if (scope === "global") return null;

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const containerNodes = nodes.filter(isNetworkContainerNode);

  // Find all intersecting containers, sorted deepest first
  const intersecting = containerNodes
    .filter((c) => {
      const cRect = getNodeRect(c, nodesById);
      const ax = nodeRect.x < cRect.x + cRect.width && nodeRect.x + nodeRect.width > cRect.x;
      const ay = nodeRect.y < cRect.y + cRect.height && nodeRect.y + nodeRect.height > cRect.y;
      return ax && ay;
    })
    .sort((a, b) => containerDepth(b) - containerDepth(a));

  // Return the deepest container that's still within the allowed depth
  for (const c of intersecting) {
    if (isContainerAllowedForScope(c, scope)) return c;
  }

  return null;
}

// ─── Global scope: expel to canvas outside nearest region ─────────────────────

// When a global-scope service is at a position that falls inside a region,
// compute a top-level canvas position just outside that region on the closest side.
// Returns the original position unchanged if it doesn't overlap any region.
export function expelGlobalNodePosition(
  nodePos: { x: number; y: number },
  nodeW: number,
  nodeH: number,
  nodes: AppNode[],
): { x: number; y: number } {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const regions = nodes.filter(isRegionNode);

  for (const region of regions) {
    const rRect = getNodeRect(region, nodesById);

    // Check if node center is inside region
    const cx = nodePos.x + nodeW / 2;
    const cy = nodePos.y + nodeH / 2;
    if (cx < rRect.x || cx > rRect.x + rRect.width) continue;
    if (cy < rRect.y || cy > rRect.y + rRect.height) continue;

    // Node center is inside this region — find closest exit side
    const distLeft   = cx - rRect.x;
    const distRight  = (rRect.x + rRect.width) - cx;
    const distTop    = cy - rRect.y;
    const distBottom = (rRect.y + rRect.height) - cy;

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    if (minDist === distLeft) {
      return { x: rRect.x - nodeW - BAND_PAD, y: nodePos.y };
    } else if (minDist === distRight) {
      return { x: rRect.x + rRect.width + BAND_PAD, y: nodePos.y };
    } else if (minDist === distTop) {
      return { x: nodePos.x, y: rRect.y - nodeH - BAND_PAD };
    } else {
      return { x: nodePos.x, y: rRect.y + rRect.height + BAND_PAD };
    }
  }

  return nodePos;
}

// Returns true if the given absolute position (node center) falls inside any region.
export function isPositionInsideRegion(
  cx: number,
  cy: number,
  nodes: AppNode[],
): boolean {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  return nodes.filter(isRegionNode).some((region) => {
    const rRect = getNodeRect(region, nodesById);
    return cx >= rRect.x && cx <= rRect.x + rRect.width &&
           cy >= rRect.y && cy <= rRect.y + rRect.height;
  });
}
