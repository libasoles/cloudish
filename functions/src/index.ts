/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {initializeApp} from "firebase-admin/app";
import {FieldValue, Timestamp, getFirestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

initializeApp();

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
  listUserArchitectures: {
    limit: 25,
    windowMs: ONE_MINUTE_MS,
  },
} as const;

type CallableAuth = {
  uid?: string;
};

type SaveArchitectureData = {
  architectureId?: string;
  name?: string;
  nodes: unknown[];
  edges: unknown[];
};

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count?: unknown;
  windowStartMs?: unknown;
};

/**
 * Returns the authenticated user id or rejects the callable request.
 *
 * @param {CallableAuth | undefined} auth Firebase Auth data from the request.
 * @return {string} The authenticated user id.
 */
function assertSignedIn(auth?: CallableAuth): string {
  if (!auth?.uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to manage architectures.",
    );
  }

  return auth.uid;
}

/**
 * Enforces a fixed-window rate limit for an authenticated callable action.
 *
 * @param {string} uid Authenticated user id.
 * @param {string} action Callable action name.
 * @param {RateLimitConfig} config Fixed-window limit settings.
 */
async function enforceRateLimit(
  uid: string,
  action: string,
  config: RateLimitConfig,
): Promise<void> {
  const nowMs = Date.now();
  const db = getFirestore();
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

      throw new HttpsError(
        "resource-exhausted",
        "Too many requests. Please try again later.",
        {retryAfterSeconds},
      );
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
      {merge: true},
    );
  });
}

/**
 * Reads an optional string field from callable request data.
 *
 * @param {unknown} value Candidate field value.
 * @param {string} fieldName Field name used in error messages.
 * @param {number} maxLength Maximum accepted string length.
 * @return {string | undefined} Trimmed string when present.
 */
function getString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${fieldName} must be a string.`);
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length > maxLength) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} must be ${maxLength} characters or fewer.`,
    );
  }

  return trimmedValue.length ? trimmedValue : undefined;
}

/**
 * Reads a required non-empty string field from callable request data.
 *
 * @param {unknown} value Candidate field value.
 * @param {string} fieldName Field name used in error messages.
 * @param {number} maxLength Maximum accepted string length.
 * @return {string} Trimmed string.
 */
function requireString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  const stringValue = getString(value, fieldName, maxLength);

  if (!stringValue) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} must be a non-empty string.`,
    );
  }

  return stringValue;
}

/**
 * Reads a required array field from callable request data.
 *
 * @param {unknown} value Candidate field value.
 * @param {string} fieldName Field name used in error messages.
 * @return {unknown[]} The validated array.
 */
function requireArray(value: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new HttpsError("invalid-argument", `${fieldName} must be an array.`);
  }

  return value;
}

/**
 * Rejects oversized callable payloads before they are written with Admin SDK.
 *
 * @param {unknown} value Payload candidate.
 */
function assertSerializedSize(value: unknown): void {
  const serializedValue = JSON.stringify(value);
  const payloadBytes = Buffer.byteLength(serializedValue, "utf8");

  if (payloadBytes > MAX_SERIALIZED_ARCHITECTURE_BYTES) {
    throw new HttpsError(
      "invalid-argument",
      "Architecture payload is too large.",
    );
  }
}

/**
 * Checks whether a value is a plain object record.
 *
 * @param {unknown} value Candidate value.
 * @return {boolean} True for object records.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validates arbitrary metadata stored inside node/edge data.
 *
 * @param {unknown} value Candidate value.
 * @param {string} fieldPath Field path used in error messages.
 * @param {number} depth Current object depth.
 */
function assertJsonLikeValue(
  value: unknown,
  fieldPath: string,
  depth = 0,
): void {
  if (depth > MAX_OBJECT_DEPTH) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldPath} is nested too deeply.`,
    );
  }

  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new HttpsError(
        "invalid-argument",
        `${fieldPath} must be a finite number.`,
      );
    }
    return;
  }

  if (typeof value === "string") {
    if (value.length > MAX_FIELD_STRING_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `${fieldPath} must be ${MAX_FIELD_STRING_LENGTH} characters or fewer.`,
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_FIELDS_PER_OBJECT) {
      throw new HttpsError(
        "invalid-argument",
        `${fieldPath} contains too many items.`,
      );
    }

    value.forEach((item, index) => {
      assertJsonLikeValue(item, `${fieldPath}.${index}`, depth + 1);
    });
    return;
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);

    if (entries.length > MAX_FIELDS_PER_OBJECT) {
      throw new HttpsError(
        "invalid-argument",
        `${fieldPath} contains too many fields.`,
      );
    }

    entries.forEach(([key, nestedValue]) => {
      if (key.length > MAX_FIELD_KEY_LENGTH) {
        throw new HttpsError(
          "invalid-argument",
          `${fieldPath} contains an oversized field name.`,
        );
      }

      assertJsonLikeValue(nestedValue, `${fieldPath}.${key}`, depth + 1);
    });
    return;
  }

  throw new HttpsError(
    "invalid-argument",
    `${fieldPath} contains an unsupported value.`,
  );
}

/**
 * Validates a React Flow node shape without coupling to every client field.
 *
 * @param {unknown} value Candidate node.
 * @param {number} index Node index.
 */
function assertNode(value: unknown, index: number): void {
  if (!isRecord(value)) {
    throw new HttpsError(
      "invalid-argument",
      `nodes.${index} must be an object.`,
    );
  }

  requireString(value.id, `nodes.${index}.id`, MAX_NODE_ID_LENGTH);
  getString(value.type, `nodes.${index}.type`, MAX_NODE_TYPE_LENGTH);

  if (!isRecord(value.position)) {
    throw new HttpsError(
      "invalid-argument",
      `nodes.${index}.position must be an object.`,
    );
  }

  const {x, y} = value.position;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    throw new HttpsError(
      "invalid-argument",
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
    throw new HttpsError(
      "invalid-argument",
      `nodes.${index}.width must be a finite number.`,
    );
  }

  if (
    value.height !== undefined &&
    (typeof value.height !== "number" || !Number.isFinite(value.height))
  ) {
    throw new HttpsError(
      "invalid-argument",
      `nodes.${index}.height must be a finite number.`,
    );
  }

  if (value.data !== undefined) {
    assertJsonLikeValue(value.data, `nodes.${index}.data`);
  }
}

/**
 * Validates a React Flow edge shape.
 *
 * @param {unknown} value Candidate edge.
 * @param {number} index Edge index.
 */
function assertEdge(value: unknown, index: number): void {
  if (!isRecord(value)) {
    throw new HttpsError(
      "invalid-argument",
      `edges.${index} must be an object.`,
    );
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

/**
 * Validates the payload used to save an architecture.
 *
 * @param {unknown} value Callable request data.
 * @return {SaveArchitectureData} Normalized save payload.
 */
function parseSaveArchitectureData(value: unknown): SaveArchitectureData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError(
      "invalid-argument",
      "Architecture data must be an object.",
    );
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
  };
}

/**
 * Normalizes the requested list page size.
 *
 * @param {unknown} value Requested limit from callable data.
 * @return {number} A bounded list limit.
 */
function parseListLimit(value: unknown): number {
  if (value === undefined || value === null) {
    return DEFAULT_LIST_LIMIT;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new HttpsError("invalid-argument", "limit must be an integer.");
  }

  return Math.min(Math.max(value, 1), MAX_LIST_LIMIT);
}

/**
 * Converts Firestore timestamps into API-safe ISO strings.
 *
 * @param {unknown} value Firestore timestamp candidate.
 * @return {string | null} ISO date when the value is a timestamp.
 */
function timestampToIso(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  return null;
}

export const saveUserArchitecture = onCall(async (request) => {
  const uid = assertSignedIn(request.auth);
  await enforceRateLimit(
    uid,
    "saveUserArchitecture",
    RATE_LIMITS.saveUserArchitecture,
  );
  const data = parseSaveArchitectureData(request.data);

  if (data.nodes.length > MAX_NODE_COUNT) {
    throw new HttpsError(
      "invalid-argument",
      `Architectures can contain at most ${MAX_NODE_COUNT} nodes.`,
    );
  }

  if (data.edges.length > MAX_EDGE_COUNT) {
    throw new HttpsError(
      "invalid-argument",
      `Architectures can contain at most ${MAX_EDGE_COUNT} edges.`,
    );
  }

  data.nodes.forEach(assertNode);
  data.edges.forEach(assertEdge);
  assertSerializedSize({
    name: data.name,
    nodes: data.nodes,
    edges: data.edges,
  });

  const db = getFirestore();
  const collectionRef = db
    .collection("users")
    .doc(uid)
    .collection(ARCHITECTURES_COLLECTION);
  const documentRef = data.architectureId ?
    collectionRef.doc(data.architectureId) :
    collectionRef.doc();

  const existingSnapshot = await documentRef.get();
  const createdAt = existingSnapshot.exists ?
    existingSnapshot.get("createdAt") :
    FieldValue.serverTimestamp();

  await documentRef.set(
    {
      name: data.name ?? "Untitled architecture",
      nodes: data.nodes,
      edges: data.edges,
      createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true},
  );

  return {
    architectureId: documentRef.id,
  };
});

export const listUserArchitectures = onCall(async (request) => {
  const uid = assertSignedIn(request.auth);
  await enforceRateLimit(
    uid,
    "listUserArchitectures",
    RATE_LIMITS.listUserArchitectures,
  );
  const requestData = request.data as Record<string, unknown> | undefined;
  const limit = parseListLimit(requestData?.limit);
  const snapshot = await getFirestore()
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
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
      };
    }),
  };
});
