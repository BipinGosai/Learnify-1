import crypto from 'crypto';

// Single source of truth for the session cookie name.
const COOKIE_NAME = 'learnify_session';
export const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

export function getSessionCookieName() {
  return COOKIE_NAME;
}

// Convert bytes to a URL-safe base64 string (no +, /, or padding).
function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

// Create a raw token that can be stored in a secure cookie.
export function createRawSessionToken() {
  // 32 bytes -> 43-char base64url string (approx)
  return base64UrlEncode(crypto.randomBytes(32));
}

// Hash the raw token so the database never stores the raw value.
export function hashSessionToken(rawToken) {
  if (typeof rawToken !== 'string' || rawToken.length === 0) return null;
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Helper to get a consistent expiry date from "now".
export function getSessionExpiryDate() {
  return new Date(Date.now() + ONE_WEEK_SECONDS * 1000);
}

// Cookie settings that keep sessions secure in production.
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_WEEK_SECONDS,
  };
}
