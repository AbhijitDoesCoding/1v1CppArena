import {
  ref,
  set,
  get,
  push,
  remove,
  runTransaction,
  onValue,
  off,
} from "firebase/database";
import { rtdb } from "./firebase";
import { buildMatch } from "./match";
import { lookupUidByEmail } from "./users";
import type { UserProfile, PrivateRoom, Invite } from "../types";

// Unambiguous alphabet (no 0/O/1/I) for human-shareable room codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// Host creates a private room. The room id doubles as the shareable code.
// Returns the code plus a cancel() that tears down a still-waiting room.
export async function createRoom(
  host: UserProfile
): Promise<{ roomId: string; cancel: () => Promise<void> }> {
  let roomId = randomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await get(ref(rtdb, `privateRooms/${roomId}`));
    if (!existing.exists()) break;
    roomId = randomCode();
  }

  const room: PrivateRoom = {
    id: roomId,
    hostUid: host.uid,
    hostName: host.displayName,
    hostElo: host.elo,
    guestUid: null,
    guestName: null,
    status: "waiting",
    matchId: null,
    createdAt: Date.now(),
  };
  await set(ref(rtdb, `privateRooms/${roomId}`), room);

  const cancel = async () => {
    const roomRef = ref(rtdb, `privateRooms/${roomId}`);
    const snap = await get(roomRef);
    if (snap.val()?.status === "waiting") {
      await set(ref(rtdb, `privateRooms/${roomId}/status`), "cancelled");
    }
  };

  return { roomId, cancel };
}

// Host subscribes to their room; fires when the guest starts the match.
export function listenRoom(roomId: string, cb: (room: PrivateRoom | null) => void) {
  const r = ref(rtdb, `privateRooms/${roomId}`);
  const l = onValue(r, (s) => cb(s.val()));
  return () => off(r, "value", l);
}

export type JoinResult =
  | { ok: true; matchId: string }
  | { ok: false; reason: "not-found" | "full" | "self" | "cancelled" };

// Guest joins by code. Atomically claims a waiting room, then (as matchmaker)
// builds the private match and links it back to the room.
export async function joinRoomByCode(
  code: string,
  me: UserProfile
): Promise<JoinResult> {
  const roomId = code.trim().toUpperCase();
  if (!roomId) return { ok: false, reason: "not-found" };

  const roomRef = ref(rtdb, `privateRooms/${roomId}`);
  let failure: "not-found" | "full" | "self" | "cancelled" | null = null;

  const tx = await runTransaction(roomRef, (room: PrivateRoom | null) => {
    if (!room) {
      failure = "not-found";
      return; // abort
    }
    if (room.hostUid === me.uid) {
      failure = "self";
      return;
    }
    if (room.status === "cancelled") {
      failure = "cancelled";
      return;
    }
    if (room.status !== "waiting" || room.guestUid) {
      failure = "full";
      return;
    }
    room.status = "active";
    room.guestUid = me.uid;
    room.guestName = me.displayName;
    return room;
  });

  if (!tx.committed || failure) {
    return { ok: false, reason: failure ?? "full" };
  }

  const room = tx.snapshot.val() as PrivateRoom;
  const match = buildMatch(
    { uid: room.hostUid, name: room.hostName },
    { uid: me.uid, name: me.displayName },
    "private",
    roomId
  );
  await set(ref(rtdb, `matches/${match.id}`), match);
  await set(ref(rtdb, `privateRooms/${roomId}/matchId`), match.id);
  return { ok: true, matchId: match.id };
}

// Send an in-app invite to the account that owns `email`. Returns "not-found"
// when no account uses that email (caller falls back to the code) or "self".
export async function inviteByEmail(
  host: UserProfile,
  roomId: string,
  email: string
): Promise<"sent" | "not-found" | "self"> {
  const target = await lookupUidByEmail(email);
  if (!target) return "not-found";
  if (target.uid === host.uid) return "self";

  const inviteRef = push(ref(rtdb, `invites/${target.uid}`));
  const invite: Omit<Invite, "id"> = {
    fromUid: host.uid,
    fromName: host.displayName,
    roomId,
    createdAt: Date.now(),
  };
  await set(inviteRef, invite);
  return "sent";
}

// Invitee subscribes to their pending invites.
export function listenInvites(uid: string, cb: (invites: Invite[]) => void) {
  const r = ref(rtdb, `invites/${uid}`);
  const l = onValue(r, (s) => {
    const val = (s.val() as Record<string, Omit<Invite, "id">> | null) ?? {};
    cb(Object.entries(val).map(([id, v]) => ({ id, ...v })));
  });
  return () => off(r, "value", l);
}

export const declineInvite = (uid: string, inviteId: string) =>
  remove(ref(rtdb, `invites/${uid}/${inviteId}`));

export const clearInvite = (uid: string, inviteId: string) =>
  remove(ref(rtdb, `invites/${uid}/${inviteId}`));
