import type { Config } from "@netlify/functions";
import { getAdminAuth } from "../server/firebase-admin.mts";
import {
  ApiError,
  deleteUserArchitecture,
  getUserArchitecture,
  listUserArchitectures,
  parseListLimit,
  renameUserArchitecture,
  saveUserArchitecture,
} from "../server/architectures.mts";

type JsonBody = Record<string, unknown>;

const jsonHeaders = {
  "content-type": "application/json",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init?.headers,
    },
  });
}

function getBearerToken(request: Request): string {
  const authorizationHeader = request.headers.get("authorization");
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing authorization token.");
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new ApiError(401, "Missing authorization token.");
  }

  return token;
}

async function getAuthenticatedUid(request: Request): Promise<string> {
  const token = getBearerToken(request);

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, "Invalid authorization token.");
  }
}

async function readJsonBody(request: Request): Promise<JsonBody> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "Request body must be a JSON object.");
    }

    return body as JsonBody;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

async function handleRequest(request: Request) {
  const uid = await getAuthenticatedUid(request);

  if (request.method === "POST") {
    const body = await readJsonBody(request);
    return jsonResponse(await saveUserArchitecture(uid, body));
  }

  if (request.method === "PATCH") {
    const body = await readJsonBody(request);
    return jsonResponse(await renameUserArchitecture(uid, body));
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const architectureId = url.searchParams.get("architectureId");

    if (architectureId !== null) {
      return jsonResponse(await getUserArchitecture(uid, architectureId));
    }

    const limitParameter = url.searchParams.get("limit");
    const limit =
      limitParameter === null ? undefined : Number(limitParameter);

    return jsonResponse(
      await listUserArchitectures(uid, parseListLimit(limit)),
    );
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url);
    return jsonResponse(
      await deleteUserArchitecture(
        uid,
        url.searchParams.get("architectureId"),
      ),
    );
  }

  return jsonResponse(
    { error: "Method not allowed." },
    {
      status: 405,
      headers: {
        allow: "DELETE, GET, PATCH, POST",
      },
    },
  );
}

export default async (request: Request) => {
  try {
    return await handleRequest(request);
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonResponse(
        {
          error: error.message,
          details: error.details,
        },
        { status: error.status },
      );
    }

    console.error(error);
    return jsonResponse({ error: "Unexpected server error." }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/architectures",
};
