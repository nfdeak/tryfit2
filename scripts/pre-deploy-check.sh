#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Pre-deploy sanity check.
#
# Run this before pushing to Vercel to catch the obvious foot-guns: missing
# env vars, broken Prisma schema, failing TypeScript builds, etc. The script
# is intentionally chatty so it can double as a deployment checklist.
# ----------------------------------------------------------------------------
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

YELLOW="\033[1;33m"
GREEN="\033[1;32m"
RED="\033[1;31m"
RESET="\033[0m"

step() { echo -e "\n${YELLOW}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}✓ $1${RESET}"; }
fail() { echo -e "${RED}✗ $1${RESET}"; exit 1; }

# 1. Required files
step "Checking required deployment files"
for file in vercel.json package.json api/index.ts server/src/app.ts server/src/server.ts server/src/lib/prisma.ts client/src/lib/api.ts; do
  [ -f "$file" ] || fail "Missing $file"
done
ok "All deployment files present"

# 2. Required env vars (warn only — Vercel sets these in its dashboard)
step "Checking environment variables"
REQUIRED_ENV=(DATABASE_URL DIRECT_URL JWT_SECRET ANTHROPIC_API_KEY)
MISSING=()
for var in "${REQUIRED_ENV[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
  fi
done
if [ ${#MISSING[@]} -gt 0 ]; then
  echo -e "${YELLOW}  ! The following env vars are not set in this shell:${RESET}"
  printf "${YELLOW}    - %s${RESET}\n" "${MISSING[@]}"
  echo -e "${YELLOW}  ! Make sure they are configured in Vercel's Environment Variables.${RESET}"
else
  ok "All required env vars are set"
fi

# 3. Schema validation
step "Validating Prisma schema"
( cd server && npx prisma validate --schema=src/prisma/schema.prisma >/dev/null ) && ok "Prisma schema valid" || fail "Prisma schema invalid"

# 4. Generate Prisma client
step "Generating Prisma client"
( cd server && npx prisma generate --schema=src/prisma/schema.prisma >/dev/null ) && ok "Prisma client generated" || fail "Prisma generate failed"

# 5. Server TypeScript build
step "Building server (tsc)"
( cd server && npx tsc --noEmit ) && ok "Server typecheck clean" || fail "Server typecheck failed"

# 6. Client build
step "Building client (vite build)"
( cd client && npx vite build ) && ok "Client build succeeded" || fail "Client build failed"

echo -e "\n${GREEN}All pre-deploy checks passed.${RESET}"
echo -e "${GREEN}You can now deploy with: vercel --prod${RESET}\n"
