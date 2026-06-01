import { orderNodesForSubflows } from "@/lib/graph-utils";
import type { AppEdge, AppNode } from "@/types/flow";

const DUPLICATE_OFFSET = { x: 32, y: 32 };

function cloneValue<T>(value: T): T {
  return value == null ? value : structuredClone(value);
}

function makeUniqueId(baseId: string, usedIds: Set<string>) {
  let suffix = 1;
  let candidate = `${baseId}-copy`;

  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${baseId}-copy-${suffix}`;
  }

  usedIds.add(candidate);
  return candidate;
}

function getSelectedNodeTreeIds(nodes: AppNode[]) {
  const duplicateIds = new Set(
    nodes.filter((node) => node.selected).map((node) => node.id),
  );

  let addedDescendant = true;
  while (addedDescendant) {
    addedDescendant = false;

    for (const node of nodes) {
      if (
        node.parentId &&
        duplicateIds.has(node.parentId) &&
        !duplicateIds.has(node.id)
      ) {
        duplicateIds.add(node.id);
        addedDescendant = true;
      }
    }
  }

  return duplicateIds;
}

export function duplicateSelectedGraph(nodes: AppNode[], edges: AppEdge[]) {
  const duplicateIds = getSelectedNodeTreeIds(nodes);

  if (!duplicateIds.size) {
    return { nodes, edges };
  }

  const usedNodeIds = new Set(nodes.map((node) => node.id));
  const usedEdgeIds = new Set(edges.map((edge) => edge.id));
  const duplicateNodeIdBySourceId = new Map<string, string>();

  for (const node of nodes) {
    if (!duplicateIds.has(node.id)) continue;
    duplicateNodeIdBySourceId.set(node.id, makeUniqueId(node.id, usedNodeIds));
  }

  const nextNodes = nodes.map((node) => ({ ...node, selected: false }));
  const duplicatedNodes = nodes
    .filter((node) => duplicateIds.has(node.id))
    .map((node) => {
      const duplicatedId = duplicateNodeIdBySourceId.get(node.id);
      if (!duplicatedId) return node;

      const duplicatedParentId = node.parentId
        ? duplicateNodeIdBySourceId.get(node.parentId)
        : undefined;
      const parentId = duplicatedParentId ?? node.parentId;
      const shouldOffsetPosition = !duplicatedParentId;

      return {
        ...node,
        id: duplicatedId,
        parentId,
        selected: true,
        dragging: false,
        resizing: false,
        position: {
          x: node.position.x + (shouldOffsetPosition ? DUPLICATE_OFFSET.x : 0),
          y: node.position.y + (shouldOffsetPosition ? DUPLICATE_OFFSET.y : 0),
        },
        data: cloneValue(node.data),
        style: cloneValue(node.style),
      };
    });

  const duplicatedEdges = edges
    .filter(
      (edge) =>
        duplicateNodeIdBySourceId.has(edge.source) &&
        duplicateNodeIdBySourceId.has(edge.target),
    )
    .map((edge) => ({
      ...edge,
      id: makeUniqueId(edge.id, usedEdgeIds),
      source: duplicateNodeIdBySourceId.get(edge.source) ?? edge.source,
      target: duplicateNodeIdBySourceId.get(edge.target) ?? edge.target,
      selected: false,
      data: cloneValue(edge.data),
      style: cloneValue(edge.style),
    }));

  return {
    nodes: orderNodesForSubflows([...nextNodes, ...duplicatedNodes]),
    edges: [...edges.map((edge) => ({ ...edge, selected: false })), ...duplicatedEdges],
  };
}
