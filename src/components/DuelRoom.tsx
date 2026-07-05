import { useEffect, useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import { useDuelStore } from "../store/useDuelStore";
import { subscribeMatch, pushProgress } from "../lib/matchmaking";
import { runAllTests } from "../lib/judge0";
import { getProblem } from "../data/problems";
import ProblemPanel from "./ProblemPanel";
import EditorPanel from "./EditorPanel";
import OpponentStatus from "./OpponentStatus";

const finalizeMatch = httpsCallable(functions, "finalizeMatch");

export default function DuelRoom() {
  const { matchId, match, profile, setMatch, reset } = useDuelStore();
  const [submitting, setSubmitting] = useState(false);
  const [log, setLog] = useState("");
  const throttle = useRef(0);

  // Live match subscription.
  useEffect(() => {
    if (!matchId) return;
    return subscribeMatch(matchId, (m) => setMatch(matchId, m));
  }, [matchId, setMatch]);

  if (!match || !profile)
    return (
      <div className="grid min-h-full place-items-center text-sm text-subtle">Loading match…</div>
    );
  const problem = getProblem(match.problemId);

  // Throttled keystroke -> RTDB progress sync (opponent sees char count live).
  function onCodeChange(code: string) {
    const now = Date.now();
    if (now - throttle.current < 300) return;
    throttle.current = now;
    pushProgress(match!.id, profile!.uid, code.length);
  }

  async function onSubmit(code: string) {
    setSubmitting(true);
    setLog("Compiling & running tests…");
    const result = await runAllTests(problem, code);
    setLog(result.log);
    if (result.allPassed) {
      try {
        const res: any = await finalizeMatch({ matchId: match!.id });
        setLog(res.data?.won ? "🏆 You won! Elo updated." : "Match already finished.");
      } catch (e: any) {
        setLog("Validation error: " + e.message);
      }
    }
    setSubmitting(false);
  }

  // Match ended banner.
  if (match.status === "finished") {
    const won = match.winner === profile.uid;
    return (
      <div className="grid min-h-full place-items-center">
        <div className="w-[380px] rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold">{won ? "Victory 🏆" : "Defeat"}</h2>
          <p className="mt-2 text-sm text-subtle">
            {won ? "You solved it first." : "Opponent finished first."}
          </p>
          <button
            onClick={reset}
            className="mt-6 w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-screen grid-cols-[minmax(320px,420px)_1fr]">
      <div className="flex flex-col">
        <ProblemPanel problem={problem} />
        <OpponentStatus match={match} meUid={profile.uid} />
      </div>
      <EditorPanel
        problem={problem}
        onChange={onCodeChange}
        onSubmit={onSubmit}
        submitting={submitting}
        log={log}
      />
    </div>
  );
}
