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
import {
  getNetworkContainerType,
  isNetworkContainerNode,
  resizeContainerNode,
} from "@/lib/graph-utils";
import { duplicateSelectedGraph } from "@/lib/node-duplication";
import type {
  AppNode,
  AppEdge,
  ContainerDropPreview,
  FlowViewport,
} from "@/types/flow";

const MAX_HISTORY = 100;

type HistoryEntry = {
  before: { nodes: AppNode[]; edges: AppEdge[] };
};

type FlowStore = {
  currentArchitectureId?: string;
  projectName: string | null;
  viewport: FlowViewport | null;
  viewportRestoreKey: number;
  nodes: AppNode[];
  nodesById: Map<string, AppNode>;
  containerNodes: AppNode[];
  edges: AppEdge[];
  history: HistoryEntry[];
  isDirty: boolean;
  inspectorOpen: boolean;
  dropTargetNodeId: string | null;
  dropPreview: ContainerDropPreview | null;
  editingEdgeId: string | null;
  selectionBoxActive: boolean;
  setSelectionBoxActive: (v: boolean) => void;
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
  resetCanvas: () => void;
  loadArchitecture: (
    nodes: AppNode[],
    edges: AppEdge[],
    metadata?: {
      architectureId?: string;
      name?: string;
      viewport?: FlowViewport | null;
    },
  ) => void;
  setCurrentArchitectureId: (architectureId: string | undefined) => void;
  setProjectName: (projectName: string | null) => void;
  setViewport: (viewport: FlowViewport) => void;
  duplicateSelectedNodes: () => void;
  markSaved: () => void;
  setInspectorOpen: (updater: boolean | ((prev: boolean) => boolean)) => void;
  setDropTargetNodeId: (id: string | null) => void;
  setDropPreview: (preview: ContainerDropPreview | null) => void;
  setEditingEdgeId: (id: string | null) => void;
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

function getNodeDerivatives(nodes: AppNode[]) {
  return {
    nodesById: new Map(nodes.map((node) => [node.id, node])),
    containerNodes: nodes.filter(isNetworkContainerNode),
  };
}

// Module-level flag to deduplicate snapshots when React Flow fires both
// onNodesChange and onEdgesChange for the same delete operation.
let _removeSnapshotPending = false;

function isSameViewport(a: FlowViewport | null, b: FlowViewport): boolean {
  return a?.x === b.x && a.y === b.y && a.zoom === b.zoom;
}

export const useFlowStore = create<FlowStore>()((set) => ({
  currentArchitectureId: undefined,
  projectName: null,
  viewport: null,
  viewportRestoreKey: 0,
  nodes: initialNodes,
  ...getNodeDerivatives(initialNodes),
  edges: initialEdges,
  history: [],
  isDirty: false,
  inspectorOpen: true,
  selectionBoxActive: false,
  setSelectionBoxActive: (v) => set({ selectionBoxActive: v }),

  setNodes: (updater) =>
    set((s) => {
      const nodes = typeof updater === "function" ? updater(s.nodes) : updater;
      return {
        nodes,
        ...getNodeDerivatives(nodes),
        isDirty: true,
      };
    }),

  onNodesChange: (changes) =>
    set((s) => {
      const hasRemoves = changes.some((c) => c.type === "remove");
      const hasMeaningfulChanges = changes.some(
        (c) => c.type === "remove" || c.type === "position" || c.type === "dimensions",
      );

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

      const selectionCleared =
        changes.some((c) => c.type === "select" && !c.selected) &&
        !nextNodes.some((n) => n.selected);

      if (!removedNodeIds.length) {
        return {
          nodes: nextNodes,
          ...getNodeDerivatives(nextNodes),
          history,
          isDirty: s.isDirty || hasMeaningfulChanges,
          ...(selectionCleared ? { selectionBoxActive: false } : {}),
        };
      }

      const next = removeSyncedNodes(removedNodeIds, s.nodes, nextNodes, s.edges);
      return {
        ...next,
        ...getNodeDerivatives(next.nodes),
        history,
        isDirty: true,
        ...(selectionCleared ? { selectionBoxActive: false } : {}),
      };
    }),

  setEdges: (updater) =>
    set((s) => ({
      edges: typeof updater === "function" ? updater(s.edges) : updater,
      isDirty: true,
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
        isDirty: s.isDirty || hasRemoves,
      };
    }),

  commitGraphChange: (updater) =>
    set((s) => {
      const next = updater({ nodes: s.nodes, edges: s.edges });
      if (next.nodes === s.nodes && next.edges === s.edges) return {};
      const entry: HistoryEntry = { before: { nodes: s.nodes, edges: s.edges } };
      const history = [...s.history, entry].slice(-MAX_HISTORY);
      return {
        nodes: next.nodes,
        ...getNodeDerivatives(next.nodes),
        edges: next.edges,
        history,
        isDirty: true,
      };
    }),

  undo: () =>
    set((s) => {
      const last = s.history.at(-1);
      if (!last) return {};
      const nodes = last.before.nodes.map((n) => ({ ...n, selected: false }));
      return {
        nodes,
        ...getNodeDerivatives(nodes),
        edges: last.before.edges,
        history: s.history.slice(0, -1),
        isDirty: true,
      };
    }),

  resetCanvas: () =>
    set((s) => ({
      currentArchitectureId: undefined,
      projectName: null,
      viewport: null,
      viewportRestoreKey: s.viewportRestoreKey + 1,
      nodes: [],
      ...getNodeDerivatives([]),
      edges: [],
      history: [],
      isDirty: false,
    })),

  loadArchitecture: (nodes, edges, metadata) =>
    set((s) => ({
      currentArchitectureId: metadata?.architectureId,
      projectName: metadata?.name ?? null,
      viewport: metadata?.viewport ?? null,
      viewportRestoreKey: s.viewportRestoreKey + 1,
      nodes,
      ...getNodeDerivatives(nodes),
      edges,
      history: [],
      isDirty: false,
    })),

  setCurrentArchitectureId: (architectureId) =>
    set({ currentArchitectureId: architectureId }),

  setProjectName: (projectName) =>
    set((s) => {
      if (s.projectName === projectName) return {};
      return { projectName, isDirty: true };
    }),

  setViewport: (viewport) =>
    set((s) => {
      if (isSameViewport(s.viewport, viewport)) return {};
      return { viewport, isDirty: true };
    }),

  duplicateSelectedNodes: () =>
    set((s) => {
      const next = duplicateSelectedGraph(s.nodes, s.edges);
      if (next.nodes === s.nodes && next.edges === s.edges) return {};

      const entry: HistoryEntry = { before: { nodes: s.nodes, edges: s.edges } };
      const history = [...s.history, entry].slice(-MAX_HISTORY);
      return {
        nodes: next.nodes,
        ...getNodeDerivatives(next.nodes),
        edges: next.edges,
        history,
        isDirty: true,
      };
    }),

  markSaved: () => set({ isDirty: false }),

  setInspectorOpen: (updater) =>
    set((s) => ({
      inspectorOpen:
        typeof updater === "function" ? updater(s.inspectorOpen) : updater,
    })),

  dropTargetNodeId: null,
  setDropTargetNodeId: (id) =>
    set((s) => (s.dropTargetNodeId === id ? s : { dropTargetNodeId: id })),
  dropPreview: null,
  setDropPreview: (preview) =>
    set((s) => {
      const current = s.dropPreview;
      if (
        current?.parentId === preview?.parentId &&
        current?.childType === preview?.childType
      ) {
        return s;
      }

      return { dropPreview: preview };
    }),
  editingEdgeId: null,
  setEditingEdgeId: (id) => set({ editingEdgeId: id }),

  toggleAzSync: (azId, synced) =>
    set((s) => {
      const next = toggleAzSyncState(azId, synced, s.nodes, s.edges);
      return {
        ...next,
        ...getNodeDerivatives(next.nodes),
        isDirty: true,
      };
    }),
}));
