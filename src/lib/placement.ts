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
  DEFAULT_NODE_WIDTH,
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
const EDGE_SERVICE_IDS = new Set(["cloudfront", "route53", "waf"]);

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

const BAND_NODE_SIZE = DEFAULT_NODE_WIDTH;   // 150 — nominal service node width
// AwsServiceNode visual height: py-2(16) + icon(40) + gap-1(4) + label(~20) ≈ 80px
const BAND_NODE_H    = 80;
const BAND_PAD       = 16;                   // padding around band nodes

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

  const counts = { top: 0, right: 0, bottom: 0, left: 0 };
  for (const n of bandChildren) {
    const side = getBandSide(n);
    if (side) counts[side]++;
  }

  const data = container.data as NetworkContainerNodeData;
  const oldSi: ContainerInsets = data.scopeInsets   ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const gi:    ContainerInsets = data.gatewayInsets ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const { width: cW, height: cH } = getNodeSize(container);

  // True content dimensions: strip all previously-accumulated insets
  const contentW = cW - oldSi.left - oldSi.right - gi.left - gi.right;
  const contentH = cH - oldSi.top  - oldSi.bottom - gi.top  - gi.bottom;

  // Fixed-width/height reservation per occupied side (one column/row regardless of count)
  const rightW = counts.right > 0 ? BAND_PAD + BAND_NODE_SIZE + BAND_PAD : 0;
  const leftW  = counts.left  > 0 ? BAND_PAD + BAND_NODE_SIZE + BAND_PAD : 0;
  const topH   = counts.top   > 0 ? BAND_PAD + BAND_NODE_H    + BAND_PAD : 0;
  const botH   = counts.bottom > 0 ? BAND_PAD + BAND_NODE_H    + BAND_PAD : 0;

  // Right/left nodes stack vertically — only grow taller if they overflow the content height
  const maxVertNeed = Math.max(
    counts.right > 0 ? BAND_PAD + counts.right * (BAND_NODE_H    + BAND_PAD) : 0,
    counts.left  > 0 ? BAND_PAD + counts.left  * (BAND_NODE_H    + BAND_PAD) : 0,
  );
  const heightOverflow = Math.max(0, maxVertNeed - contentH);

  // Top/bottom nodes stack horizontally — only grow wider if they overflow the content width
  const maxHorizNeed = Math.max(
    counts.top    > 0 ? BAND_PAD + counts.top    * (BAND_NODE_SIZE + BAND_PAD) : 0,
    counts.bottom > 0 ? BAND_PAD + counts.bottom * (BAND_NODE_SIZE + BAND_PAD) : 0,
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
): { x: number; y: number } {
  const nodeW = BAND_NODE_SIZE;
  const nodeH = BAND_NODE_H;

  switch (side) {
    case "right":
      return {
        x: containerW + BAND_PAD,
        y: BAND_PAD + slotIndex * (nodeH + BAND_PAD),
      };
    case "left":
      return {
        x: -(nodeW + BAND_PAD),
        y: BAND_PAD + slotIndex * (nodeH + BAND_PAD),
      };
    case "top":
      return {
        x: BAND_PAD + slotIndex * (nodeW + BAND_PAD),
        y: -(nodeH + BAND_PAD),
      };
    case "bottom":
      return {
        x: BAND_PAD + slotIndex * (nodeW + BAND_PAD),
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
): { parentId: string; position: { x: number; y: number } } {
  const { width: cW, height: cH } = getNodeSize(container);
  const data = container.data as NetworkContainerNodeData;
  const si: ContainerInsets = data.scopeInsets   ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const gi: ContainerInsets = data.gatewayInsets ?? { top: 0, right: 0, bottom: 0, left: 0 };

  // Use content dimensions so all nodes on the same band side stay aligned.
  // Total width/height already includes accumulated insets — strip them out.
  const contentW = cW - (si.left + gi.left) - (si.right  + gi.right);
  const contentH = cH - (si.top  + gi.top)  - (si.bottom + gi.bottom);

  const slotIndex = nodes.filter(
    (n) => n.parentId === container.id && getBandSide(n) === side,
  ).length;

  return {
    parentId: container.id,
    position: getBandNodePosition(side, slotIndex, contentW, contentH),
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
