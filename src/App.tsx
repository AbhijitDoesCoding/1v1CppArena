import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { ensureProfile } from "./lib/auth";
import { useDuelStore } from "./store/useDuelStore";
import Auth from "./components/Auth";
import Lobby from "./components/Lobby";
import DuelRoom from "./components/DuelRoom";

export default function App() {
  const { profile, setProfile, authReady, setAuthReady, matchId } = useDuelStore();

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const p = await ensureProfile(user.uid, user.displayName ?? user.email!.split("@")[0]);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setAuthReady(true);
    });
  }, [setProfile, setAuthReady]);

  if (!authReady)
    return <div className="grid min-h-full place-items-center text-sm text-subtle">Loading…</div>;
  if (!profile) return <Auth />;
  if (matchId) return <DuelRoom />;
  return <Lobby />;
}
