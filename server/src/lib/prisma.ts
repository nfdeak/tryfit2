/**
 * Prisma singleton — uses the Neon serverless adapter in all environments
 * where DATABASE_URL is a PostgreSQL connection string.
 *
 * Static imports are required here: ncc (used by @vercel/node to bundle the
 * serverless function) cannot reliably resolve dynamic require() calls at
 * pack time, which caused the previous implementation to hang on cold starts.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Provide a WebSocket constructor for the Neon pool.
// Node.js 18/20 do not expose WebSocket as a global; ws is the drop-in.
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? '';

  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    // Neon serverless adapter — works on Vercel Functions and local dev
    // when DATABASE_URL points at a Neon (or any Postgres) database.
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  }

  // Fallback: standard Prisma client (useful if DATABASE_URL is not yet set)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
