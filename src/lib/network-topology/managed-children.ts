import type { AppEdge, AppNode, NetworkContainerType } from "@/types/flow";
import { findAzAncestor, toggleAzSyncState } from "@/lib/az-sync";
import {
  isVpcNode,
  isAzNode,
  isSubnetNode,
  buildVpcNodes,
  buildAzNodes,
  buildSubnetNodes,
  orderNodesForSubflows,
  getAbsolutePosition,
  getNodeSize,
  getNetworkContainerType,
  resizeContainerNode,
} from "@/lib/graph-utils";

type ManagedChildCountField = "numberOfVPCs" | "numberOfAZs" | "numberOfSubnets";

type ManagedChildConfig = {
  countField: ManagedChildCountField;
  isChildNode: (n: AppNode) => boolean;
  // Axis children are laid out along: columns ("x") or rows ("y")
  layoutAxis: "x" | "y";
  buildChildren: (
    parentId: string,
    parentW: number,
    parentH: number,
    count: number,
    labelFn?: (subnetType: string, index: number) => string,
  ) => AppNode[];
};

const MANAGED_CHILD_CONFIGS = {
  region: {
    countField: "numberOfVPCs",
    isChildNode: isVpcNode,
    layoutAxis: "x",
    buildChildren: (id, w, h, count) => buildVpcNodes(id, w, h, count),
  },
  vpc: {
    countField: "numberOfAZs",
    isChildNode: isAzNode,
    layoutAxis: "x",
    buildChildren: (id, w, h, count) => buildAzNodes(id, w, h, count),
  },
  az: {
    countField: "numberOfSubnets",
    isChildNode: isSubnetNode,
    layoutAxis: "y",
    buildChildren: (id, w, h, count, labelFn) =>
      buildSubnetNodes(
        id,
        w,
        h,
        count,
        labelFn ?? ((type, i) => `Subnet ${type} ${i}`),
      ),
  },
} satisfies Record<Exclude<NetworkContainerType, "aws" | "subnet" | "asg" | "generic">, ManagedChildConfig>;

// Build only the children appended beyond existingCount. Reuses the build
// functions by taking the tail of a full-count layout — the geometry is
// provisional (the redistribute pass at the end of setManagedChildCount sets
// the real positions/sizes), but labels keep numbering from the total count.
// Ids that collide with an existing node are remapped to the next free suffix.
function buildAppendedChildren(
  config: ManagedChildConfig,
  parentId: string,
  parentW: number,
  parentH: number,
  existingCount: number,
  count: number,
  subnetLabelFn: (subnetType: string, index: number) => string,
  usedIds: Set<string>,
): AppNode[] {
  const template = config.buildChildren(
    parentId,
    parentW,
    parentH,
    count,
    subnetLabelFn,
  );

  return template.slice(existingCount).map((node) => {
    if (!usedIds.has(node.id)) {
      usedIds.add(node.id);
      return node;
    }
    const prefix = node.id.replace(/-\d+$/, "");
    let suffix = 1;
    while (usedIds.has(`${prefix}-${suffix}`)) suffix++;
    const id = `${prefix}-${suffix}`;
    usedIds.add(id);
    return { ...node, id };
  });
}

export function setManagedChildCount(
  nodeId: string,
  count: number,
  prevNodes: AppNode[],
  edges: AppEdge[],
  subnetLabelFn: (subnetType: string, index: number) => string,
): { nodes: AppNode[]; edges: AppEdge[] } {
  const parent = prevNodes.find((n) => n.id === nodeId);
  if (!parent) return { nodes: prevNodes, edges };

  const containerType = getNetworkContainerType(parent);
  if (!containerType || !(containerType in MANAGED_CHILD_CONFIGS)) {
    return { nodes: prevNodes, edges };
  }

  const config =
    MANAGED_CHILD_CONFIGS[
      containerType as keyof typeof MANAGED_CHILD_CONFIGS
    ];
  const { width: parentW, height: parentH } = getNodeSize(parent);

  // The Inspector slider displays the count of ALL children of the managed
  // type — manual and auto-generated alike — so the adjustment must operate
  // over that same set or the displayed value jumps past the requested one.
  const existing = prevNodes
    .filter((n) => n.parentId === parent.id && config.isChildNode(n))
    .sort(
      (a, b) => a.position[config.layoutAxis] - b.position[config.layoutAxis],
    );

  const target = Math.max(0, count);
  if (target === existing.length) return { nodes: prevNodes, edges };

  let result: AppNode[];
  let nextEdges = edges;

  if (target > existing.length) {
    const appended = buildAppendedChildren(
      config,
      parent.id,
      parentW,
      parentH,
      existing.length,
      target,
      subnetLabelFn,
      new Set(prevNodes.map((n) => n.id)),
    );
    result = [...prevNodes, ...appended];
  } else {
    // Prefer removing children whose loss is invisible: empty auto-generated
    // first, then empty manual ones, and only then occupied children (last in
    // layout order first). Children of a removed container are re-parented to
    // the slider's container, keeping their absolute canvas positions.
    const hasContent = (id: string) =>
      prevNodes.some((n) => n.parentId === id);
    const managedEmpty = existing.filter(
      (n) => n.draggable === false && !hasContent(n.id),
    );
    const manualEmpty = existing.filter(
      (n) => n.draggable !== false && !hasContent(n.id),
    );
    const occupied = existing.filter((n) => hasContent(n.id));
    const removalOrder = [
      ...managedEmpty.slice().reverse(),
      ...manualEmpty.slice().reverse(),
      ...occupied.slice().reverse(),
    ];
    const removedIds = new Set(
      removalOrder.slice(0, existing.length - target).map((n) => n.id),
    );

    const nodesById = new Map(prevNodes.map((n) => [n.id, n]));
    const parentAbsPos = getAbsolutePosition(parent, nodesById);

    // Synced AZs hold copies of the same content, so a removed synced AZ's
    // sync-tracked nodes are deleted with it — re-parenting them to the VPC
    // would duplicate the subnets and the redistribute pass below would blow
    // them up to full-VPC width on top of the surviving AZs. Only when no
    // synced AZ survives is one copy kept (the one holding the sync sources),
    // re-parented like regular children so the content isn't lost.
    const isSyncedAz = (n: AppNode | undefined) =>
      !!n && isAzNode(n) && Boolean((n.data as { synced?: boolean }).synced);
    const azAncestorId = (n: AppNode) => findAzAncestor(n, nodesById)?.id;
    const removedSyncedAzIds = [...removedIds].filter((id) =>
      isSyncedAz(nodesById.get(id)),
    );
    const syncedAzSurvives = existing.some(
      (n) => !removedIds.has(n.id) && isSyncedAz(n),
    );
    let keptSyncedAzId: string | undefined;
    if (!syncedAzSurvives && removedSyncedAzIds.length) {
      const removedSyncedAzIdSet = new Set(removedSyncedAzIds);
      const sourceNode = prevNodes.find((n) => {
        if ((n.data as { syncRole?: string }).syncRole !== "source") return false;
        const azId = azAncestorId(n);
        return azId !== undefined && removedSyncedAzIdSet.has(azId);
      });
      keptSyncedAzId = (sourceNode && azAncestorId(sourceNode)) ?? removedSyncedAzIds[0];
    }
    const deletableAzIds = new Set(
      removedSyncedAzIds.filter((id) => id !== keptSyncedAzId),
    );
    const deletedContentIds = new Set<string>();
    const keptContentIds = new Set<string>();
    for (const n of prevNodes) {
      if (!(n.data as { syncGroupId?: string }).syncGroupId) continue;
      const azId = azAncestorId(n);
      if (azId === undefined) continue;
      if (deletableAzIds.has(azId)) deletedContentIds.add(n.id);
      else if (azId === keptSyncedAzId) keptContentIds.add(n.id);
    }
    const goneIds = new Set([...removedIds, ...deletedContentIds]);

    nextEdges = edges
      .filter(
        (e) =>
          !deletedContentIds.has(e.source) && !deletedContentIds.has(e.target),
      )
      .map((e) => {
        if (!keptContentIds.has(e.source) || !keptContentIds.has(e.target)) {
          return e;
        }
        const { syncGroupId, syncSourceAzId, syncRole, ...data } = (e.data ??
          {}) as Record<string, unknown>;
        void syncGroupId;
        void syncSourceAzId;
        void syncRole;
        return { ...e, data: Object.keys(data).length ? data : undefined };
      });

    result = prevNodes
      .filter((n) => !goneIds.has(n.id))
      .map((n) => {
        let next = n;
        if (n.parentId && goneIds.has(n.parentId)) {
          const absPos = getAbsolutePosition(n, nodesById);
          next = {
            ...n,
            parentId: parent.id,
            position: {
              x: absPos.x - parentAbsPos.x,
              y: absPos.y - parentAbsPos.y,
            },
          };
        }
        if (keptContentIds.has(n.id)) {
          const { syncGroupId, syncSourceAzId, syncRole, ...data } =
            next.data as Record<string, unknown>;
          void syncGroupId;
          void syncSourceAzId;
          void syncRole;
          next = { ...next, data } as AppNode;
        }
        return next;
      });
  }

  result = result.map((n) =>
    n.id === parent.id
      ? {
          ...n,
          data: {
            ...n.data,
            fields: {
              ...(n.data as { fields?: Record<string, unknown> }).fields,
              [config.countField]: target,
            },
          },
        }
      : n,
  );

  // Surviving and appended children alike get their final geometry here, so
  // a single remaining child always expands to fill the parent's content box.
  result = resizeContainerNode(parent.id, parentW, parentH, result);

  // When a VPC's AZ set changes while its AZs are synced, rebuild the sync
  // group on the redistributed geometry: appended AZs join the group and get
  // their mirrored content; with a single AZ left the group is dissolved.
  if (containerType === "vpc") {
    const azChildren = result.filter(
      (n) => n.parentId === parent.id && isAzNode(n),
    );
    const syncedAz = azChildren.find((n) =>
      Boolean((n.data as { synced?: boolean }).synced),
    );
    if (syncedAz) {
      const resynced = toggleAzSyncState(
        syncedAz.id,
        azChildren.length > 1,
        result,
        nextEdges,
      );
      result = resynced.nodes;
      nextEdges = resynced.edges;
    }
  }

  return { nodes: orderNodesForSubflows(result), edges: nextEdges };
}
