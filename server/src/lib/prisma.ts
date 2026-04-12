/**
 * Prisma singleton.
 *
 * We use the standard PrismaClient (no Neon serverless adapter).
 * Neon's pooled connection URL (containing "-pooler" in the host) provides
 * pgBouncer connection pooling at the infrastructure level, so each
 * serverless invocation gets a pooled connection without requiring the
 * WebSocket adapter. This is the recommended approach for Vercel Node.js
 * functions (as opposed to Edge functions which cannot use TCP).
 *
 * The global singleton pattern prevents multiple PrismaClient instances
 * across hot-reloads in development AND across warm invocations in
 * production serverless functions.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache in globalThis for BOTH development hot-reloads AND
// production warm Lambda invocations.
globalForPrisma.prisma = prisma;

export default prisma;
