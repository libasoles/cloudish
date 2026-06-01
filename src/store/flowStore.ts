import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { create } from "zustand";
import { initialNodes, initialEdges } from "@/data/initial-flow";
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
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

  setEdges: (updater) =>
    set((s) => ({
      edges: typeof updater === "function" ? updater(s.edges) : updater,
    })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

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
    set((s) => {
      const az = s.nodes.find((n) => n.id === azId);
      if (!az) return s;
      const { parentId } = az;
      return {
        nodes: s.nodes.map((n) => {
          if (
            n.parentId === parentId &&
            (n.data as { containerType?: string }).containerType === "az"
          ) {
            return { ...n, data: { ...n.data, synced } };
          }
          return n;
        }),
      };
    }),
}));
