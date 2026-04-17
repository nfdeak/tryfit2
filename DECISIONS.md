# Architectural Decisions

## 1. SQLite over PostgreSQL
**Decision**: Use SQLite (`file:./dev.db`) instead of PostgreSQL.
**Reason**: No Docker available on the dev machine. SQLite is zero-config, runs in-process, and Prisma supports it natively. JSON arrays are stored as serialized strings and parsed in route handlers.
**Trade-off**: No native JSON column type; manual `JSON.parse()` / `JSON.stringify()` required for array fields.

## 2. User ID as CUID String
**Decision**: Changed User `id` from auto-increment Int to `@default(cuid())` String.
**Reason**: Google OAuth users need a stable ID before database insertion. CUIDs are URL-safe, globally unique, and don't leak sequence information. All foreign keys (`userId`) across models reference this string ID.

## 3. Manual Google OAuth (no Passport.js)
**Decision**: Implement Google OAuth 2.0 flow manually using `fetch()` calls to Google's token and userinfo endpoints.
**Reason**: Avoids adding Passport middleware complexity for a single OAuth provider. The flow is straightforward: redirect → callback → exchange code → fetch profile → find-or-create user → issue JWT cookie → redirect to frontend.

## 4. JWT in httpOnly Cookies
**Decision**: Store JWT tokens in httpOnly, SameSite=Lax cookies instead of localStorage.
**Reason**: httpOnly cookies are not accessible via JavaScript, preventing XSS token theft. SameSite=Lax allows the Google OAuth redirect flow while blocking CSRF from third-party sites.

## 5. Zustand for State Management
**Decision**: Use Zustand over Redux or React Context.
**Reason**: Minimal boilerplate, no providers needed, excellent TypeScript support, and built-in shallow equality checks. The app's state is moderate in complexity — Zustand handles it cleanly without Redux's ceremony.

## 6. AI Meal Plan Generation via Claude API
**Decision**: Use Anthropic's Claude API for generating personalised 7-day meal plans.
**Reason**: Claude excels at structured JSON generation from natural language prompts. The prompt includes all user profile data (macros, preferences, allergies, cuisine, equipment) to produce contextually relevant meal plans.
**Rate limit**: 3 generations per user per day (in-memory map).

## 7. TDEE Calculation: Mifflin-St Jeor
**Decision**: Use Mifflin-St Jeor equation for BMR calculation.
**Reason**: Most accurate BMR formula for the general population (within ±10%). Combined with activity level multipliers and diet intensity deficits (300/500/750 kcal) to derive daily calorie targets.

## 8. Variable Meals Per Day (3/4/5)
**Decision**: Support 3, 4, or 5 meals per day as a user preference.
**Reason**: Different dietary approaches (IF, standard, frequent feeding) require different meal counts. The tracker, calendar dots, and plan view all dynamically adapt to the user's chosen meal count.

## 9. Shopping List People Multiplier
**Decision**: Client-side quantity multiplication (1-5x) with server-persisted people count.
**Reason**: Keeps the shopping list generation simple (always for 1 person) while allowing families to scale quantities. The multiplier is applied in the UI using `multiplyQuantity()` — no re-generation needed.

## 10. Onboarding as Gated Flow
**Decision**: Users must complete a 7-step onboarding wizard before accessing the main app.
**Reason**: AI meal plan generation requires body stats, preferences, and goals. The onboarding collects all necessary data in a guided, mobile-friendly flow. Users can skip AI generation and use hardcoded plans as fallback.

## 11. Optimistic UI for Meal Tracking
**Decision**: Toggle meal eaten status optimistically in Zustand, then sync to server. Rollback on failure.
**Reason**: Immediate visual feedback is critical for a tracking app. The toggle operation is low-risk (idempotent PUT), and the server is the source of truth on page reload.

## 13. Custom Meal Plan Instructions via Free-Text Input
**Decision**: Add a free-text textarea (max 500 chars) in the Profile tab to let users provide natural language customisation instructions for AI meal plan generation.
**Reason**: Users need fine-grained control beyond profile preferences (e.g. "more eggs at breakfast", "avoid rajma this week"). Instructions are appended to the Claude prompt with highest priority (after allergy/safety restrictions). Auto-saved with 500ms debounce to avoid a manual save button.
**Trade-off**: Using `claude-sonnet-4-20250514` (not Haiku) since the deprecated Haiku model is unavailable as of April 2026. Custom instructions are persisted in DB (not ephemeral) so they carry over across regenerations — user must explicitly clear them.

## 12. PWA with Workbox Runtime Caching
**Decision**: Cache Google Fonts with CacheFirst, API responses with NetworkFirst.
**Reason**: Fonts rarely change (365-day cache). API data should always try network first for freshness, falling back to cache for offline resilience.

## 15. Vercel + Neon Production Deployment
**Decision**: Deploy as a single Vercel project with the React SPA and an Express API serverless function. Use Neon serverless PostgreSQL via `@prisma/adapter-neon` + `@neondatabase/serverless` (with `ws` for the WebSocket pool) for both local dev and production. This supersedes decision #1 (SQLite for local dev).
**Reason**: Vercel + Neon is the lowest-friction free-tier path for a JWT-cookie SPA + Express API. The Neon driver adapter avoids cold-start TCP connection cost on serverless by using HTTP/WebSocket pooling. Splitting `src/index.ts` into `src/app.ts` (no `.listen()`) + `src/server.ts` (local dev `.listen()`) + `api/index.ts` (Vercel handler) gives the same Express app a production serverless entry without forking code. Moving local dev to Neon (free tier branch) eliminates provider drift between environments — migrations behave identically everywhere.
**Trade-off**: Local dev now requires a Neon connection string instead of a zero-config SQLite file, so the first-time setup has one extra step. The existing local SQLite users database is not migrated — seed script must be re-run against Neon. `schema.postgres.prisma` is kept as a backup copy of the active schema.

## 16. Lazy-Loaded Neon Adapter
**Decision**: The Prisma singleton in `server/src/lib/prisma.ts` only requires `@prisma/adapter-neon` / `@neondatabase/serverless` / `ws` when `NODE_ENV === 'production'` and `DATABASE_URL` is set. Otherwise it falls back to a standard `new PrismaClient()`.
**Reason**: Keeps local development working when Neon-related env vars aren't configured, and lets the test/migration scripts use the standard client without pulling in serverless dependencies.

## 14. Username/Password Signup (No Email Verification)
**Decision**: Add a simple signup flow with just username + password — no email, no OTP, no verification. Usernames stored lowercase and matched case-insensitively. Passwords hashed with bcrypt (saltRounds: 12). Rate limit: 5 signups per IP per hour, 30 username checks per minute.
**Reason**: Keep friction low for new users while providing basic abuse protection. Username uniqueness is enforced case-insensitively by normalising to lowercase before storage and lookup. Login endpoint falls back to exact-match lookup for any legacy mixed-case accounts.
**Trade-off**: No password recovery (no email on file), no account deduplication across Google+credentials (a user may have both). Reserved usernames (admin, root, system, support, help, dietplan, api, null, undefined) are blocked server-side and client-side.

---

## Production Deployment Audit (2026-04-12)

Full audit and fix pass for Vercel production deployment. Below are all root causes found and files changed.

### Root Causes Found

1. **Cookie SameSite misconfiguration (CRITICAL)** — `setAuthCookie.ts` used `sameSite: 'none'` in production. Since the API and frontend share the same origin on Vercel (via rewrites), `SameSite=None` is wrong — it requires `Secure` and can cause cookies to be rejected by some browsers. Changed to `sameSite: 'lax'` (same-origin default) which works correctly for both same-origin requests and top-level navigations like Google OAuth redirects.

2. **Missing try/catch on route handlers** — Login, signup, check-username, plan GET, and week-start routes were missing try/catch, meaning any Prisma error would crash the serverless function silently instead of returning a 500 JSON response. Wrapped all async route handlers in try/catch.

3. **Prisma binary target missing for Vercel** — `schema.prisma` lacked `binaryTargets = ["native", "rhel-openssl-3.0.x"]`. Without `rhel-openssl-3.0.x`, Prisma Client fails to load on Vercel's Amazon Linux runtime.

4. **Prisma singleton not cached in production** — `prisma.ts` only cached the singleton in `globalThis` when `NODE_ENV !== 'production'`, meaning each warm Lambda invocation could create a new PrismaClient. Fixed to always cache in `globalThis`.

5. **Inconsistent API URL resolution in frontend** — `weightStore.ts` used bare `/api/...` paths (bypassing `apiUrl()`), and `Onboarding.tsx`, `ProfileTab.tsx`, `AuthScreen.tsx`, `Login.tsx`, `MealPlanCustomiser.tsx` all used bare fetch/XHR paths. Fixed all to use `apiUrl()` for consistency.

6. **Axios defaults not configured globally** — `axios.defaults.baseURL` and `axios.defaults.withCredentials` were not set, requiring every call to manually pass `withCredentials: true`. Added global config in `api.ts` imported from `main.tsx`.

7. **Missing env-var startup check** — No logging of which environment variables were missing at boot, making debugging on Vercel painful. Added startup check that logs missing required/optional vars.

8. **Error middleware leaked stack traces** — Production error handler logged `err.message` only (not the full stack). Also lacked `headersSent` guard. Fixed both.

9. **Missing unhandled rejection handler** — Unhandled promise rejections in serverless would crash silently. Added `process.on('unhandledRejection', ...)`.

10. **Deprecated PWA meta tag** — `<meta name="apple-mobile-web-app-capable">` without `<meta name="mobile-web-app-capable">` causes a console deprecation warning. Added the modern tag.

11. **Serverless function timeout too short** — `maxDuration: 30` in `vercel.json` is too short for AI meal plan generation (which streams for 30-60s). Increased to 60.

12. **Pre-deploy script wrong path** — Referenced `server/api/index.ts` instead of `api/index.ts`.

13. **Dead code in Onboarding skip flow** — Empty `POST /api/auth/login` call with no credentials was a no-op. Removed.

### Files Changed

| File | Change |
|------|--------|
| `server/src/utils/setAuthCookie.ts` | Cookie `sameSite: 'none'` → `'lax'` for same-origin Vercel deploys |
| `server/src/app.ts` | Env-var check, error middleware improvements, unhandled rejection handler |
| `server/src/lib/prisma.ts` | Always cache singleton in globalThis (prod + dev) |
| `server/src/prisma/schema.prisma` | Added `binaryTargets = ["native", "rhel-openssl-3.0.x"]` |
| `server/src/routes/auth.ts` | Added try/catch to login, signup, check-username, me |
| `server/src/routes/plan.ts` | Added try/catch to GET /plan |
| `server/src/routes/profile.ts` | Added try/catch to all route handlers |
| `server/src/routes/shopping.ts` | Added try/catch to all route handlers |
| `server/src/routes/tracker.ts` | Added try/catch to all route handlers |
| `server/src/routes/weight.ts` | Added try/catch to all route handlers |
| `client/src/lib/api.ts` | Added axios global defaults (baseURL, withCredentials) |
| `client/src/main.tsx` | Import `api.ts` before App mounts |
| `client/src/store/weightStore.ts` | Use `apiUrl()` for all fetch calls |
| `client/src/components/Onboarding.tsx` | Use `apiUrl()` for XHR, removed dead login call |
| `client/src/components/ProfileTab.tsx` | Use `apiUrl()` for XHR |
| `client/src/components/AuthScreen.tsx` | Use `apiUrl()` for Google OAuth fetch/redirect |
| `client/src/components/Login.tsx` | Use `apiUrl()` for Google OAuth fetch/redirect |
| `client/src/components/MealPlanCustomiser.tsx` | Use `apiUrl()` for meal instructions fetch |
| `client/index.html` | Added `<meta name="mobile-web-app-capable">` |
| `vercel.json` | `maxDuration: 30` → `60` |
| `scripts/pre-deploy-check.sh` | Fixed path `server/api/index.ts` → `api/index.ts` |

### Vercel Environment Variables Required

Ensure these are set in Vercel dashboard → Settings → Environment Variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `DIRECT_URL` | Yes | Neon direct (non-pooled) for migrations |
| `JWT_SECRET` | Yes | Long random string (`openssl rand -base64 48`) |
| `NODE_ENV` | Yes | Must be `production` |
| `ANTHROPIC_API_KEY` | For AI | Required for meal plan generation |
| `FRONTEND_URL` | Recommended | e.g. `https://your-app.vercel.app` — used for CORS and Google OAuth redirects |
| `CLIENT_URL` | Recommended | Same as FRONTEND_URL (legacy compat) |
| `GOOGLE_CLIENT_ID` | For OAuth | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | For OAuth | Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | For OAuth | Must match Google Console exactly, e.g. `https://your-app.vercel.app/api/auth/google/callback` |

### Deploy Commands

```bash
# Push fixes to GitHub (triggers Vercel auto-deploy)
git add -A
git commit -m "fix: production deployment audit — cookie, error handling, API paths"
git push origin main

# Or manual deploy
vercel --prod
```

### Database Sync

No schema changes were made to the data models. The only schema change was adding `binaryTargets` to the generator block, which only affects client generation (not the database). No migrations needed.

---

## 17. Meal Replacer Feature (2026-04-17)

### Overview
The Meal Replacer lets users swap any planned meal with what they actually ate,
tracking real macros against the plan. Three food data sources cascade:
Open Food Facts (free, 3M+ products) → USDA FoodData Central → Claude AI fallback.

### New Database Models

| Model | Purpose | Key constraint |
|---|---|---|
| `MealReplacement` | One replacement per meal slot per day | `@@unique([userId, date, mealIndex])` — upsert semantics |
| `FoodSearchCache` | 7-day TTL cache for combined search results | `@@unique([query, source])` |
| `RecentFoodLog` | Last 10 foods the user searched/logged | Indexed by `[userId, usedAt]` |

### Migration
```bash
# Already applied to Neon production on 2026-04-17
cd server
npx prisma migrate deploy --schema=src/prisma/schema.prisma
```

### New Environment Variables

| Variable | Where | Value |
|---|---|---|
| `USDA_API_KEY` | Vercel env vars (all environments) | `jR8QDTnz7KeQWGEgwQysUNzIBSBC6cY0OZ4KPMUk` |
| `AI_FOOD_ESTIMATE_DAILY_LIMIT` | Vercel env vars | `20` (default if unset) |

> **Action required**: Add these two env vars in the Vercel dashboard under
> Project Settings → Environment Variables for Production, Preview, Development.

### Food Data Sources

1. **Open Food Facts** (`openFoodFactsService.ts`) — Free, no API key, 8s timeout, up to 6 results, handles kJ→kcal conversion
2. **USDA FoodData Central** (`usdaService.ts`) — Free with API key, 8s timeout, nutrient IDs mapped, graceful fallback if key not set
3. **Claude AI** (`aiFoodService.ts`) — Fallback when OFF+USDA return <3 results; 20 requests/user/day rate limit; model: `claude-sonnet-4-20250514`

### Search Strategy (`food.ts /api/food/search`)
1. Check `FoodSearchCache` for unexpired combined results
2. `Promise.allSettled([OFF, USDA])` — parallel, either can fail gracefully
3. Deduplicate by normalized food name
4. If <3 results → call Claude AI for additional estimates
5. Cache combined results for 7 days
6. Passive cleanup deletes expired cache entries on each request

### Interaction Model

| Gesture | Action |
|---|---|
| Swipe left on meal card | Reveals terracotta "Replace Meal" action panel |
| Long press (mobile) | Context menu: Replace / Mark eaten |
| Right-click (desktop) | Same context menu |

### Component Architecture
```
MealsTab
├── SwipeableMealCard (per meal)
│   ├── ReplacedMealCard (if replaced — amber styling, undo button)
│   └── Normal meal card (if not)
└── MealReplacerSheet (bottom sheet modal with drag-to-dismiss)
    ├── MealReplacerSearch (screen 1: quick picks, recents, search)
    ├── MealReplacerResults (screen 2: live results with loading)
    ├── MealReplacerQuantity (screen 3: serving, quantity, live macros)
    └── MealReplacerAI (screen 4: natural language AI estimator)
```

### TrackerTab Integration
- `MealRow` shows ✏️ icon and actual food name for replaced meals
- Amber styling distinguishes replaced meals from normal ones
- Day totals in MealsTab use replacement macros when present

### State Management
- `mealReplacerStore.ts` — Zustand store with replacements keyed by `"YYYY-MM-DD-mealIndex"`
- Optimistic undo (instant UI update, revert on API failure)
- `fetchReplacementsForWeek()` loads all replacements on mount

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/food/search?q=&limit=` | GET | Combined multi-source search with caching |
| `/api/food/ai-estimate` | POST | Natural language AI macro estimation (rate-limited) |
| `/api/food/recent` | GET | Last 10 recent food logs for quick picks |
| `/api/meals/replace` | POST | Upsert replacement, auto-marks eaten, logs to recent |
| `/api/meals/replacements?date=` | GET | Replacements for a specific date |
| `/api/meals/replacements/week` | GET | All replacements for current week |
| `/api/meals/replace/:id` | DELETE | Delete replacement with ownership check |

### Accuracy Limitations
- Open Food Facts data is community-contributed; some entries may be inaccurate
- USDA provides lab-tested data but mostly US-centric foods
- AI estimates are approximations; marked with ✨ and muted styling in the UI
- All AI-estimated foods set `isAiEstimate: true` in the database

### Files Created (19)
```
server/src/services/foodTypes.ts
server/src/services/openFoodFactsService.ts
server/src/services/usdaService.ts
server/src/services/aiFoodService.ts
server/src/routes/food.ts
server/src/routes/meals.ts
server/src/prisma/migrations/20260417120000_add_meal_replacer/migration.sql
client/src/hooks/useSwipeGesture.ts
client/src/hooks/useLongPress.ts
client/src/hooks/useFoodSearch.ts
client/src/store/mealReplacerStore.ts
client/src/components/MealReplacerSheet.tsx
client/src/components/MealReplacerSearch.tsx
client/src/components/MealReplacerResults.tsx
client/src/components/MealReplacerQuantity.tsx
client/src/components/MealReplacerAI.tsx
client/src/components/FoodResultCard.tsx
client/src/components/ReplacedMealCard.tsx
```

### Files Modified (7)
```
server/src/prisma/schema.prisma     — added 3 models + User relations
server/src/app.ts                   — registered food + meals routes
client/src/types/index.ts           — added meal replacer types
client/src/components/MealsTab.tsx   — full rewrite with swipe/replace/context
client/src/components/MealRow.tsx    — replacement-aware with ✏️ badge
client/src/components/TrackerTab.tsx — fetches replacements, passes date prop
.gitignore                          — updated
```
