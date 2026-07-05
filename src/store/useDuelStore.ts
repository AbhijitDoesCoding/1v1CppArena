import { create } from "zustand";
import type { UserProfile, Match } from "../types";

type QueueStatus = "idle" | "searching" | "matched";

interface DuelState {
  profile: UserProfile | null;
  queueStatus: QueueStatus;
  matchId: string | null;
  match: Match | null;
  authReady: boolean;

  setProfile: (p: UserProfile | null) => void;
  setQueueStatus: (s: QueueStatus) => void;
  setMatch: (id: string | null, m: Match | null) => void;
  setAuthReady: (v: boolean) => void;
  reset: () => void;
}

export const useDuelStore = create<DuelState>((set) => ({
  profile: null,
  queueStatus: "idle",
  matchId: null,
  match: null,
  authReady: false,

  setProfile: (profile) => set({ profile }),
  setQueueStatus: (queueStatus) => set({ queueStatus }),
  setMatch: (matchId, match) => set({ matchId, match }),
  setAuthReady: (authReady) => set({ authReady }),
  reset: () => set({ queueStatus: "idle", matchId: null, match: null }),
}));
