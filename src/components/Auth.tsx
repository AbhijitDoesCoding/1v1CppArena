import { useState } from "react";
import { emailSignIn, emailSignUp, googleSignIn } from "../lib/auth";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    try {
      if (mode === "in") await emailSignIn(email, pw);
      else await emailSignUp(email, pw);
    } catch (e: any) {
      setErr(String(e.message).replace("Firebase:", "").trim());
    }
  }

  return (
    <div className="min-h-full grid place-items-center">
      <div className="w-[360px] rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Algorithmic Duel</h1>
        <p className="mt-1 text-sm text-subtle">Sign in to enter the arena.</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          {err && <p className="text-xs text-red-500">{err}</p>}

          <button
            onClick={submit}
            className="w-full rounded-lg bg-ink py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {mode === "in" ? "Sign in" : "Create account"}
          </button>
          <button
            onClick={() => googleSignIn()}
            className="w-full rounded-lg border border-line py-2 text-sm font-medium hover:bg-canvas"
          >
            Continue with Google
          </button>
        </div>

        <button
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 text-xs text-subtle hover:text-ink"
        >
          {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
