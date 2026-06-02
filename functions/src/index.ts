/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {initializeApp} from "firebase-admin/app";
import {
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
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
const DEFAULT_LIST_LIMIT = 25;
const MAX_LIST_LIMIT = 100;

type SaveArchitectureData = {
  architectureId?: string;
  name?: string;
  nodes: unknown[];
  edges: unknown[];
};

/**
 * Returns the authenticated user id or rejects the callable request.
 *
 * @param {string | undefined} uid Firebase Auth user id from the request.
 * @return {string} The authenticated user id.
 */
function assertSignedIn(uid?: string): string {
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to manage architectures.",
    );
  }

  return uid;
}

/**
 * Reads an optional string field from callable request data.
 *
 * @param {unknown} value Candidate field value.
 * @param {string} fieldName Field name used in error messages.
 * @return {string | undefined} Trimmed string when present.
 */
function getString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} must be a string.`,
    );
  }

  const trimmedValue = value.trim();
  return trimmedValue.length ? trimmedValue : undefined;
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
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} must be an array.`,
    );
  }

  return value;
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
    architectureId: getString(data.architectureId, "architectureId"),
    name: getString(data.name, "name"),
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
  const uid = assertSignedIn(request.auth?.uid);
  const data = parseSaveArchitectureData(request.data);
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

  await documentRef.set({
    name: data.name ?? "Untitled architecture",
    nodes: data.nodes,
    edges: data.edges,
    createdAt,
    updatedAt: FieldValue.serverTimestamp(),
  }, {merge: true});

  return {
    architectureId: documentRef.id,
  };
});

export const listUserArchitectures = onCall(async (request) => {
  const uid = assertSignedIn(request.auth?.uid);
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
