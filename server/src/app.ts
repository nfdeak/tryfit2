import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth';
import planRoutes from './routes/plan';
import trackerRoutes from './routes/tracker';
import shoppingRoutes from './routes/shopping';
import profileRoutes from './routes/profile';
import aiRoutes from './routes/ai';
import weightRoutes from './routes/weight';

/**
 * Build a CORS allowlist from environment variables. In production we accept:
 *  - the explicit CLIENT_URL
 *  - any *.vercel.app preview deploy that matches the project (regex match)
 *  - localhost (so the dev frontend can talk to a deployed API if needed)
 */
function buildCorsOptions(): cors.CorsOptions {
  const explicit = new Set<string>([
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]);
  if (process.env.CLIENT_URL) explicit.add(process.env.CLIENT_URL);
  if (process.env.FRONTEND_URL) explicit.add(process.env.FRONTEND_URL);

  // Allow any *.vercel.app preview belonging to this deployment.
  const vercelPreviewRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

  return {
    credentials: true,
    origin: (origin, callback) => {
      // Same-origin (no Origin header) — always allow.
      if (!origin) return callback(null, true);
      if (explicit.has(origin)) return callback(null, true);
      if (vercelPreviewRegex.test(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  };
}

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Health check (used by Vercel + monitoring)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      env: process.env.NODE_ENV || 'development',
      time: new Date().toISOString()
    });
  });
  // Legacy alias
  app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/plan', planRoutes);
  app.use('/api/tracker', trackerRoutes);
  app.use('/api/shopping', shoppingRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/weight', weightRoutes);

  // 404 for unknown /api routes
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'not_found' });
  });

  // Production-safe error middleware: never leak stack traces.
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const isProd = process.env.NODE_ENV === 'production';
    console.error('[server error]', err instanceof Error ? err.message : err);
    if (isProd) {
      res.status(500).json({ error: 'server_error' });
    } else {
      res.status(500).json({
        error: 'server_error',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
    }
  });

  return app;
}

const app = createApp();
export default app;
