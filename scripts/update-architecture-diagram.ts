import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  multiAzThreeTierArchitectureEdges,
  multiAzThreeTierArchitectureNodes,
  multiAzThreeTierArchitectureViewport,
} from "../src/data/multi-az-three-tier-architecture.ts";

const DEFAULT_USER_EMAIL = "gperez78@gmail.com";

type ParsedArgs = {
  architectureId?: string;
  email?: string;
  uid?: string;
  name?: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];

    if (arg === "--id") {
      result.architectureId = value;
      index += 1;
      continue;
    }

    if (arg === "--email") {
      result.email = value;
      index += 1;
      continue;
    }

    if (arg === "--uid") {
      result.uid = value;
      index += 1;
      continue;
    }

    if (arg === "--name") {
      result.name = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return result;
}

function getServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  if (!b64) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON_BASE64.");
  }

  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

async function getTargetUid(args: ParsedArgs) {
  if (args.uid) {
    return args.uid;
  }

  const email = args.email ?? process.env.ARCHITECTURE_USER_EMAIL ?? DEFAULT_USER_EMAIL;
  const userRecord = await getAuth().getUserByEmail(email);
  return userRecord.uid;
}

const args = parseArgs(process.argv.slice(2));
if (!args.architectureId) {
  throw new Error("Usage: tsx scripts/update-architecture-diagram.ts --id <architecture-id> [--email <email>|--uid <uid>] [--name <name>]");
}

initializeApp({ credential: cert(getServiceAccount()) });

const uid = await getTargetUid(args);
const docRef = getFirestore()
  .collection("users")
  .doc(uid)
  .collection("architectures")
  .doc(args.architectureId);
const snapshot = await docRef.get();

if (!snapshot.exists) {
  throw new Error(`Architecture not found: ${args.architectureId}`);
}

await docRef.set(
  {
    ...(args.name ? { name: args.name } : {}),
    nodes: multiAzThreeTierArchitectureNodes,
    edges: multiAzThreeTierArchitectureEdges,
    viewport: multiAzThreeTierArchitectureViewport,
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true },
);

console.log(`Updated architecture: ${args.architectureId}`);
console.log(`User UID: ${uid}`);
console.log(`Nodes: ${multiAzThreeTierArchitectureNodes.length}`);
console.log(`Edges: ${multiAzThreeTierArchitectureEdges.length}`);
console.log(`Link: https://cloudish-feb6a.web.app/?p=${args.architectureId}`);
