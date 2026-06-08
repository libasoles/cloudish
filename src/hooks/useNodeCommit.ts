import { useFlowStore } from "@/store/flowStore";
import { updateSyncedNodeGroup } from "@/lib/az-sync";
import type { AppNode } from "@/types/flow";

export function useNodeCommit(id: string) {
  const commitGraphChange = useFlowStore((s) => s.commitGraphChange);
  return (update: (node: AppNode) => AppNode) =>
    commitGraphChange(({ nodes, edges }) => ({
      nodes: updateSyncedNodeGroup(id, nodes, update),
      edges,
    }));
}
