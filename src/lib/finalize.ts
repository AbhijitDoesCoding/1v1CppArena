import { auth } from "./firebase";

// Calls the same-origin Vercel serverless validator with the user's ID token.
export async function finalizeMatch(matchId: string): Promise<{ won: boolean }> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/finalizeMatch", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ matchId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `finalize failed (${res.status})`);
  }
  return res.json();
}
