# 1v1 C++ Arena

Real-time algorithmic duel platform. Two players queue, get matched into a live
duel, race to solve a problem, and the first to pass all Judge0 test cases wins —
Elo is adjusted server-side by an authoritative serverless validator.

## Stack

React + Vite + TypeScript · Tailwind (light theme) · Zustand · Firebase
(Auth / Firestore / Realtime DB) · Vercel serverless (`/api`) · Judge0 via
RapidAPI · Monaco editor.

## Architecture

- `src/lib/matchmaking.ts` — single-slot atomic RTDB queue with inbox handoff.
- `src/lib/judge0.ts` — runs each test case, compares stdout.
- `src/lib/finalize.ts` — calls the same-origin `/api/finalizeMatch` with the
  user's Firebase ID token.
- `api/finalizeMatch.ts` — Vercel serverless validator: verifies the token,
  first-writer-wins win claim in RTDB, then Elo update in Firestore.
- Security rules lock `status` / `winner` / `elo` to the Admin SDK only, so a
  client can never forge a win or edit its rating.

## Prerequisites

- Node 18+ and npm
- A Firebase project (Spark / free plan)
- A RapidAPI account subscribed to **Judge0 CE** (free tier)
- A Vercel account (free Hobby plan) — for local `vercel dev` and deploy

---

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in the VITE_* + RapidAPI keys
```

Two ways to run:

| Command | UI | `/api` validator | Use when |
|---|---|---|---|
| `npm run dev` | ✅ Vite dev server | ❌ (submit shows a hint) | Building UI / matchmaking |
| `vercel dev` | ✅ | ✅ serverless functions | Testing the full win flow |

For the full flow, install the CLI once and run both together:

```bash
npm install -g vercel
vercel login
vercel dev        # serves the Vite app AND /api/finalizeMatch on one origin
```

`vercel dev` reads server env vars from `.env.local` too, so add the four
`FIREBASE_*` server vars (see below) there for local testing. They are **not**
prefixed with `VITE_` and are never bundled into the frontend.

---

## Deploy (100% free — NO billing, NO credit card)

Firebase Auth + Firestore + Realtime DB run on the free **Spark** plan. The only
server-side piece runs as a **Vercel serverless function**, so nothing ever
requires Firebase Blaze.

### 1. Firebase (Spark)

1. Create the project at console.firebase.google.com.
2. **Authentication** → enable **Email/Password** and **Google**.
3. **Firestore Database** → create (production mode).
4. **Realtime Database** → create (note the `databaseURL`).
5. **Project settings → General → Your apps** → register a Web app, copy the
   config values into your `VITE_*` env vars.
6. Publish the security rules (rules only — this never enables billing):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # pick your project
   firebase deploy --only firestore:rules,database
   ```

### 2. Service account (for the serverless validator)

Firebase console → **Project settings → Service accounts → Generate new private
key**. From the downloaded JSON you need `project_id`, `client_email`, and
`private_key`.

### 3. Vercel

1. Push this repo to GitHub, then **Import Project** at vercel.com.
2. Add **Environment Variables** (Settings → Environment Variables):

   **Frontend (from Firebase web config):**
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_DATABASE_URL
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_RAPIDAPI_KEY
   ```
   **Server (from the service-account JSON):**
   ```
   FIREBASE_PROJECT_ID
   FIREBASE_CLIENT_EMAIL
   FIREBASE_PRIVATE_KEY      # paste the full key incl. literal \n sequences
   FIREBASE_DATABASE_URL
   ```
3. **Deploy.** The static site and `/api/finalizeMatch` go live on one origin
   (no CORS to configure).
4. In Firebase → Authentication → **Settings → Authorized domains**, add your
   Vercel domain (e.g. `your-app.vercel.app`) so Google sign-in works.

Judge0 runs on the RapidAPI free tier (~50 requests/day).

---

## What's left before it works end-to-end

- [ ] `npm install`
- [ ] Create the Firebase project + enable Auth (Email + Google), Firestore, RTDB
- [ ] Fill `.env.local` with the `VITE_*` values
- [ ] Subscribe to Judge0 CE on RapidAPI, add `VITE_RAPIDAPI_KEY`
- [ ] `firebase deploy --only firestore:rules,database` to publish the rules
- [ ] Generate the service-account key for the server env vars
- [ ] Add all env vars in Vercel (frontend + server)
- [ ] Add the Vercel domain to Firebase Authorized domains
- [ ] Push to GitHub → import in Vercel → deploy

Open two browser sessions (e.g. one normal, one incognito), sign in as two
users, click **Find Match** in both — you'll be matched, and the first to submit
a passing solution wins with a live Elo update.
