import { Response, CookieOptions } from 'express';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Set the JWT auth cookie. In production we use SameSite=None + Secure so the
 * cookie works across the Vercel domain & any preview deploys, while local
 * development falls back to SameSite=Lax over plain http.
 */
export function setAuthCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';

  const options: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: THIRTY_DAYS_MS,
    path: '/'
  };

  res.cookie('token', token, options);
}

export function clearAuthCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/'
  });
}
