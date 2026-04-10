import { PrismaClient } from '@prisma/client';

// Lazy-load Neon adapter only when needed (production) so local dev does
// not require Neon packages to be present or configured.
let neonModules: any = null;

function loadNeonModules() {
  if (neonModules) return neonModules;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaNeon } = require('@prisma/adapter-neon');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws;
  neonModules = { PrismaNeon, Pool };
  return neonModules;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  // In production (Vercel serverless) use the Neon HTTP/WebSocket adapter
  // so each cold start gets a pooled, serverless-compatible connection.
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    try {
      const { PrismaNeon, Pool } = loadNeonModules();
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const adapter = new PrismaNeon(pool);
      return new PrismaClient({ adapter });
    } catch (err) {
      // If the Neon adapter is not installed/available, fall back to the
      // standard client. This keeps local `NODE_ENV=production` builds
      // working for diagnostics without forcing Neon setup.
      console.warn('Neon adapter unavailable, using standard Prisma client:', err instanceof Error ? err.message : err);
    }
  }

  // Development / fallback — use standard Prisma connection
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
