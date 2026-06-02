import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin.mts";

const ARCHITECTURES_COLLECTION = "architectures";
const RATE_LIMITS_COLLECTION = "rateLimits";
const DEFAULT_LIST_LIMIT = 25;
const MAX_LIST_LIMIT = 100;
const MAX_ARCHITECTURE_NAME_LENGTH = 120;
const MAX_ARCHITECTURE_ID_LENGTH = 128;
const MAX_NODE_COUNT = 250;
const MAX_EDGE_COUNT = 500;
const MAX_SERIALIZED_ARCHITECTURE_BYTES = 900_000;
const MAX_NODE_ID_LENGTH = 128;
const MAX_EDGE_ID_LENGTH = 128;
const MAX_NODE_TYPE_LENGTH = 64;
const MAX_LABEL_LENGTH = 240;
const MAX_FIELDS_PER_OBJECT = 80;
const MAX_FIELD_KEY_LENGTH = 80;
const MAX_FIELD_STRING_LENGTH = 500;
const MAX_OBJECT_DEPTH = 8;
const ONE_MINUTE_MS = 60_000;

const RATE_LIMITS = {
  saveUserArchitecture: {
    limit: 10,
    windowMs: ONE_MINUTE_MS,
  },
  renameUserArchitecture: {
    limit: 20,
    windowMs: ONE_MINUTE_MS,
  },
  deleteUserArchitecture: {
    limit: 10,
    windowMs: ONE_MINUTE_MS,
  },
  listUserArchitectures: {
    limit: 25,
    windowMs: ONE_MINUTE_MS,
  },
  getUserArchitecture: {
    limit: 60,
    windowMs: ONE_MINUTE_MS,
  },
} as const;

type SaveArchitectureData = {
  architectureId?: string;
  name?: string;
  nodes: unknown[];
  edges: unknown[];
  viewport?: FlowViewport | null;
};

type FlowViewport = {
  x: number;
  y: number;
  zoom: number;
};

type RenameArchitectureData = {
  architectureId: string;
  name: string;
};

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count?: unknown;
  windowStartMs?: unknown;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function enforceRateLimit(
  uid: string,
  action: string,
  config: RateLimitConfig,
): Promise<void> {
  const nowMs = Date.now();
  const db = getDb();
  const rateLimitRef = db
    .collection("users")
    .doc(uid)
    .collection(RATE_LIMITS_COLLECTION)
    .doc(action);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(rateLimitRef);
    const data = snapshot.data() as RateLimitState | undefined;
    const existingWindowStartMs =
      typeof data?.windowStartMs === "number" ? data.windowStartMs : 0;
    const existingCount = typeof data?.count === "number" ? data.count : 0;
    const isCurrentWindow =
      nowMs - existingWindowStartMs >= 0 &&
      nowMs - existingWindowStartMs < config.windowMs;
    const nextWindowStartMs = isCurrentWindow ? existingWindowStartMs : nowMs;
    const nextCount = isCurrentWindow ? existingCount + 1 : 1;

    if (nextCount > config.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existingWindowStartMs + config.windowMs - nowMs) / 1000),
      );

      throw new ApiError(429, "Too many requests. Please try again later.", {
        retryAfterSeconds,
      });
    }

    transaction.set(
      rateLimitRef,
      {
        action,
        count: nextCount,
        limit: config.limit,
        windowMs: config.windowMs,
        windowStartMs: nextWindowStartMs,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

function getString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string.`);
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length > maxLength) {
    throw new ApiError(
      400,
      `${fieldName} must be ${maxLength} characters or fewer.`,
    );
  }

  return trimmedValue.length ? trimmedValue : undefined;
}

function requireString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  const stringValue = getString(value, fieldName, maxLength);

  if (!stringValue) {
    throw new ApiError(400, `${fieldName} must be a non-empty string.`);
  }

  return stringValue;
}

function requireArray(value: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new ApiError(400, `${fieldName} must be an array.`);
  }

  return value;
}

function assertSerializedSize(value: unknown): void {
  const serializedValue = JSON.stringify(value);
  const payloadBytes = Buffer.byteLength(serializedValue, "utf8");

  if (payloadBytes > MAX_SERIALIZED_ARCHITECTURE_BYTES) {
    throw new ApiError(400, "Architecture payload is too large.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertJsonLikeValue(
  value: unknown,
  fieldPath: string,
  depth = 0,
): void {
  if (depth > MAX_OBJECT_DEPTH) {
    throw new ApiError(400, `${fieldPath} is nested too deeply.`);
  }

  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new ApiError(400, `${fieldPath} must be a finite number.`);
    }
    return;
  }

  if (typeof value === "string") {
    if (value.length > MAX_FIELD_STRING_LENGTH) {
      throw new ApiError(
        400,
        `${fieldPath} must be ${MAX_FIELD_STRING_LENGTH} characters or fewer.`,
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_FIELDS_PER_OBJECT) {
      throw new ApiError(400, `${fieldPath} contains too many items.`);
    }

    value.forEach((item, index) => {
      assertJsonLikeValue(item, `${fieldPath}.${index}`, depth + 1);
    });
    return;
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);

    if (entries.length > MAX_FIELDS_PER_OBJECT) {
      throw new ApiError(400, `${fieldPath} contains too many fields.`);
    }

    entries.forEach(([key, nestedValue]) => {
      if (key.length > MAX_FIELD_KEY_LENGTH) {
        throw new ApiError(
          400,
          `${fieldPath} contains an oversized field name.`,
        );
      }

      assertJsonLikeValue(nestedValue, `${fieldPath}.${key}`, depth + 1);
    });
    return;
  }

  throw new ApiError(400, `${fieldPath} contains an unsupported value.`);
}

function assertNode(value: unknown, index: number): void {
  if (!isRecord(value)) {
    throw new ApiError(400, `nodes.${index} must be an object.`);
  }

  requireString(value.id, `nodes.${index}.id`, MAX_NODE_ID_LENGTH);
  getString(value.type, `nodes.${index}.type`, MAX_NODE_TYPE_LENGTH);

  if (!isRecord(value.position)) {
    throw new ApiError(400, `nodes.${index}.position must be an object.`);
  }

  const { x, y } = value.position;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    throw new ApiError(
      400,
      `nodes.${index}.position must contain finite x and y numbers.`,
    );
  }

  if (value.parentId !== undefined) {
    getString(value.parentId, `nodes.${index}.parentId`, MAX_NODE_ID_LENGTH);
  }

  if (
    value.width !== undefined &&
    (typeof value.width !== "number" || !Number.isFinite(value.width))
  ) {
    throw new ApiError(400, `nodes.${index}.width must be a finite number.`);
  }

  if (
    value.height !== undefined &&
    (typeof value.height !== "number" || !Number.isFinite(value.height))
  ) {
    throw new ApiError(400, `nodes.${index}.height must be a finite number.`);
  }

  if (value.data !== undefined) {
    assertJsonLikeValue(value.data, `nodes.${index}.data`);
  }
}

function assertEdge(value: unknown, index: number): void {
  if (!isRecord(value)) {
    throw new ApiError(400, `edges.${index} must be an object.`);
  }

  requireString(value.id, `edges.${index}.id`, MAX_EDGE_ID_LENGTH);
  requireString(value.source, `edges.${index}.source`, MAX_NODE_ID_LENGTH);
  requireString(value.target, `edges.${index}.target`, MAX_NODE_ID_LENGTH);

  if (value.label !== undefined) {
    getString(value.label, `edges.${index}.label`, MAX_LABEL_LENGTH);
  }

  if (value.data !== undefined) {
    assertJsonLikeValue(value.data, `edges.${index}.data`);
  }
}

function parseViewport(value: unknown): FlowViewport | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    throw new ApiError(400, "viewport must be an object.");
  }

  const { x, y, zoom } = value;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof zoom !== "number" ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(zoom)
  ) {
    throw new ApiError(
      400,
      "viewport must contain finite x, y, and zoom numbers.",
    );
  }

  return { x, y, zoom };
}

function parseSaveArchitectureData(value: unknown): SaveArchitectureData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "Architecture data must be an object.");
  }

  const data = value as Record<string, unknown>;

  return {
    architectureId: getString(
      data.architectureId,
      "architectureId",
      MAX_ARCHITECTURE_ID_LENGTH,
    ),
    name: getString(data.name, "name", MAX_ARCHITECTURE_NAME_LENGTH),
    nodes: requireArray(data.nodes, "nodes"),
    edges: requireArray(data.edges, "edges"),
    viewport: parseViewport(data.viewport),
  };
}

function parseRenameArchitectureData(value: unknown): RenameArchitectureData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "Architecture data must be an object.");
  }

  const data = value as Record<string, unknown>;

  return {
    architectureId: requireString(
      data.architectureId,
      "architectureId",
      MAX_ARCHITECTURE_ID_LENGTH,
    ),
    name: requireString(data.name, "name", MAX_ARCHITECTURE_NAME_LENGTH),
  };
}

export function parseListLimit(value: unknown): number {
  if (value === undefined || value === null) {
    return DEFAULT_LIST_LIMIT;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ApiError(400, "limit must be an integer.");
  }

  return Math.min(Math.max(value, 1), MAX_LIST_LIMIT);
}

function timestampToIso(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  return null;
}

export async function saveUserArchitecture(uid: string, value: unknown) {
  await enforceRateLimit(
    uid,
    "saveUserArchitecture",
    RATE_LIMITS.saveUserArchitecture,
  );
  const data = parseSaveArchitectureData(value);

  if (data.nodes.length > MAX_NODE_COUNT) {
    throw new ApiError(
      400,
      `Architectures can contain at most ${MAX_NODE_COUNT} nodes.`,
    );
  }

  if (data.edges.length > MAX_EDGE_COUNT) {
    throw new ApiError(
      400,
      `Architectures can contain at most ${MAX_EDGE_COUNT} edges.`,
    );
  }

  data.nodes.forEach(assertNode);
  data.edges.forEach(assertEdge);
  assertSerializedSize({
    name: data.name,
    nodes: data.nodes,
    edges: data.edges,
    viewport: data.viewport,
  });

  const db = getDb();
  const collectionRef = db
    .collection("users")
    .doc(uid)
    .collection(ARCHITECTURES_COLLECTION);
  const documentRef = data.architectureId
    ? collectionRef.doc(data.architectureId)
    : collectionRef.doc();

  const existingSnapshot = await documentRef.get();
  const createdAt = existingSnapshot.exists
    ? existingSnapshot.get("createdAt")
    : FieldValue.serverTimestamp();

  await documentRef.set(
    {
      name: data.name ?? "Untitled architecture",
      nodes: data.nodes,
      edges: data.edges,
      viewport: data.viewport ?? null,
      createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    architectureId: documentRef.id,
  };
}

export async function renameUserArchitecture(uid: string, value: unknown) {
  await enforceRateLimit(
    uid,
    "renameUserArchitecture",
    RATE_LIMITS.renameUserArchitecture,
  );
  const data = parseRenameArchitectureData(value);

  const documentRef = getDb()
    .collection("users")
    .doc(uid)
    .collection(ARCHITECTURES_COLLECTION)
    .doc(data.architectureId);

  const existingSnapshot = await documentRef.get();
  if (!existingSnapshot.exists) {
    throw new ApiError(404, "Architecture not found.");
  }

  await documentRef.set(
    {
      name: data.name,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    architectureId: documentRef.id,
  };
}

export async function deleteUserArchitecture(
  uid: string,
  architectureId: unknown,
) {
  await enforceRateLimit(
    uid,
    "deleteUserArchitecture",
    RATE_LIMITS.deleteUserArchitecture,
  );
  const parsedArchitectureId = requireString(
    architectureId,
    "architectureId",
    MAX_ARCHITECTURE_ID_LENGTH,
  );

  const documentRef = getDb()
    .collection("users")
    .doc(uid)
    .collection(ARCHITECTURES_COLLECTION)
    .doc(parsedArchitectureId);

  const existingSnapshot = await documentRef.get();
  if (!existingSnapshot.exists) {
    throw new ApiError(404, "Architecture not found.");
  }

  await documentRef.delete();

  return {
    architectureId: documentRef.id,
  };
}

export async function listUserArchitectures(uid: string, limit: number) {
  await enforceRateLimit(
    uid,
    "listUserArchitectures",
    RATE_LIMITS.listUserArchitectures,
  );
  const snapshot = await getDb()
    .collection("users")
    .doc(uid)
    .collection(ARCHITECTURES_COLLECTION)
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();

  return {
    architectures: snapshot.docs.map((documentSnapshot) => {
      const data = documentSnapshot.data();

      return {
        architectureId: documentSnapshot.id,
        name: typeof data.name === "string" ? data.name : "",
        nodes: Array.isArray(data.nodes) ? data.nodes : [],
        edges: Array.isArray(data.edges) ? data.edges : [],
        viewport: parseViewport(data.viewport) ?? null,
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
      };
    }),
  };
}

export async function getUserArchitecture(
  uid: string,
  architectureId: unknown,
) {
  await enforceRateLimit(
    uid,
    "getUserArchitecture",
    RATE_LIMITS.getUserArchitecture,
  );

  const parsedArchitectureId = requireString(
    architectureId,
    "architectureId",
    MAX_ARCHITECTURE_ID_LENGTH,
  );

  const documentRef = getDb()
    .collection("users")
    .doc(uid)
    .collection(ARCHITECTURES_COLLECTION)
    .doc(parsedArchitectureId);

  const snapshot = await documentRef.get();
  if (!snapshot.exists) {
    throw new ApiError(404, "Architecture not found.");
  }

  const data = snapshot.data()!;
  return {
    architectureId: snapshot.id,
    name: typeof data.name === "string" ? data.name : "",
    nodes: Array.isArray(data.nodes) ? data.nodes : [],
    edges: Array.isArray(data.edges) ? data.edges : [],
    viewport: parseViewport(data.viewport) ?? null,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}
