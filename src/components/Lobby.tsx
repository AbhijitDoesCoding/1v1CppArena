import { useRef, useState } from "react";
import { useDuelStore } from "../store/useDuelStore";
import { joinQueue } from "../lib/matchmaking";
import { logout } from "../lib/auth";

export default function Lobby() {
  const { profile, queueStatus, setQueueStatus, setMatch } = useDuelStore();
  const cancelRef = useRef<null | (() => void)>(null);
  const [busy, setBusy] = useState(false);

  async function find() {
    if (!profile) return;
    setBusy(true);
    setQueueStatus("searching");
    cancelRef.current = await joinQueue(profile, (matchId) => {
      setQueueStatus("matched");
      setMatch(matchId, null);
    });
    setBusy(false);
  }

  function cancel() {
    cancelRef.current?.();
    setQueueStatus("idle");
  }

  return (
    <div className="min-h-full grid place-items-center">
      <div className="w-[420px] rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{profile?.displayName}</span>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-subtle">
            {profile?.elo} Elo
          </span>
        </div>

        <div className="my-10">
          {queueStatus === "searching" ? (
            <p className="text-sm text-subtle animate-pulse">Searching for an opponent…</p>
          ) : (
            <p className="text-sm text-subtle">Ready when you are.</p>
          )}
        </div>

        {queueStatus === "searching" ? (
          <button
            onClick={cancel}
            className="w-full rounded-lg border border-line py-2.5 text-sm font-medium hover:bg-canvas"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={find}
            disabled={busy}
            className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Find Match
          </button>
        )}

        <button onClick={() => logout()} className="mt-4 text-xs text-subtle hover:text-ink">
          Log out
        </button>
      </div>
    </div>
  );
}
