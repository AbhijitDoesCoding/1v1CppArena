import admin from "firebase-admin";

// Initialize the Admin SDK once per warm serverless instance.
// Credentials come from a service-account, injected via Vercel env vars
// (NOT committed). The private key's newlines are escaped in the env var.
export function initFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  return { admin, rtdb: admin.database(), db: admin.firestore() };
}
