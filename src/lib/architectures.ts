import { auth } from "@/lib/firebase-auth";
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

type ApiErrorBody = {
  error?: string;
  details?: {
    retryAfterSeconds?: number;
  };
};

async function getAuthorizationHeader() {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("User must be signed in.");
  }

  return `Bearer ${token}`;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | ApiErrorBody;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new Error(errorBody.error ?? "Request failed.");
  }

  return body as T;
}

export async function saveUserArchitecture({
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
  const response = await fetch("/api/architectures", {
    method: "POST",
    headers: {
      Authorization: await getAuthorizationHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      architectureId,
      name,
      nodes,
      edges,
    }),
  });

  return parseApiResponse<SaveArchitectureResponse>(response);
}

export async function listUserArchitectures(limit = 25) {
  const searchParams = new URLSearchParams({
    limit: String(limit),
  });
  const response = await fetch(`/api/architectures?${searchParams}`, {
    headers: {
      Authorization: await getAuthorizationHeader(),
    },
  });

  return parseApiResponse<ListArchitecturesResponse>(response);
}
