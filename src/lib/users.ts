import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "./firebase";

// Look up a player by email for private-match invites. Returns null if no
// account uses that email. Single-field equality queries are auto-indexed by
// Firestore, so no composite index is required.
export async function lookupUidByEmail(
  email: string
): Promise<{ uid: string; displayName: string } | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const snap = await getDocs(
    query(collection(db, "users"), where("email", "==", normalized), limit(1))
  );
  if (snap.empty) return null;

  const data = snap.docs[0].data() as { uid: string; displayName: string };
  return { uid: data.uid, displayName: data.displayName };
}
