import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase-functions";
import type { AppEdge, AppNode } from "@/types/flow";

export type SavedArchitecture = {
  architectureId: string;
  name: string;
  nodes: AppNode[];
  edges: AppEdge[];
  createdAt: string | null;
  updatedAt: string | null;
};

type SaveArchitectureResponse = {
  architectureId: string;
};

type ListArchitecturesResponse = {
  architectures: SavedArchitecture[];
};

export function saveUserArchitecture({
  architectureId,
  name,
  nodes,
  edges,
}: {
  architectureId?: string;
  name: string;
  nodes: AppNode[];
  edges: AppEdge[];
}) {
  const saveArchitecture = httpsCallable<
    {
      architectureId?: string;
      name: string;
      nodes: AppNode[];
      edges: AppEdge[];
    },
    SaveArchitectureResponse
  >(functions, "saveUserArchitecture");

  return saveArchitecture({ architectureId, name, nodes, edges });
}

export function listUserArchitectures(limit = 25) {
  const listArchitectures = httpsCallable<
    { limit: number },
    ListArchitecturesResponse
  >(functions, "listUserArchitectures");

  return listArchitectures({ limit });
}
