import type { Edge } from "@xyflow/react";
import type {
  AppEdge,
  AppNode,
  AzSyncEdgeData,
  AzSyncNodeData,
  NetworkContainerNodeData,
} from "@/types/flow";
import {
  getAbsolutePosition,
  getNodeSize,
  isAzNode,
  isNetworkContainerNode,
  isSubnetNode,
  orderNodesForSubflows,
} from "@/lib/graph-utils";

type FlowState = {
  nodes: AppNode[];
  edges: AppEdge[];
};

function getSyncNodeData(node: AppNode) {
  return node.data as typeof node.data & AzSyncNodeData;
}

function getSyncEdgeData(edge: AppEdge) {
  return (edge.data ?? {}) as AzSyncEdgeData;
}

function withNodeSyncData(
  node: AppNode,
  data: AzSyncNodeData,
): AppNode {
  return {
    ...node,
    data: {
      ...node.data,
      ...data,
    },
  };
}

function stripNodeSyncData(node: AppNode): AppNode {
  const { syncGroupId, syncSourceAzId, syncRole, ...data } =
    getSyncNodeData(node);
  void syncGroupId;
  void syncSourceAzId;
  void syncRole;
  return { ...node, data };
}

function withEdgeSyncData(
  edge: AppEdge,
  data: AzSyncEdgeData,
): AppEdge {
  return {
    ...edge,
    data: {
      ...(edge.data ?? {}),
      ...data,
    },
  };
}

function stripEdgeSyncData(edge: AppEdge): AppEdge {
  const { syncGroupId, syncSourceAzId, syncRole, ...data } =
    getSyncEdgeData(edge);
  void syncGroupId;
  void syncSourceAzId;
  void syncRole;
  return Object.keys(data).length ? { ...edge, data } : { ...edge, data: undefined };
}

function nodeSyncGroupId(node: AppNode) {
  return getSyncNodeData(node).syncGroupId;
}

function edgeSyncGroupId(edge: AppEdge) {
  return getSyncEdgeData(edge).syncGroupId;
}

function isSyncableNode(node: AppNode) {
  return !isNetworkContainerNode(node);
}

export function findAzAncestor(
  node: AppNode,
  nodesById: Map<string, AppNode>,
) {
  let currentId = node.parentId;

  while (currentId) {
    const current = nodesById.get(currentId);
    if (!current) return null;
    if (isAzNode(current)) return current;
    currentId = current.parentId;
  }

  return null;
}

function getSiblingAzs(az: AppNode, nodes: AppNode[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return nodes
    .filter((node) => isAzNode(node) && node.parentId === az.parentId)
    .sort((a, b) => {
      const aPos = getAbsolutePosition(a, nodesById);
      const bPos = getAbsolutePosition(b, nodesById);
      return aPos.x - bPos.x || aPos.y - bPos.y || a.id.localeCompare(b.id);
    });
}

function getSyncedSiblingAzs(az: AppNode, nodes: AppNode[]) {
  return getSiblingAzs(az, nodes).filter(
    (node) => (node.data as NetworkContainerNodeData).synced,
  );
}

function getAzContentNodeIds(azId: string, nodes: AppNode[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const ids = new Set<string>();

  for (const node of nodes) {
    if (!isSyncableNode(node)) continue;
    const az = findAzAncestor(node, nodesById);
    if (az?.id === azId) ids.add(node.id);
  }

  return ids;
}

function getAzContentNodes(azId: string, nodes: AppNode[]) {
  const contentIds = getAzContentNodeIds(azId, nodes);
  return nodes.filter((node) => contentIds.has(node.id));
}

function edgeIsInternalToAz(edge: AppEdge, azId: string, nodes: AppNode[]) {
  const contentIds = getAzContentNodeIds(azId, nodes);
  return contentIds.has(edge.source) && contentIds.has(edge.target);
}

function getSubnetIndex(subnetId: string, azId: string, nodes: AppNode[]) {
  return nodes
    .filter((node) => node.parentId === azId && isSubnetNode(node))
    .sort((a, b) => a.position.y - b.position.y || a.id.localeCompare(b.id))
    .findIndex((node) => node.id === subnetId);
}

function getEquivalentParentId(
  sourceNode: AppNode,
  sourceAz: AppNode,
  targetAz: AppNode,
  nodes: AppNode[],
) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const directParent = sourceNode.parentId
    ? nodesById.get(sourceNode.parentId)
    : null;

  if (directParent && isSubnetNode(directParent)) {
    const subnetIndex = getSubnetIndex(directParent.id, sourceAz.id, nodes);
    const targetSubnets = nodes
      .filter((node) => node.parentId === targetAz.id && isSubnetNode(node))
      .sort((a, b) => a.position.y - b.position.y || a.id.localeCompare(b.id));
    return targetSubnets[subnetIndex]?.id ?? targetAz.id;
  }

  return targetAz.id;
}

function getEquivalentPosition(
  sourceNode: AppNode,
  sourceParentId: string | undefined,
  targetParentId: string,
  nodes: AppNode[],
) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const sourceParent = sourceParentId ? nodesById.get(sourceParentId) : null;
  const targetParent = nodesById.get(targetParentId);

  if (!sourceParent || !targetParent) {
    return sourceNode.position;
  }

  const sourceSize = getNodeSize(sourceParent);
  const targetSize = getNodeSize(targetParent);
  const xRatio = sourceSize.width > 0 ? sourceNode.position.x / sourceSize.width : 0;
  const yRatio =
    sourceSize.height > 0 ? sourceNode.position.y / sourceSize.height : 0;

  return {
    x: xRatio * targetSize.width,
    y: yRatio * targetSize.height,
  };
}

function cloneNodeForAz(
  sourceNode: AppNode,
  sourceAz: AppNode,
  targetAz: AppNode,
  nodes: AppNode[],
  syncGroupId: string,
): AppNode {
  const parentId = getEquivalentParentId(sourceNode, sourceAz, targetAz, nodes);

  return {
    ...sourceNode,
    id: `${syncGroupId}__${targetAz.id}`,
    parentId,
    selected: false,
    position: getEquivalentPosition(sourceNode, sourceNode.parentId, parentId, nodes),
    data: {
      ...sourceNode.data,
      syncGroupId,
      syncSourceAzId: sourceAz.id,
      syncRole: "mirror",
    },
  };
}

function getNodeByAzForGroup(nodes: AppNode[], groupId: string) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const result = new Map<string, AppNode>();

  for (const node of nodes) {
    if (nodeSyncGroupId(node) !== groupId) continue;
    const az = findAzAncestor(node, nodesById);
    if (az) result.set(az.id, node);
  }

  return result;
}

function buildInternalEdgeCopies(
  edge: AppEdge,
  sourceAz: AppNode,
  targetAzs: AppNode[],
  nodes: AppNode[],
) {
  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);
  const sourceGroupId = sourceNode ? nodeSyncGroupId(sourceNode) : undefined;
  const targetGroupId = targetNode ? nodeSyncGroupId(targetNode) : undefined;

  if (!sourceGroupId || !targetGroupId) return [];

  const sourceByAz = getNodeByAzForGroup(nodes, sourceGroupId);
  const targetByAz = getNodeByAzForGroup(nodes, targetGroupId);
  const edgeGroupId = edgeSyncGroupId(edge) ?? `edge:${edge.id}`;

  return targetAzs
    .filter((az) => az.id !== sourceAz.id)
    .flatMap((az) => {
      const source = sourceByAz.get(az.id);
      const target = targetByAz.get(az.id);
      if (!source || !target) return [];

      return {
        ...edge,
        id: `${edgeGroupId}__${az.id}`,
        source: source.id,
        target: target.id,
        selected: false,
        data: {
          ...(edge.data ?? {}),
          syncGroupId: edgeGroupId,
          syncSourceAzId: sourceAz.id,
          syncRole: "mirror",
        },
      };
    });
}

export function enableAzSync(azId: string, nodes: AppNode[], edges: AppEdge[]) {
  const requestedAz = nodes.find((node) => node.id === azId && isAzNode(node));
  if (!requestedAz) return { nodes, edges };

  const siblingAzs = getSiblingAzs(requestedAz, nodes);
  const referenceAz = siblingAzs[0];
  if (!referenceAz) return { nodes, edges };

  const referenceContent = getAzContentNodes(referenceAz.id, nodes);
  const discardedAzIds = new Set(
    siblingAzs.filter((az) => az.id !== referenceAz.id).map((az) => az.id),
  );
  const siblingContentNodeIds = new Set<string>();
  const discardedNodeIds = new Set<string>();

  for (const siblingAz of siblingAzs) {
    for (const nodeId of getAzContentNodeIds(siblingAz.id, nodes)) {
      siblingContentNodeIds.add(nodeId);
    }
  }

  for (const azId of discardedAzIds) {
    for (const nodeId of getAzContentNodeIds(azId, nodes)) {
      discardedNodeIds.add(nodeId);
    }
  }

  const referenceGroupByNodeId = new Map(
    referenceContent.map((node) => [
      node.id,
      nodeSyncGroupId(node) ?? `node:${node.id}`,
    ]),
  );

  const nextNodes = nodes
    .filter((node) => !discardedNodeIds.has(node.id))
    .map((node) => {
      if (isAzNode(node) && node.parentId === referenceAz.parentId) {
        return { ...node, data: { ...node.data, synced: true } };
      }

      const groupId = referenceGroupByNodeId.get(node.id);
      if (!groupId) return node;

      return withNodeSyncData(node, {
        syncGroupId: groupId,
        syncSourceAzId: referenceAz.id,
        syncRole: "source",
      });
    });

  const syncedReferenceContent = nextNodes.filter((node) =>
    referenceGroupByNodeId.has(node.id),
  );

  for (const sourceNode of syncedReferenceContent) {
    const groupId = nodeSyncGroupId(sourceNode);
    if (!groupId) continue;

    for (const targetAz of siblingAzs) {
      if (targetAz.id === referenceAz.id) continue;
      nextNodes.push(
        cloneNodeForAz(sourceNode, referenceAz, targetAz, nextNodes, groupId),
      );
    }
  }

  const referenceInternalEdges = edges.filter((edge) =>
    edgeIsInternalToAz(edge, referenceAz.id, nodes),
  );
  const referenceEdgeIds = new Set(referenceInternalEdges.map((edge) => edge.id));
  let nextEdges = edges
    .filter(
      (edge) =>
        !discardedNodeIds.has(edge.source) &&
        !discardedNodeIds.has(edge.target) &&
        !(
          edgeSyncGroupId(edge) &&
          !referenceEdgeIds.has(edge.id) &&
          (siblingContentNodeIds.has(edge.source) ||
            siblingContentNodeIds.has(edge.target))
        ),
    )
    .map((edge) => {
      if (!referenceEdgeIds.has(edge.id)) return edge;
      return withEdgeSyncData(edge, {
        syncGroupId: edgeSyncGroupId(edge) ?? `edge:${edge.id}`,
        syncSourceAzId: referenceAz.id,
        syncRole: "source",
      });
    });

  const syncedEdges = nextEdges.filter((edge) => referenceEdgeIds.has(edge.id));
  for (const edge of syncedEdges) {
    nextEdges = [
      ...nextEdges,
      ...buildInternalEdgeCopies(edge, referenceAz, siblingAzs, nextNodes),
    ];
  }

  return {
    nodes: orderNodesForSubflows(nextNodes),
    edges: nextEdges,
  };
}

export function disableAzSync(azId: string, nodes: AppNode[], edges: AppEdge[]) {
  const requestedAz = nodes.find((node) => node.id === azId && isAzNode(node));
  if (!requestedAz) return { nodes, edges };

  const siblingAzIds = new Set(getSiblingAzs(requestedAz, nodes).map((az) => az.id));
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const nodeIdsInSiblingAzs = new Set<string>();

  const nextNodes = nodes.map((node) => {
    if (isAzNode(node) && siblingAzIds.has(node.id)) {
      return { ...node, data: { ...node.data, synced: false } };
    }

    const az = findAzAncestor(node, nodesById);
    if (az && siblingAzIds.has(az.id)) {
      nodeIdsInSiblingAzs.add(node.id);
      return stripNodeSyncData(node);
    }

    return node;
  });

  const nextEdges = edges.map((edge) => {
    if (
      nodeIdsInSiblingAzs.has(edge.source) &&
      nodeIdsInSiblingAzs.has(edge.target)
    ) {
      return stripEdgeSyncData(edge);
    }

    return edge;
  });

  return { nodes: nextNodes, edges: nextEdges };
}

export function addNodeWithAzSync(newNode: AppNode, nodes: AppNode[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const az = findAzAncestor(newNode, nodesById);

  if (!az || !(az.data as NetworkContainerNodeData).synced) {
    return orderNodesForSubflows([...nodes, newNode]);
  }

  const siblingAzs = getSyncedSiblingAzs(az, nodes);
  const syncGroupId = `node:${newNode.id}`;
  const sourceNode = withNodeSyncData(newNode, {
    syncGroupId,
    syncSourceAzId: az.id,
    syncRole: "source",
  });
  const result = [...nodes, sourceNode];

  for (const siblingAz of siblingAzs) {
    if (siblingAz.id === az.id) continue;
    result.push(cloneNodeForAz(sourceNode, az, siblingAz, result, syncGroupId));
  }

  return orderNodesForSubflows(result);
}

export function syncNodeGroupPosition(nodeId: string, nodes: AppNode[]) {
  const sourceNode = nodes.find((node) => node.id === nodeId);
  if (!sourceNode || !nodeSyncGroupId(sourceNode)) return nodes;

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const sourceAz = findAzAncestor(sourceNode, nodesById);
  if (!sourceAz || !(sourceAz.data as NetworkContainerNodeData).synced) {
    return nodes;
  }

  const groupId = nodeSyncGroupId(sourceNode);
  const siblingAzs = getSyncedSiblingAzs(sourceAz, nodes);
  const sourceParentId = sourceNode.parentId;

  return orderNodesForSubflows(
    nodes.map((node) => {
      if (node.id === sourceNode.id) {
        return withNodeSyncData(node, {
          syncGroupId: groupId,
          syncSourceAzId: sourceAz.id,
          syncRole: "source",
        });
      }

      if (nodeSyncGroupId(node) !== groupId) return node;
      const targetAz = siblingAzs.find((az) => {
        const nodeAz = findAzAncestor(node, nodesById);
        return nodeAz?.id === az.id;
      });
      if (!targetAz) return node;

      const parentId = getEquivalentParentId(sourceNode, sourceAz, targetAz, nodes);

      return withNodeSyncData(
        {
          ...node,
          parentId,
          position: getEquivalentPosition(sourceNode, sourceParentId, parentId, nodes),
        },
        {
          syncGroupId: groupId,
          syncSourceAzId: sourceAz.id,
          syncRole: "mirror",
        },
      );
    }),
  );
}

export function removeSyncedNodes(
  removedNodeIds: string[],
  previousNodes: AppNode[],
  nextNodes: AppNode[],
  edges: AppEdge[],
) {
  const removedGroups = new Set<string>();
  const nodeIdsToRemove = new Set(removedNodeIds);

  for (const nodeId of removedNodeIds) {
    const node = previousNodes.find((item) => item.id === nodeId);
    const groupId = node ? nodeSyncGroupId(node) : undefined;
    if (groupId) removedGroups.add(groupId);
  }

  if (removedGroups.size) {
    for (const node of previousNodes) {
      const groupId = nodeSyncGroupId(node);
      if (groupId && removedGroups.has(groupId)) {
        nodeIdsToRemove.add(node.id);
      }
    }
  }

  const nodes = nextNodes.filter((node) => !nodeIdsToRemove.has(node.id));
  const edgeGroupsToRemove = new Set<string>();

  for (const edge of edges) {
    if (nodeIdsToRemove.has(edge.source) || nodeIdsToRemove.has(edge.target)) {
      const groupId = edgeSyncGroupId(edge);
      if (groupId) edgeGroupsToRemove.add(groupId);
    }
  }

  return {
    nodes,
    edges: edges.filter((edge) => {
      const groupId = edgeSyncGroupId(edge);
      return (
        !nodeIdsToRemove.has(edge.source) &&
        !nodeIdsToRemove.has(edge.target) &&
        (!groupId || !edgeGroupsToRemove.has(groupId))
      );
    }),
  };
}

export function removeSyncedEdges(
  removedEdgeIds: string[],
  previousEdges: AppEdge[],
  nextEdges: AppEdge[],
) {
  const removedGroups = new Set<string>();

  for (const edgeId of removedEdgeIds) {
    const edge = previousEdges.find((item) => item.id === edgeId);
    const groupId = edge ? edgeSyncGroupId(edge) : undefined;
    if (groupId) removedGroups.add(groupId);
  }

  if (!removedGroups.size) return nextEdges;

  return nextEdges.filter((edge) => {
    const groupId = edgeSyncGroupId(edge);
    return !groupId || !removedGroups.has(groupId);
  });
}

export function addEdgeWithAzSync(edge: AppEdge, nodes: AppNode[], edges: AppEdge[]) {
  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);
  const sourceGroupId = sourceNode ? nodeSyncGroupId(sourceNode) : undefined;
  const targetGroupId = targetNode ? nodeSyncGroupId(targetNode) : undefined;

  if (!sourceNode || !targetNode || !sourceGroupId || !targetGroupId) {
    return [...edges, edge];
  }

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const sourceAz = findAzAncestor(sourceNode, nodesById);
  const targetAz = findAzAncestor(targetNode, nodesById);
  if (!sourceAz || sourceAz.id !== targetAz?.id) return [...edges, edge];
  if (!(sourceAz.data as NetworkContainerNodeData).synced) return [...edges, edge];

  const syncedEdge = withEdgeSyncData(edge, {
    syncGroupId: `edge:${edge.id}`,
    syncSourceAzId: sourceAz.id,
    syncRole: "source",
  });

  return [
    ...edges,
    syncedEdge,
    ...buildInternalEdgeCopies(
      syncedEdge,
      sourceAz,
      getSyncedSiblingAzs(sourceAz, nodes),
      nodes,
    ),
  ];
}

export function updateSyncedNodeGroup(
  nodeId: string,
  nodes: AppNode[],
  update: (node: AppNode) => AppNode,
) {
  const node = nodes.find((item) => item.id === nodeId);
  const groupId = node ? nodeSyncGroupId(node) : undefined;
  if (!groupId) return nodes.map((item) => (item.id === nodeId ? update(item) : item));

  return nodes.map((item) =>
    nodeSyncGroupId(item) === groupId ? update(item) : item,
  );
}

export function updateSyncedEdgeGroup(
  edgeId: string,
  edges: AppEdge[],
  update: (edge: Edge) => AppEdge,
) {
  const edge = edges.find((item) => item.id === edgeId);
  const groupId = edge ? edgeSyncGroupId(edge) : undefined;
  if (!groupId) return edges.map((item) => (item.id === edgeId ? update(item) : item));

  return edges.map((item) =>
    edgeSyncGroupId(item) === groupId ? update(item) : item,
  );
}

export function toggleAzSyncState(
  azId: string,
  synced: boolean,
  nodes: AppNode[],
  edges: AppEdge[],
): FlowState {
  return synced
    ? enableAzSync(azId, nodes, edges)
    : disableAzSync(azId, nodes, edges);
}
