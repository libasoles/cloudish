import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { create } from "zustand";
import { initialNodes, initialEdges } from "@/data/initial-flow";
import {
  removeSyncedEdges,
  removeSyncedNodes,
  toggleAzSyncState,
} from "@/lib/az-sync";
import { getNetworkContainerType, resizeContainerNode } from "@/lib/graph-utils";
import type { AppNode, AppEdge, ContainerDropPreview } from "@/types/flow";

const MAX_HISTORY = 100;

type HistoryEntry = {
  before: { nodes: AppNode[]; edges: AppEdge[] };
};

type FlowStore = {
  nodes: AppNode[];
  edges: AppEdge[];
  history: HistoryEntry[];
  inspectorOpen: boolean;
  dropTargetNodeId: string | null;
  dropPreview: ContainerDropPreview | null;
  setNodes: (updater: AppNode[] | ((prev: AppNode[]) => AppNode[])) => void;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  setEdges: (updater: AppEdge[] | ((prev: AppEdge[]) => AppEdge[])) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  commitGraphChange: (
    updater: (state: { nodes: AppNode[]; edges: AppEdge[] }) => {
      nodes: AppNode[];
      edges: AppEdge[];
    }
  ) => void;
  undo: () => void;
  setInspectorOpen: (updater: boolean | ((prev: boolean) => boolean)) => void;
  setDropTargetNodeId: (id: string | null) => void;
  setDropPreview: (preview: ContainerDropPreview | null) => void;
  toggleAzSync: (azId: string, synced: boolean) => void;
};

function resizeChangedContainers(
  changes: NodeChange<AppNode>[],
  nodes: AppNode[],
) {
  return changes.reduce((result, change) => {
    if (change.type !== "dimensions" || !change.dimensions) {
      return result;
    }

    const node = result.find((currentNode) => currentNode.id === change.id);
    if (!node || !getNetworkContainerType(node)) {
      return result;
    }

    return resizeContainerNode(
      change.id,
      change.dimensions.width,
      change.dimensions.height,
      result,
    );
  }, nodes);
}

// Module-level flag to deduplicate snapshots when React Flow fires both
// onNodesChange and onEdgesChange for the same delete operation.
let _removeSnapshotPending = false;

export const useFlowStore = create<FlowStore>()((set) => ({
  nodes: initialNodes,
  edges: initialEdges,
  history: [],
  inspectorOpen: true,

  setNodes: (updater) =>
    set((s) => ({
      nodes: typeof updater === "function" ? updater(s.nodes) : updater,
    })),

  onNodesChange: (changes) =>
    set((s) => {
      const hasRemoves = changes.some((c) => c.type === "remove");

      let history = s.history;
      if (hasRemoves && !_removeSnapshotPending) {
        _removeSnapshotPending = true;
        queueMicrotask(() => {
          _removeSnapshotPending = false;
        });
        const entry: HistoryEntry = { before: { nodes: s.nodes, edges: s.edges } };
        history = [...s.history, entry].slice(-MAX_HISTORY);
      }

      const nextNodes = resizeChangedContainers(
        changes,
        applyNodeChanges(changes, s.nodes),
      );
      const removedNodeIds = changes.flatMap((change) =>
        change.type === "remove" ? [change.id] : [],
      );

      if (!removedNodeIds.length) {
        return { nodes: nextNodes, history };
      }

      return { ...removeSyncedNodes(removedNodeIds, s.nodes, nextNodes, s.edges), history };
    }),

  setEdges: (updater) =>
    set((s) => ({
      edges: typeof updater === "function" ? updater(s.edges) : updater,
    })),

  onEdgesChange: (changes) =>
    set((s) => {
      const hasRemoves = changes.some((c) => c.type === "remove");

      let history = s.history;
      if (hasRemoves && !_removeSnapshotPending) {
        const entry: HistoryEntry = { before: { nodes: s.nodes, edges: s.edges } };
        history = [...s.history, entry].slice(-MAX_HISTORY);
      }

      const nextEdges = applyEdgeChanges(changes, s.edges);
      const removedEdgeIds = changes.flatMap((change) =>
        change.type === "remove" ? [change.id] : [],
      );

      return {
        edges: removeSyncedEdges(removedEdgeIds, s.edges, nextEdges),
        history,
      };
    }),

  commitGraphChange: (updater) =>
    set((s) => {
      const next = updater({ nodes: s.nodes, edges: s.edges });
      if (next.nodes === s.nodes && next.edges === s.edges) return {};
      const entry: HistoryEntry = { before: { nodes: s.nodes, edges: s.edges } };
      const history = [...s.history, entry].slice(-MAX_HISTORY);
      return { nodes: next.nodes, edges: next.edges, history };
    }),

  undo: () =>
    set((s) => {
      const last = s.history.at(-1);
      if (!last) return {};
      const nodes = last.before.nodes.map((n) => ({ ...n, selected: false }));
      return { nodes, edges: last.before.edges, history: s.history.slice(0, -1) };
    }),

  setInspectorOpen: (updater) =>
    set((s) => ({
      inspectorOpen:
        typeof updater === "function" ? updater(s.inspectorOpen) : updater,
    })),

  dropTargetNodeId: null,
  setDropTargetNodeId: (id) => set({ dropTargetNodeId: id }),
  dropPreview: null,
  setDropPreview: (preview) => set({ dropPreview: preview }),

  toggleAzSync: (azId, synced) =>
    set((s) => toggleAzSyncState(azId, synced, s.nodes, s.edges)),
}));
