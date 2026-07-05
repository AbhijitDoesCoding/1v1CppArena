# 1v1 C++ Arena

Real-time algorithmic duel platform. Two players queue, get matched into a live
duel, race to solve a problem, and the first to pass all Judge0 test cases wins —
Elo is adjusted server-side by an authoritative Cloud Function.

## Stack

React + Vite + TypeScript · Tailwind (light theme) · Zustand · Firebase
(Auth / Firestore / Realtime DB / Functions) · Judge0 via RapidAPI · Monaco editor.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Firebase + RapidAPI keys
npm run dev
```

## Deploy (free)

- **Frontend + rules:** Firebase Hosting (Spark, free)
- **Functions:** requires Blaze, but the free allotment (2M invocations/mo)
  keeps real cost at ~$0. Set a $1 budget alert.
- **Execution:** Judge0 CE free tier on RapidAPI.

```bash
npm install -g firebase-tools
firebase login
firebase init          # Hosting, Functions, Firestore, RTDB
npm run build
cd functions && npm install && npm run build && cd ..
firebase deploy
```

## Architecture

- `src/lib/matchmaking.ts` — single-slot atomic RTDB queue with inbox handoff.
- `src/lib/judge0.ts` — runs each test case, compares stdout.
- `functions/src/index.ts` — `finalizeMatch`: first-writer-wins claim + Elo.
- Security rules lock `status`/`winner`/`elo` to the admin SDK only.
