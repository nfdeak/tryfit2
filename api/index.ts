import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/src/app';

/**
 * Vercel serverless entrypoint.
 * @vercel/node (ncc) bundles this file and follows all imports back through
 * server/src/ picking up dependencies from server/node_modules/ automatically.
 * No pre-compilation of the server is needed for this function.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Express's IncomingMessage-compatible interface works directly with
  // Vercel's VercelRequest/VercelResponse objects.
  return (app as unknown as (req: VercelRequest, res: VercelResponse) => void)(req, res);
}
