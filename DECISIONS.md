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
