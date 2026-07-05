import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();
const rtdb = admin.database();
const db = admin.firestore();

function computeElo(winner: number, loser: number, k = 32): [number, number] {
  const expW = 1 / (1 + 10 ** ((loser - winner) / 400));
  const expL = 1 / (1 + 10 ** ((winner - loser) / 400));
  return [Math.round(winner + k * (1 - expW)), Math.round(loser + k * (0 - expL))];
}

export const finalizeMatch = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  const matchId = data?.matchId;
  if (!matchId) throw new functions.https.HttpsError("invalid-argument", "matchId required.");

  const matchRef = rtdb.ref(`matches/${matchId}`);

  // Atomically claim the win. Only succeeds if the match is still active.
  const tx = await matchRef.transaction((match) => {
    if (!match || match.status !== "active") return; // abort
    if (!match.players?.[uid]) return; // not a participant
    match.status = "finished";
    match.winner = uid;
    match.players[uid].finished = true;
    return match;
  });

  if (!tx.committed || tx.snapshot.val()?.winner !== uid) {
    return { won: false }; // someone else already won, or invalid
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

  return { won: true };
});
