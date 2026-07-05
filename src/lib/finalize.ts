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

  // In `npm run dev` (Vite alone) there is no /api handler — the SPA fallback
  // returns index.html. Detect that and give a clear hint instead of a JSON crash.
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("API not available — run `vercel dev` (or deploy) to enable win validation");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `finalize failed (${res.status})`);
  }
  return res.json();
}
