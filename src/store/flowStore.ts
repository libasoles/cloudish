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
import type { AppNode, AppEdge, ContainerDropPreview } from "@/types/flow";

type FlowStore = {
  nodes: AppNode[];
  edges: AppEdge[];
  inspectorOpen: boolean;
  dropTargetNodeId: string | null;
  dropPreview: ContainerDropPreview | null;
  setNodes: (updater: AppNode[] | ((prev: AppNode[]) => AppNode[])) => void;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  setEdges: (updater: AppEdge[] | ((prev: AppEdge[]) => AppEdge[])) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setInspectorOpen: (updater: boolean | ((prev: boolean) => boolean)) => void;
  setDropTargetNodeId: (id: string | null) => void;
  setDropPreview: (preview: ContainerDropPreview | null) => void;
  toggleAzSync: (azId: string, synced: boolean) => void;
};

export const useFlowStore = create<FlowStore>()((set) => ({
  nodes: initialNodes,
  edges: initialEdges,
  inspectorOpen: true,

  setNodes: (updater) =>
    set((s) => ({
      nodes: typeof updater === "function" ? updater(s.nodes) : updater,
    })),

  onNodesChange: (changes) =>
    set((s) => {
      const nextNodes = applyNodeChanges(changes, s.nodes);
      const removedNodeIds = changes.flatMap((change) =>
        change.type === "remove" ? [change.id] : [],
      );

      if (!removedNodeIds.length) {
        return { nodes: nextNodes };
      }

      return removeSyncedNodes(removedNodeIds, s.nodes, nextNodes, s.edges);
    }),

  setEdges: (updater) =>
    set((s) => ({
      edges: typeof updater === "function" ? updater(s.edges) : updater,
    })),

  onEdgesChange: (changes) =>
    set((s) => {
      const nextEdges = applyEdgeChanges(changes, s.edges);
      const removedEdgeIds = changes.flatMap((change) =>
        change.type === "remove" ? [change.id] : [],
      );

      return {
        edges: removeSyncedEdges(removedEdgeIds, s.edges, nextEdges),
      };
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
