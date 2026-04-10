import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';

/**
 * Vercel serverless entrypoint. Vercel rewrites every /api/* request to this
 * function, and Express handles the rest of the routing internally. Express
 * is fully compatible with the Node `IncomingMessage` / `ServerResponse`
 * objects that Vercel passes in, so we can hand the request straight off.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  return (app as unknown as (req: VercelRequest, res: VercelResponse) => void)(req, res);
}
