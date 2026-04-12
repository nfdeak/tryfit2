import { Response, CookieOptions } from 'express';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Set the JWT auth cookie.
 *
 * On Vercel the API and frontend share the same origin thanks to the rewrites
 * in vercel.json (`/api/* → /api/index`), so we use SameSite=Lax everywhere.
 * Lax is the browser default and works correctly for same-origin requests and
 * top-level navigations (e.g. Google OAuth callback redirect).
 *
 * `secure: true` is set in production because Vercel always serves over HTTPS.
 * Using `SameSite=None` (the old setting) would require Secure and can break
 * on some browsers/versions, and is only needed for *cross-origin* cookies
 * which we don't have.
 */
export function setAuthCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';

  const options: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
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
    sameSite: 'lax',
    path: '/'
  });
}
