import crypto from 'crypto';

const COOKIE_NAME = 'learnify_session';
export const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

export function getSessionCookieName() {
  return COOKIE_NAME;
}

function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function createRawSessionToken() {
  // 32 bytes -> 43-char base64url string (approx)
  return base64UrlEncode(crypto.randomBytes(32));
}

export function hashSessionToken(rawToken) {
  if (typeof rawToken !== 'string' || rawToken.length === 0) return null;
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function getSessionExpiryDate() {
  return new Date(Date.now() + ONE_WEEK_SECONDS * 1000);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_WEEK_SECONDS,
  };
}
