import { ref, runTransaction, set, get, onValue, off } from "firebase/database";
import { rtdb } from "./firebase";
import { buildMatch } from "./match";
import type { UserProfile, Match } from "../types";

interface QueueSlot {
  uid: string;
  name: string;
  elo: number;
}

// Join a single-slot queue. The joiner either occupies the slot (and waits on
// their inbox) or atomically consumes an existing occupant and becomes the
// matchmaker that builds the match. Returns a cancel function.
export async function joinQueue(
  me: UserProfile,
  onMatched: (matchId: string) => void
): Promise<() => void> {
  const slotRef = ref(rtdb, "queue/slot");
  let opponent: QueueSlot | null = null;

  const tx = await runTransaction(slotRef, (slot: QueueSlot | null) => {
    if (slot && slot.uid !== me.uid) {
      opponent = slot; // consume the waiting player
      return null; // clear the slot
    }
    return { uid: me.uid, name: me.displayName, elo: me.elo }; // occupy slot
  });

  if (opponent) {
    // We are the matchmaker: build the ranked match in RTDB.
    const opp = opponent as QueueSlot;
    const match = buildMatch(
      { uid: me.uid, name: me.displayName },
      { uid: opp.uid, name: opp.name },
      "ranked",
      tx.snapshot.key ?? "x"
    );
    const matchId = match.id;
    await set(ref(rtdb, `matches/${matchId}`), match);
    await set(ref(rtdb, `inbox/${opp.uid}`), { matchId }); // notify waiter
    onMatched(matchId);
    return () => {};
  }

  // We are waiting: listen on our inbox for a match assignment.
  const inboxRef = ref(rtdb, `inbox/${me.uid}`);
  const listener = onValue(inboxRef, (snap) => {
    const val = snap.val();
    if (val?.matchId) {
      onMatched(val.matchId);
      set(inboxRef, null); // clear inbox
      off(inboxRef, "value", listener);
    }
  });

  // Cancel: stop listening and leave the slot if it's still ours.
  return async () => {
    off(inboxRef, "value", listener);
    const cur = await get(slotRef);
    if (cur.val()?.uid === me.uid) await set(slotRef, null);
  };
}

// Live match subscription used by the Duel Room.
export function subscribeMatch(matchId: string, cb: (m: Match | null) => void) {
  const r = ref(rtdb, `matches/${matchId}`);
  const l = onValue(r, (s) => cb(s.val()));
  return () => off(r, "value", l);
}

// Push my live progress (char count) for the opponent to see.
export function pushProgress(matchId: string, uid: string, progress: number) {
  set(ref(rtdb, `matches/${matchId}/players/${uid}/progress`), progress);
}
