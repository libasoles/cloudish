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
  az: 3,        // availability zone max
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
  az: "right",
  subnet: "right",  // shouldn't be needed but safe fallback
};

// Edge-service ids that should prefer the left side when in the central zone
const EDGE_SERVICE_IDS = new Set(["api-gateway", "cloudfront", "route53", "waf"]);

// The side a service lands on when no drop position expresses a preference
// (click-to-add, search add). Entry-point services go left (diagrams flow
// left → right); storage/data services go right.
export function getPreferredBandSide(
  scope: PlacementScope,
  serviceId?: string,
): BandSide {
  if (serviceId && EDGE_SERVICE_IDS.has(serviceId)) return "left";
  return SCOPE_DEFAULT_SIDE[scope];
}

// Border-proximity component of side resolution: returns the side whose 18%
// edge zone contains the point, or null when the point is in the central zone.
// Callers that must distinguish "user pointed at an edge" from "fall back to
// the service preference" use this directly.
export function resolveBorderSide(
  dropAbsCenter: { x: number; y: number },
  allowedParentRect: Rect,
): BandSide | null {
  const { x, y, width, height } = allowedParentRect;

  const thresholdX = width * BORDER_THRESHOLD;
  const thresholdY = height * BORDER_THRESHOLD;

  const relX = dropAbsCenter.x - x;
  const relY = dropAbsCenter.y - y;

  // Check in priority order: top, bottom, left, right
  if (relY < thresholdY) return "top";
  if (relY > height - thresholdY) return "bottom";
  if (relX < thresholdX) return "left";
  if (relX > width - thresholdX) return "right";
  return null;
}

export function resolveBandSide(
  dropAbsCenter: { x: number; y: number },
  allowedParentRect: Rect,
  scope: PlacementScope,
  serviceId?: string,
): BandSide {
  return (
    resolveBorderSide(dropAbsCenter, allowedParentRect) ??
    getPreferredBandSide(scope, serviceId)
  );
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
//
// Uses the actual bounding box of band node positions rather than assuming a fixed
// stacking order. This lets users freely reposition band nodes (e.g. side-by-side)
// and have the container adapt to whatever arrangement they created.
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

  // Content edges in container-relative space
  const contentLeft        = oldSi.left + gi.left;
  const contentTop         = oldSi.top  + gi.top;
  const contentRightEdge   = contentLeft + contentW;
  const contentBottomEdge  = contentTop  + contentH;

  const maxNodeWidth = (side: BandSide) =>
    Math.max(0, ...bandNodesBySide[side].map((n) => getBandNodeVisualSize(n).width));
  const maxNodeHeight = (side: BandSide) =>
    Math.max(0, ...bandNodesBySide[side].map((n) => getBandNodeVisualSize(n).height));

  // Position-based bounding extent helpers
  const xExtent = (ns: AppNode[]) =>
    ns.length
      ? Math.max(...ns.map((n) => n.position.x + getBandNodeVisualSize(n).width)) + BAND_PAD
      : 0;
  const yExtent = (ns: AppNode[]) =>
    ns.length
      ? Math.max(...ns.map((n) => n.position.y + getBandNodeVisualSize(n).height)) + BAND_PAD
      : 0;
  const xMinExtent = (ns: AppNode[]) =>
    ns.length
      ? Math.min(...ns.map((n) => n.position.x)) - BAND_PAD
      : 0;
  const yMinExtent = (ns: AppNode[]) =>
    ns.length
      ? Math.min(...ns.map((n) => n.position.y)) - BAND_PAD
      : 0;

  // Right band: at least one column wide; widens when nodes are placed side-by-side
  const rightW = bandNodesBySide.right.length > 0
    ? Math.max(
        BAND_PAD + maxNodeWidth("right") + BAND_PAD,
        xExtent(bandNodesBySide.right) - contentRightEdge,
      )
    : 0;

  // Left band: at least one column wide; widens for side-by-side horizontal arrangement
  const leftW = bandNodesBySide.left.length > 0
    ? Math.max(
        BAND_PAD + maxNodeWidth("left") + BAND_PAD,
        contentLeft - xMinExtent(bandNodesBySide.left),
      )
    : 0;

  // Top band: at least one row tall; taller for vertical arrangement
  const topH = bandNodesBySide.top.length > 0
    ? Math.max(
        BAND_PAD + maxNodeHeight("top") + BAND_PAD,
        contentTop - yMinExtent(bandNodesBySide.top),
      )
    : 0;

  // Bottom band: at least one row tall; taller for vertical arrangement
  const botH = bandNodesBySide.bottom.length > 0
    ? Math.max(
        BAND_PAD + maxNodeHeight("bottom") + BAND_PAD,
        yExtent(bandNodesBySide.bottom) - contentBottomEdge,
      )
    : 0;

  // Right/left bands may extend below content bottom (additional rows of nodes)
  const heightOverflow = Math.max(
    0,
    bandNodesBySide.right.length > 0 ? yExtent(bandNodesBySide.right) - contentBottomEdge : 0,
    bandNodesBySide.left.length  > 0 ? yExtent(bandNodesBySide.left)  - contentBottomEdge : 0,
  );

  // Top/bottom bands may extend past content right edge (additional columns of nodes)
  const widthOverflow = Math.max(
    0,
    bandNodesBySide.top.length    > 0 ? xExtent(bandNodesBySide.top)    - contentRightEdge : 0,
    bandNodesBySide.bottom.length > 0 ? xExtent(bandNodesBySide.bottom) - contentRightEdge : 0,
  );

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

export function areInsetsEqual(
  a: ContainerInsets | undefined,
  b: ContainerInsets,
): boolean {
  return (
    (a?.top ?? 0) === b.top &&
    (a?.right ?? 0) === b.right &&
    (a?.bottom ?? 0) === b.bottom &&
    (a?.left ?? 0) === b.left
  );
}

// ─── Container inset frame ────────────────────────────────────────────────────

const ZERO_INSETS: ContainerInsets = { top: 0, right: 0, bottom: 0, left: 0 };

// Derived container-relative geometry shared by all band placement helpers.
type ContainerInsetFrame = {
  cW: number;
  cH: number;
  si: ContainerInsets;
  gi: ContainerInsets;
  contentLeft: number;
  contentTop: number;
  contentRight: number;
  contentBottom: number;
  contentW: number;
  contentH: number;
};

function getContainerInsetFrame(container: AppNode): ContainerInsetFrame {
  const { width: cW, height: cH } = getNodeSize(container);
  const data = container.data as NetworkContainerNodeData;
  const si: ContainerInsets = data.scopeInsets ?? ZERO_INSETS;
  const gi: ContainerInsets = data.gatewayInsets ?? ZERO_INSETS;
  const contentLeft = si.left + gi.left;
  const contentTop = si.top + gi.top;
  const contentW = cW - contentLeft - (si.right + gi.right);
  const contentH = cH - contentTop - (si.bottom + gi.bottom);
  return {
    cW,
    cH,
    si,
    gi,
    contentLeft,
    contentTop,
    contentRight: contentLeft + contentW,
    contentBottom: contentTop + contentH,
    contentW,
    contentH,
  };
}

// Absolute rect of the container's content box (container minus scope + gateway
// insets). Use this — not the full container rect — to resolve the band side
// during drag: applyInsetResizeOnly keeps the content box absolutely fixed while
// bands grow, so the 18% border thresholds don't move with the growth they
// themselves triggered (which would make the resolved side oscillate).
export function getContentBoxRect(
  container: AppNode,
  nodesById: Map<string, AppNode>,
): Rect {
  const abs = getAbsolutePosition(container, nodesById);
  const frame = getContainerInsetFrame(container);
  return {
    x: abs.x + frame.contentLeft,
    y: abs.y + frame.contentTop,
    width: frame.contentW,
    height: frame.contentH,
  };
}

// ─── Virtual band membership (live growth during drag) ──────────────────────

export const BAND_DRAG_GHOST_ID = "__band-drag-ghost__";

export type VirtualBandMember = {
  // Existing node being dragged; omit for a sidebar-drag ghost.
  nodeId?: string;
  // Service id of the dragged tool — getBandNodeVisualSize reads it (API Gateway width).
  serviceId?: string;
  // Live pointer-derived node top-left in absolute flow coordinates.
  absTopLeft: { x: number; y: number };
  side: BandSide;
};

// Returns a copy of the node list where the dragged node is VIRTUALLY a band
// child of the container: reparented with bandSide set to the hovered side,
// or — when no nodeId is given — an appended ghost node. The virtual position
// is where the node WOULD land if dropped now (clampPositionToBand reach), not
// the raw pointer position: feeding unbounded pointer coordinates would make
// the band chase the node outward indefinitely, growing the container under it
// and never letting it escape. Within the reach, the raw position passes
// through — that is what makes the container resize IN REAL TIME while a node
// is repositioned inside a band that already has nodes. Feed the result to
// getScopeBandInsets only; never store it.
export function withVirtualBandMember(
  nodes: AppNode[],
  containerId: string,
  member: VirtualBandMember,
): AppNode[] {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const container = nodesById.get(containerId);
  if (!container) return nodes;

  // Size source must match what getScopeBandInsets will measure: the real
  // node when dragging an existing one, the serviceId default for a ghost.
  const existing = member.nodeId ? nodesById.get(member.nodeId) : undefined;
  const { position } = clampPositionToBand(
    container,
    member.side,
    member.absTopLeft,
    nodes,
    existing ?? member.serviceId,
    member.nodeId,
  );

  if (existing) {
    return nodes.map((n) =>
      n.id === member.nodeId
        ? {
            ...n,
            parentId: containerId,
            position,
            data: { ...n.data, bandSide: member.side },
          }
        : n,
    );
  }

  const ghost = {
    id: BAND_DRAG_GHOST_ID,
    type: "awsService",
    parentId: containerId,
    position,
    data: { serviceId: member.serviceId, bandSide: member.side },
  } as AppNode;
  return [...nodes, ghost];
}

// ─── Placing a node into the band by drop position ───────────────────────────

// Keeps the node where the user dropped it, projected into the band's REACH:
// the area the band can grow to wrap. The cross-axis anchor sits just outside
// the content edge — the position getScopeBandInsets treats as the settled
// single column/row. The reach extends one column/row past the furthest OTHER
// node on the same side (plus a one-row overflow allowance past the far
// content edge), so when the band already has nodes the dragged one can be
// placed side-by-side or stacked beyond them and the container resizes to
// wrap it. Bounds derive only from the content box and the OTHER nodes'
// settled positions — never from the container's current (possibly grown)
// size — so live growth has a fixed point and cannot chase the node.
//
// `nodeOrServiceId` MUST be the same source getScopeBandInsets will measure
// (pass the AppNode for existing nodes): a size mismatch between the clamped
// position and the inset computation makes live growth diverge by the
// difference on every drag frame. `excludeNodeId` keeps the dragged node's
// own stored position from extending its own reach.
export function clampPositionToBand(
  container: AppNode,
  side: BandSide,
  absTopLeft: { x: number; y: number },
  nodes: AppNode[],
  nodeOrServiceId?: AppNode | string,
  excludeNodeId?: string,
): { parentId: string; position: { x: number; y: number } } {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const frame = getContainerInsetFrame(container);
  const { width: w, height: h } = getBandNodeVisualSize(nodeOrServiceId);

  const containerAbs = getAbsolutePosition(container, nodesById);
  const rel = {
    x: absTopLeft.x - containerAbs.x,
    y: absTopLeft.y - containerAbs.y,
  };

  const sameSide = nodes.filter(
    (n) =>
      n.parentId === container.id &&
      n.id !== excludeNodeId &&
      getBandSide(n) === side,
  );
  const otherMaxX = Math.max(
    ...sameSide.map((n) => n.position.x + getBandNodeVisualSize(n).width),
    -Infinity,
  );
  const otherMinX = Math.min(...sameSide.map((n) => n.position.x), Infinity);
  const otherMaxY = Math.max(
    ...sameSide.map((n) => n.position.y + getBandNodeVisualSize(n).height),
    -Infinity,
  );
  const otherMinY = Math.min(...sameSide.map((n) => n.position.y), Infinity);

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(Math.max(v, lo), Math.max(lo, hi));

  // Main axis: within the content span, extendable past the far edge by the
  // other nodes' overflow extent or a one-row/column allowance — both are
  // growth directions getScopeBandInsets supports (height/width overflow).
  const mainY = (v: number) =>
    clamp(
      v,
      frame.contentTop + BAND_PAD,
      Math.max(
        frame.contentBottom - BAND_PAD - h,
        frame.contentBottom,
        otherMaxY + BAND_PAD,
      ),
    );
  const mainX = (v: number) =>
    clamp(
      v,
      frame.contentLeft + BAND_PAD,
      Math.max(
        frame.contentRight - BAND_PAD - w,
        frame.contentRight,
        otherMaxX + BAND_PAD,
      ),
    );

  let position: { x: number; y: number };
  switch (side) {
    case "right":
      position = {
        x: clamp(
          rel.x,
          frame.contentRight + BAND_PAD,
          Math.max(frame.contentRight + BAND_PAD, otherMaxX + BAND_PAD),
        ),
        y: mainY(rel.y),
      };
      break;
    case "left":
      position = {
        x: clamp(
          rel.x,
          Math.min(frame.contentLeft - BAND_PAD - w, otherMinX - BAND_PAD - w),
          frame.contentLeft - BAND_PAD - w,
        ),
        y: mainY(rel.y),
      };
      break;
    case "top":
      position = {
        x: mainX(rel.x),
        y: clamp(
          rel.y,
          Math.min(frame.contentTop - BAND_PAD - h, otherMinY - BAND_PAD - h),
          frame.contentTop - BAND_PAD - h,
        ),
      };
      break;
    case "bottom":
      position = {
        x: mainX(rel.x),
        y: clamp(
          rel.y,
          frame.contentBottom + BAND_PAD,
          Math.max(frame.contentBottom + BAND_PAD, otherMaxY + BAND_PAD),
        ),
      };
      break;
  }

  return { parentId: container.id, position };
}

// ─── Centered band placement (click-to-add, no drop position) ────────────────

// Places a new band node centered along the container's content edge. If the
// center slot overlaps an existing band node, searches outward alternately
// (above/below or left/right) in node-size + BAND_PAD steps for the nearest
// free slot, falling back to one step past the occupied extent.
export function computeCenteredBandPlacement(
  container: AppNode,
  side: BandSide,
  nodes: AppNode[],
  serviceId?: string,
): { parentId: string; position: { x: number; y: number } } {
  const frame = getContainerInsetFrame(container);
  const { width: w, height: h } = getBandNodeVisualSize(serviceId);
  const vertical = side === "left" || side === "right";

  // Cross-axis: just outside the content edge — the settled column/row position.
  const cross =
    side === "right"  ? frame.contentRight + BAND_PAD :
    side === "left"   ? frame.contentLeft - BAND_PAD - w :
    side === "top"    ? frame.contentTop - BAND_PAD - h :
                        frame.contentBottom + BAND_PAD;

  const extent = vertical ? h : w;
  const mainLo = (vertical ? frame.contentTop : frame.contentLeft) + BAND_PAD;
  const mainHi = Math.max(
    mainLo,
    (vertical ? frame.contentBottom : frame.contentRight) - BAND_PAD - extent,
  );
  const center = vertical
    ? frame.contentTop + (frame.contentH - h) / 2
    : frame.contentLeft + (frame.contentW - w) / 2;

  const occupied = nodes
    .filter((n) => n.parentId === container.id && getBandSide(n) === side)
    .map((n) => {
      const size = getBandNodeVisualSize(n);
      const lo = vertical ? n.position.y : n.position.x;
      return { lo, hi: lo + (vertical ? size.height : size.width) };
    });

  const isFree = (v: number) =>
    v >= mainLo &&
    v <= mainHi &&
    occupied.every((iv) => v + extent <= iv.lo || v >= iv.hi);

  let main = Math.min(Math.max(center, mainLo), mainHi);
  if (!isFree(main)) {
    const step = extent + BAND_PAD;
    let found = false;
    for (let i = 1; i <= 50 && !found; i++) {
      for (const dir of [-1, 1]) {
        const candidate = main + dir * i * step;
        if (isFree(candidate)) {
          main = candidate;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      // Band is packed: extend past the occupied extent; getScopeBandInsets'
      // overflow terms grow the container on the follow-up redistribute.
      main = Math.max(mainLo, ...occupied.map((iv) => iv.hi)) + BAND_PAD;
    }
  }

  return {
    parentId: container.id,
    position: vertical ? { x: cross, y: main } : { x: main, y: cross },
  };
}

// ─── Band strip hit-testing at drop time ──────────────────────────────────────

// Returns the band side whose strip contains the given absolute point, or null
// when the point is in the content area (or outside the container). Strips only
// exist where scopeInsets are non-zero — live growth during drag guarantees that
// while hovering a band. On corner overlap the deepest penetration wins.
export function detectBandSideAtPosition(
  container: AppNode,
  absCenter: { x: number; y: number },
  nodes: AppNode[],
): BandSide | null {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const abs = getAbsolutePosition(container, nodesById);
  const { cW, cH, si } = getContainerInsetFrame(container);
  const relX = absCenter.x - abs.x;
  const relY = absCenter.y - abs.y;
  if (relX < 0 || relX > cW || relY < 0 || relY > cH) return null;

  const candidates: Array<{ side: BandSide; depth: number }> = [];
  if (si.left > 0 && relX <= si.left) {
    candidates.push({ side: "left", depth: si.left - relX });
  }
  if (si.right > 0 && relX >= cW - si.right) {
    candidates.push({ side: "right", depth: relX - (cW - si.right) });
  }
  if (si.top > 0 && relY <= si.top) {
    candidates.push({ side: "top", depth: si.top - relY });
  }
  if (si.bottom > 0 && relY >= cH - si.bottom) {
    candidates.push({ side: "bottom", depth: relY - (cH - si.bottom) });
  }
  if (!candidates.length) return null;

  candidates.sort((a, b) => b.depth - a.depth);
  return candidates[0].side;
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

// Applies pre-computed scopeInsets to a container and resizes it.
// Shifts all children (to keep their absolute positions when the container origin moves)
// EXCEPT draggedNodeId — React Flow owns that node's visual position during drag, and
// updating its stored position would cause a visual jump.
export function applyInsetResizeOnly(
  containerId: string,
  newScopeInsets: ContainerInsets,
  nodes: AppNode[],
  draggedNodeId?: string,
): AppNode[] {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const container = nodesById.get(containerId);
  if (!container || !isNetworkContainerNode(container)) return nodes;

  const data = container.data as NetworkContainerNodeData;
  const oldInsets: ContainerInsets = data.scopeInsets   ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const gateInsets: ContainerInsets = data.gatewayInsets ?? { top: 0, right: 0, bottom: 0, left: 0 };

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
  const baseW = cW - totalOld.left - totalOld.right;
  const baseH = cH - totalOld.top  - totalOld.bottom;
  const newW = baseW + totalNew.left + totalNew.right;
  const newH = baseH + totalNew.top  + totalNew.bottom;

  // Shift container position to keep content area fixed (same as redistributeScopeBandForContainer)
  const absPos = getAbsolutePosition(container, nodesById);
  const newAbsX = absPos.x - (totalNew.left - totalOld.left);
  const newAbsY = absPos.y - (totalNew.top  - totalOld.top);
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
    // Keep all other children at the same absolute position by compensating for the
    // container's origin shift — but skip the dragged node (React Flow owns it during drag).
    if (n.parentId === containerId && n.id !== draggedNodeId && (deltaX !== 0 || deltaY !== 0)) {
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

// After a container's band grows, walk up its ancestor chain and expand each ancestor
// that is now too small to contain the grown child (including the child's bands).
// Interior children of the ancestor keep their positions; the ancestor's right/bottom
// edge extends outward. Ancestor band nodes are re-anchored via redistributeScopeBandForContainer.
export function propagateBandGrowthToAncestors(
  containerId: string,
  nodes: AppNode[],
): AppNode[] {
  let result = nodes;
  let childId = containerId;

  for (;;) {
    const nodesById = new Map(result.map((n) => [n.id, n]));
    const child = nodesById.get(childId);
    if (!child || !child.parentId) break;

    const ancestor = nodesById.get(child.parentId);
    if (!ancestor || !isNetworkContainerNode(ancestor)) break;

    const ancData = ancestor.data as NetworkContainerNodeData;
    const ancGi: ContainerInsets = ancData.gatewayInsets ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const ancSi: ContainerInsets = ancData.scopeInsets   ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const { width: ancW, height: ancH } = getNodeSize(ancestor);

    // Content area of ancestor (excluding insets)
    const contentLeft  = ancSi.left  + ancGi.left;
    const contentTop   = ancSi.top   + ancGi.top;
    const contentW = ancW - (ancSi.left + ancGi.left) - (ancSi.right  + ancGi.right);
    const contentH = ancH - (ancSi.top  + ancGi.top)  - (ancSi.bottom + ancGi.bottom);

    // Child's extent within ancestor space (child position is relative to ancestor)
    const { width: childW, height: childH } = getNodeSize(child);
    const childRight  = child.position.x + childW;
    const childBottom = child.position.y + childH;

    const neededContentW = childRight  - contentLeft;
    const neededContentH = childBottom - contentTop;

    const growW = Math.max(0, neededContentW - contentW);
    const growH = Math.max(0, neededContentH - contentH);

    if (growW === 0 && growH === 0) break; // no overflow, stop propagation

    // Grow the ancestor's content area rightward/downward (position stays fixed)
    const newAncW = ancW + growW;
    const newAncH = ancH + growH;

    result = result.map((n) => {
      if (n.id !== ancestor.id) return n;
      return {
        ...n,
        width: newAncW,
        height: newAncH,
        style: { ...n.style, width: newAncW, height: newAncH },
      };
    });

    // Re-anchor the ancestor's own band nodes now that its content area changed
    result = redistributeScopeBandForContainer(ancestor.id, result);

    childId = ancestor.id;
  }

  return result;
}

// Like redistributeScopeAffectedLayouts but also propagates band growth to ancestors.
export function redistributeScopeAffectedLayoutsWithPropagation(nodes: AppNode[]): AppNode[] {
  let result = nodes;
  const containerIds = result
    .filter((n) => isRegionNode(n) || isVpcNode(n))
    .map((n) => n.id);

  for (const id of containerIds) {
    result = redistributeScopeBandForContainer(id, result);
    result = propagateBandGrowthToAncestors(id, result);
  }
  return result;
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
