import { cert, getApps, initializeApp } from "firebase-admin/app";
import type { ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount(): ServiceAccount {
  const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  if (!encodedServiceAccount) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON_BASE64.");
  }

  const serviceAccountJson = Buffer.from(
    encodedServiceAccount,
    "base64",
  ).toString("utf8");

  return JSON.parse(serviceAccountJson) as ServiceAccount;
}

function initializeFirebaseAdmin() {
  const [existingApp] = getApps();
  if (existingApp) {
    return existingApp;
  }

  return initializeApp({
    credential: cert(getServiceAccount()),
  });
}

export function getAdminAuth() {
  return getAuth(initializeFirebaseAdmin());
}

export function getDb() {
  return getFirestore(initializeFirebaseAdmin());
}
