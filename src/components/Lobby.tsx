import { useEffect, useRef, useState } from "react";
import { useDuelStore } from "../store/useDuelStore";
import { joinQueue } from "../lib/matchmaking";
import {
  createRoom,
  listenRoom,
  joinRoomByCode,
  inviteByEmail,
  listenInvites,
  declineInvite,
  clearInvite,
} from "../lib/privateRoom";
import { logout } from "../lib/auth";
import type { Invite } from "../types";

type Mode = "ranked" | "private";

const JOIN_ERRORS: Record<string, string> = {
  "not-found": "Room not found.",
  full: "That room is already full.",
  self: "That's your own room.",
  cancelled: "That room was cancelled.",
};

export default function Lobby() {
  const { profile, queueStatus, setQueueStatus, setMatch } = useDuelStore();
  const [mode, setMode] = useState<Mode>("ranked");
  const cancelRef = useRef<null | (() => void)>(null);
  const [busy, setBusy] = useState(false);

  async function findRanked() {
    if (!profile) return;
    setBusy(true);
    setQueueStatus("searching");
    cancelRef.current = await joinQueue(profile, (matchId) => {
      setQueueStatus("matched");
      setMatch(matchId, null);
    });
    setBusy(false);
  }

  function cancelRanked() {
    cancelRef.current?.();
    cancelRef.current = null;
    setQueueStatus("idle");
  }

  return (
    <div className="min-h-full grid place-items-center">
      <div className="w-[420px] rounded-2xl border border-line bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{profile?.displayName}</span>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-subtle">
            {profile?.elo} Elo
          </span>
        </div>

        {/* Mode toggle */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-canvas p-1">
          {(["ranked", "private"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={queueStatus === "searching"}
              className={
                "rounded-md py-1.5 text-sm font-medium capitalize transition disabled:opacity-40 " +
                (mode === m ? "bg-ink text-white" : "text-subtle hover:text-ink")
              }
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {mode === "ranked" ? (
            <>
              <p className="mb-6 text-center text-sm text-subtle">
                {queueStatus === "searching"
                  ? "Searching for an opponent…"
                  : "Get matched with a random player. Winner gains Elo."}
              </p>
              {queueStatus === "searching" ? (
                <button
                  onClick={cancelRanked}
                  className="w-full rounded-lg border border-line py-2.5 text-sm font-medium hover:bg-canvas"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={findRanked}
                  disabled={busy}
                  className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  Find Match
                </button>
              )}
            </>
          ) : (
            <PrivatePanel onEnterMatch={(matchId) => setMatch(matchId, null)} />
          )}
        </div>

        {profile && (
          <InviteInbox uid={profile.uid} onEnterMatch={(id) => setMatch(id, null)} />
        )}

        <button
          onClick={() => logout()}
          className="mt-6 block w-full text-center text-xs text-subtle hover:text-ink"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function PrivatePanel({ onEnterMatch }: { onEnterMatch: (matchId: string) => void }) {
  const { profile } = useDuelStore();
  const [roomId, setRoomId] = useState<string | null>(null);
  const cancelRef = useRef<null | (() => Promise<void>)>(null);
  const unsubRef = useRef<null | (() => void)>(null);

  const [email, setEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Tear down room + listener on unmount.
  useEffect(() => {
    return () => {
      unsubRef.current?.();
      cancelRef.current?.();
    };
  }, []);

  async function create() {
    if (!profile) return;
    setBusy(true);
    const { roomId: id, cancel } = await createRoom(profile);
    cancelRef.current = cancel;
    setRoomId(id);
    unsubRef.current = listenRoom(id, (room) => {
      if (room?.matchId) onEnterMatch(room.matchId);
    });
    setBusy(false);
  }

  async function leaveRoom() {
    unsubRef.current?.();
    await cancelRef.current?.();
    unsubRef.current = null;
    cancelRef.current = null;
    setRoomId(null);
    setInviteMsg(null);
    setEmail("");
  }

  async function invite() {
    if (!profile || !roomId || !email.trim()) return;
    setInviteMsg(null);
    const res = await inviteByEmail(profile, roomId, email.trim());
    setInviteMsg(
      res === "sent"
        ? `Invite sent to ${email.trim()}.`
        : res === "self"
        ? "You can't invite yourself."
        : "No account with that email — share the code instead."
    );
    if (res === "sent") setEmail("");
  }

  async function join() {
    if (!profile || !joinCode.trim()) return;
    setBusy(true);
    setJoinErr(null);
    const res = await joinRoomByCode(joinCode, profile);
    setBusy(false);
    if (res.ok) onEnterMatch(res.matchId);
    else setJoinErr(JOIN_ERRORS[res.reason] ?? "Could not join.");
  }

  async function copyCode() {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; code is visible anyway */
    }
  }

  if (roomId) {
    return (
      <div className="space-y-4">
        <p className="text-center text-sm text-subtle">Private room — waiting for opponent…</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-line bg-canvas py-2.5 text-center text-lg font-semibold tracking-[0.3em]">
            {roomId}
          </code>
          <button
            onClick={copyCode}
            className="rounded-lg border border-line px-3 py-2.5 text-sm font-medium hover:bg-canvas"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div>
          <label className="text-xs text-subtle">Invite by email</label>
          <div className="mt-1 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <button
              onClick={invite}
              className="rounded-lg bg-ink px-4 text-sm font-medium text-white hover:opacity-90"
            >
              Send
            </button>
          </div>
          {inviteMsg && <p className="mt-1.5 text-xs text-subtle">{inviteMsg}</p>}
        </div>

        <button
          onClick={leaveRoom}
          className="w-full rounded-lg border border-line py-2.5 text-sm font-medium hover:bg-canvas"
        >
          Cancel room
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-center text-sm text-subtle">
          Create a room and invite a friend. Private matches are unranked.
        </p>
        <button
          onClick={create}
          disabled={busy}
          className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Create private match
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-line" />
        or join
        <span className="h-px flex-1 bg-line" />
      </div>

      <div>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            maxLength={6}
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm tracking-[0.2em] outline-none focus:border-ink"
          />
          <button
            onClick={join}
            disabled={busy}
            className="rounded-lg border border-line px-4 text-sm font-medium hover:bg-canvas disabled:opacity-50"
          >
            Join
          </button>
        </div>
        {joinErr && <p className="mt-1.5 text-xs text-red-600">{joinErr}</p>}
      </div>
    </div>
  );
}

function InviteInbox({
  uid,
  onEnterMatch,
}: {
  uid: string;
  onEnterMatch: (matchId: string) => void;
}) {
  const { profile } = useDuelStore();
  const [invites, setInvites] = useState<Invite[]>([]);

  useEffect(() => listenInvites(uid, setInvites), [uid]);

  if (invites.length === 0) return null;

  async function accept(inv: Invite) {
    if (!profile) return;
    const res = await joinRoomByCode(inv.roomId, profile);
    await clearInvite(uid, inv.id);
    if (res.ok) onEnterMatch(res.matchId);
  }

  return (
    <div className="mt-6 space-y-2 border-t border-line pt-4">
      <p className="text-xs font-medium text-subtle">Invites</p>
      {invites.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"
        >
          <span className="truncate text-sm">
            <span className="font-medium">{inv.fromName}</span> invited you
          </span>
          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={() => accept(inv)}
              className="rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              Accept
            </button>
            <button
              onClick={() => declineInvite(uid, inv.id)}
              className="rounded-md border border-line px-2.5 py-1 text-xs font-medium hover:bg-canvas"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
