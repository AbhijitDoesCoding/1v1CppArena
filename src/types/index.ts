export interface UserProfile {
  uid: string;
  displayName: string;
  elo: number;
  email?: string; // lowercased; used to look up players for private invites
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
export type MatchMode = "ranked" | "private";

export interface PlayerState {
  uid: string;
  displayName: string;
  progress: number; // chars typed / synced live
  finished: boolean;
}

export interface Match {
  id: string;
  problemId: string;
  mode: MatchMode; // "private" matches never affect Elo
  status: MatchStatus;
  winner: string | null;
  players: Record<string, PlayerState>;
  createdAt: number;
}

export type RoomStatus = "waiting" | "active" | "cancelled";

export interface PrivateRoom {
  id: string; // also the shareable code
  hostUid: string;
  hostName: string;
  hostElo: number;
  guestUid: string | null;
  guestName: string | null;
  status: RoomStatus;
  matchId: string | null;
  createdAt: number;
}

export interface Invite {
  id: string;
  fromUid: string;
  fromName: string;
  roomId: string;
  createdAt: number;
}
