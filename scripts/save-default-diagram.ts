import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  defaultArchitectureEdges,
  defaultArchitectureName,
  defaultArchitectureNodes,
  defaultArchitectureViewport,
} from "../src/data/default-architecture.ts";

const DEFAULT_USER_EMAIL = "gperez78@gmail.com";

function getServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  if (!b64) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON_BASE64.");
  }

  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

function getTargetEmail() {
  return process.env.ARCHITECTURE_USER_EMAIL ?? DEFAULT_USER_EMAIL;
}

const app = initializeApp({ credential: cert(getServiceAccount()) });
const auth = getAuth(app);
const db = getFirestore(app);

const userRecord = await auth.getUserByEmail(getTargetEmail());
const collectionRef = db
  .collection("users")
  .doc(userRecord.uid)
  .collection("architectures");
const docRef = collectionRef.doc();

await docRef.set({
  name: defaultArchitectureName,
  nodes: defaultArchitectureNodes,
  edges: defaultArchitectureEdges,
  viewport: defaultArchitectureViewport,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

console.log(`User: ${userRecord.email} (${userRecord.uid})`);
console.log(`Architecture ID: ${docRef.id}`);
console.log(`Link: https://cloudish-feb6a.web.app/?p=${docRef.id}`);
console.log(`Local: http://localhost:5173/?p=${docRef.id}`);
