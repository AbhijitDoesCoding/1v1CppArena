import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initFirebaseAdmin } from "./_admin.js";

function computeElo(winner: number, loser: number, k = 32): [number, number] {
  const expW = 1 / (1 + 10 ** ((loser - winner) / 400));
  const expL = 1 / (1 + 10 ** ((winner - loser) / 400));
  return [Math.round(winner + k * (1 - expW)), Math.round(loser + k * (0 - expL))];
}

// Authoritative validator: verifies the caller's Firebase ID token, atomically
// claims the win (first-writer-wins), then adjusts both players' Elo. Runs on
// Vercel's free tier — no Firebase Blaze billing required.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { admin, rtdb, db } = initFirebaseAdmin();

  // Verify identity from the Authorization: Bearer <idToken> header.
  const header = req.headers.authorization ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken) return res.status(401).json({ error: "Missing token" });

  let uid: string;
  try {
    uid = (await admin.auth().verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const matchId = req.body?.matchId;
  if (!matchId) return res.status(400).json({ error: "matchId required" });

  const matchRef = rtdb.ref(`matches/${matchId}`);

  // Atomically claim the win. Only succeeds if the match is still active.
  const tx = await matchRef.transaction((match: any) => {
    if (!match || match.status !== "active") return; // abort
    if (!match.players?.[uid]) return; // not a participant
    match.status = "finished";
    match.winner = uid;
    match.players[uid].finished = true;
    return match;
  });

  if (!tx.committed || tx.snapshot.val()?.winner !== uid) {
    return res.status(200).json({ won: false });
  }

  const match = tx.snapshot.val();
  const loserUid = Object.keys(match.players).find((id) => id !== uid)!;

  // Update Elo in Firestore atomically.
  const winRef = db.doc(`users/${uid}`);
  const loseRef = db.doc(`users/${loserUid}`);
  await db.runTransaction(async (t) => {
    const [w, l] = await Promise.all([t.get(winRef), t.get(loseRef)]);
    const wElo = w.data()?.elo ?? 1000;
    const lElo = l.data()?.elo ?? 1000;
    const [nw, nl] = computeElo(wElo, lElo);
    t.update(winRef, { elo: nw });
    t.update(loseRef, { elo: nl });
  });

  return res.status(200).json({ won: true });
}
