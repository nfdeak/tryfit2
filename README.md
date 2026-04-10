# Fat-Loss Meal Plan Tracker

A full-stack PWA for personalised fat-loss meal planning and tracking.

**Stack:** React + TypeScript + Tailwind CSS · Node.js + Express · PostgreSQL (Neon) + Prisma · JWT Auth · Zustand · Recharts · Vite PWA · Anthropic Claude API

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Neon recommended — see below) **or** local Postgres

### 1. Install everything

From the repo root:

```bash
npm run install:all
```

This installs dependencies for the root, the server, and the client.

### 2. Configure environment variables

Copy the example env file and fill in the values:

```bash
cp .env.example server/.env
```

At minimum you need:
- `DATABASE_URL` — pooled Neon connection string (or any Postgres URL)
- `DIRECT_URL` — direct Neon connection string (used by Prisma Migrate)
- `JWT_SECRET` — long random string
- `ANTHROPIC_API_KEY` — for AI meal plan generation

### 3. Generate Prisma client + run migrations

```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run seed
```

The seed creates a test user:
- **Username:** `harshit`
- **Password:** `harshit123`

### 4. Start dev servers (client + server in one command)

```bash
npm run dev
```

- Server: http://localhost:3001
- Client: http://localhost:5173

Open http://localhost:5173 in your browser.

---

## Project Structure

```
/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── store/           # Zustand state stores
│   │   ├── hooks/           # useAuth, useTracker, useShopping, …
│   │   ├── lib/api.ts       # Centralised fetch helper
│   │   ├── types/           # TypeScript types
│   │   ├── data/            # Local data constants
│   │   └── App.tsx
│   ├── public/              # PWA manifest, icons
│   └── vite.config.ts
│
├── server/                  # Node.js + Express backend
│   ├── api/index.ts         # Vercel serverless entrypoint
│   └── src/
│       ├── app.ts           # Express app (no .listen())
│       ├── server.ts        # Local dev entry — calls .listen()
│       ├── routes/          # auth, plan, tracker, shopping, profile, ai, weight
│       ├── middleware/      # JWT auth middleware
│       ├── lib/prisma.ts    # Prisma singleton (Neon adapter in prod)
│       ├── utils/           # tdee, setAuthCookie
│       ├── data/            # Meal plan + shopping list seed data
│       ├── prisma/          # schema.prisma + migrations
│       └── seed.ts          # DB seeder
│
├── scripts/
│   └── pre-deploy-check.sh  # Pre-deploy sanity checks
├── vercel.json              # Vercel project config
├── package.json             # Monorepo orchestrator
└── .env.example
```

---

## Production Deployment (Vercel + Neon)

The repo is set up to deploy as a single Vercel project: the client builds to a static SPA and the server runs as a serverless function at `/api/*`.

### 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. From the dashboard, copy two connection strings:
   - **Pooled** (with `-pooler` in the host) → this is `DATABASE_URL`
   - **Direct** (without `-pooler`) → this is `DIRECT_URL`
3. Both should use `?sslmode=require`.

### 2. Run migrations against Neon

From your local machine, with `DATABASE_URL` and `DIRECT_URL` exported in your shell:

```bash
npm run prisma:migrate
```

(For the very first deploy you'll want `npm run prisma:migrate:dev --name init` to create the migration files, then commit them.)

Optionally seed the production DB:

```bash
npm run seed
```

### 3. Deploy to Vercel

#### Option A — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel link        # link to (or create) a Vercel project
vercel --prod
```

#### Option B — GitHub integration

1. Push the repo to GitHub.
2. Import the repo into Vercel (https://vercel.com/new).
3. Vercel auto-detects `vercel.json`. Leave the build settings as-is — they're driven from `vercel.json` and the root `package.json`.

### 4. Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Pooled Neon connection string |
| `DIRECT_URL` | Direct Neon connection string |
| `JWT_SECRET` | Long random string (`openssl rand -base64 48`) |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` (optional) |
| `GOOGLE_CLIENT_ID` | (optional) |
| `GOOGLE_CLIENT_SECRET` | (optional) |
| `GOOGLE_CALLBACK_URL` | `https://your-app.vercel.app/api/auth/google/callback` |

Set the values for **Production**, **Preview**, and **Development** as appropriate.

### 5. Verify the deployment

- Visit `https://your-app.vercel.app/api/health` — should return `{ "status": "ok", ... }`.
- Visit `https://your-app.vercel.app` — the SPA should load and you should be able to log in.

### 6. Pre-deploy sanity check

Before any deploy, run:

```bash
npm run pre-deploy
```

This validates the Prisma schema, typechecks the server, builds the client, and warns about missing env vars.

---

## Available Scripts (root)

| Script | What it does |
|---|---|
| `npm run dev` | Start server + client with hot reload |
| `npm run build` | Generate Prisma client, build server, build client |
| `npm run start` | Start the compiled server (production) |
| `npm run install:all` | Install root + server + client deps |
| `npm run seed` | Seed the database |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Apply migrations (production) |
| `npm run prisma:migrate:dev` | Create + apply a new migration locally |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run pre-deploy` | Run all pre-deploy sanity checks |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | Create account → sets cookie |
| POST | `/api/auth/login` | Login → sets cookie |
| POST | `/api/auth/logout` | Clears auth cookie |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/check-username` | Check username availability |
| GET | `/api/plan` | All 7-day meal plan data |
| GET | `/api/tracker/stats` | Eaten / adherence / streak / remaining |
| GET | `/api/tracker/week` | All 7 plan days' eaten states |
| POST | `/api/tracker/:date/:mealIndex/toggle` | Toggle meal eaten |
| GET | `/api/shopping` | All shopping items with bought state |
| POST | `/api/shopping/:key/toggle` | Toggle item bought |
| GET | `/api/profile` | Get profile + macros |
| PUT | `/api/profile` | Update profile |
| POST | `/api/ai/generate-plan` | Generate AI meal plan (rate limited) |
| GET | `/api/weight/logs` | Weight history |
| POST | `/api/weight/logs` | Log weight |
| GET | `/api/weight/projection` | Estimated date to reach target |

---

## User Accounts

### Signup
- Click the "Sign Up" tab on the login screen
- Choose a username (3–20 characters, letters/numbers/underscore)
- Set a password (minimum 6 characters)
- Complete the onboarding wizard to generate your meal plan

### Username rules
- 3–20 characters · letters, numbers, underscores only
- Case-insensitive (`Harshit` and `harshit` are the same)

### Password rules
- Minimum 6 characters · cannot be all numbers · cannot equal username

---

## PWA / Offline

The app uses Vite PWA plugin with Workbox. After the first load:
- Static assets cached cache-first
- API calls use network-first with a 5-min fallback cache
- Install via "Add to Home Screen" prompt (iOS/Android)

---

## Troubleshooting

**Vercel build fails on Prisma generate:**
The `build` script runs `prisma generate` before `tsc`, so a missing `DATABASE_URL` at build time only matters if you're trying to run migrations from the build step (you shouldn't).

**`P1001: Can't reach database`:**
Make sure `DATABASE_URL` points to the **pooled** Neon endpoint (the host contains `-pooler`) and includes `?sslmode=require`.

**CORS errors locally:**
The dev server proxies `/api` to `http://localhost:3001` automatically — make sure the server is running.

**Cookies not set in production:**
Production uses `SameSite=None; Secure`. The client and the API must be served from HTTPS origins, which they are on Vercel by default.
