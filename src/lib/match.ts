import { PROBLEMS } from "../data/problems";
import type { Match, MatchMode, PlayerState } from "../types";

interface Contestant {
  uid: string;
  name: string;
}

// Build the initial Match object written to RTDB. Shared by the ranked queue
// and private rooms so the shape (and problem selection) stays in one place.
export function buildMatch(
  a: Contestant,
  b: Contestant,
  mode: MatchMode,
  keySuffix: string
): Match {
  const problem = PROBLEMS[0];
  const mkPlayer = (uid: string, displayName: string): PlayerState => ({
    uid,
    displayName,
    progress: 0,
    finished: false,
  });

  const id = `m_${a.uid.slice(0, 4)}_${b.uid.slice(0, 4)}_${keySuffix}`;
  return {
    id,
    problemId: problem.id,
    mode,
    status: "active",
    winner: null,
    players: {
      [a.uid]: mkPlayer(a.uid, a.name),
      [b.uid]: mkPlayer(b.uid, b.name),
    },
    createdAt: Date.now(),
  };
}
