import { auth } from "@/lib/firebase-auth";
import type { AppEdge, AppNode, FlowViewport } from "@/types/flow";

export type SavedArchitecture = {
  architectureId: string;
  name: string;
  nodes: AppNode[];
  edges: AppEdge[];
  viewport?: FlowViewport | null;
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
  viewport,
}: {
  architectureId?: string;
  name: string;
  nodes: AppNode[];
  edges: AppEdge[];
  viewport?: FlowViewport | null;
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
      viewport,
    }),
  });

  return parseApiResponse<SaveArchitectureResponse>(response);
}

export async function renameUserArchitecture({
  architectureId,
  name,
}: {
  architectureId: string;
  name: string;
}) {
  const response = await fetch("/api/architectures", {
    method: "PATCH",
    headers: {
      Authorization: await getAuthorizationHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      architectureId,
      name,
    }),
  });

  return parseApiResponse<SaveArchitectureResponse>(response);
}

export async function deleteUserArchitecture({
  architectureId,
}: {
  architectureId: string;
}) {
  const searchParams = new URLSearchParams({
    architectureId,
  });
  const response = await fetch(`/api/architectures?${searchParams}`, {
    method: "DELETE",
    headers: {
      Authorization: await getAuthorizationHeader(),
    },
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

export async function getArchitecture(architectureId: string) {
  const searchParams = new URLSearchParams({ architectureId });
  const response = await fetch(`/api/architectures?${searchParams}`, {
    headers: {
      Authorization: await getAuthorizationHeader(),
    },
  });

  return parseApiResponse<SavedArchitecture>(response);
}
