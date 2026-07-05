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

## Deploy (100% free, NO billing / NO credit card)

Firebase Auth + Firestore + Realtime DB all run on the free **Spark** plan. The
only piece that would need Blaze — the authoritative validator — runs instead as
a **Vercel serverless function** (`/api/finalizeMatch`) on Vercel's free Hobby
tier. Frontend and API deploy together as one Vercel project.

1. **Firebase (Spark, free):** create the project, enable Email + Google auth,
   Firestore, and Realtime Database. Publish the rules:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,database   # rules only, no functions
   ```
2. **Service account:** Firebase console → Project settings → Service accounts →
   Generate new private key. You'll paste its fields into Vercel env vars.
3. **Vercel (free):** import the repo at vercel.com, then set env vars:
   - Frontend: all `VITE_*` keys from `.env.local.example`
   - Server: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
     (paste with literal `\n`), `FIREBASE_DATABASE_URL`
   - Deploy. Static site + `/api/finalizeMatch` go live on one origin.

Judge0 runs on the RapidAPI free tier (~50 requests/day).

## Architecture

- `src/lib/matchmaking.ts` — single-slot atomic RTDB queue with inbox handoff.
- `src/lib/judge0.ts` — runs each test case, compares stdout.
- `api/finalizeMatch.ts` — Vercel serverless validator: verifies the ID token,
  first-writer-wins win claim in RTDB, then Elo update in Firestore.
- Security rules lock `status`/`winner`/`elo` to the Admin SDK only.
