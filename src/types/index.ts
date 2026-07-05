export interface UserProfile {
  uid: string;
  displayName: string;
  elo: number;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  statement: string;
  starterCode: string;
  tests: { stdin: string; expected: string }[];
}

export type MatchStatus = "active" | "finished";

export interface PlayerState {
  uid: string;
  displayName: string;
  progress: number; // chars typed / synced live
  finished: boolean;
}

export interface Match {
  id: string;
  problemId: string;
  status: MatchStatus;
  winner: string | null;
  players: Record<string, PlayerState>;
  createdAt: number;
}
