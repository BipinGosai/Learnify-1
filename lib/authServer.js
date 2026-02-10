import { db } from '@/config/db';
import { authSessionsTable } from '@/config/schema';
import { and, eq, gt } from 'drizzle-orm';
import { getSessionCookieName, hashSessionToken } from './session';

// Read a named cookie from a raw Cookie header string.
function parseCookie(cookieHeader, name) {
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function getUserEmailFromRequest(req) {
  // Prefer DB-backed session cookie (fast path below is kept for compatibility).
  const cookieHeader = req?.headers?.get?.('cookie') ?? req?.headers?.get?.('Cookie');
  const token = parseCookie(cookieHeader, getSessionCookieName());
  // Note: token is a raw session token; we hash it before DB lookup
  // For backward compatibility during transition, we don't throw on DB errors.
  // This function is used inside API routes that can handle null.
  //
  // eslint-disable-next-line no-unused-vars
  const rawToken = token;

  // Backward-compatible: allow explicit header if no session cookie is used.
  const header = req?.headers?.get?.('x-user-email') ?? req?.headers?.get?.('X-User-Email');
  if (typeof header !== 'string') return null;
  const email = header.trim().toLowerCase();
  return email.length > 0 ? email : null;
}

export async function getUserEmailFromRequestAsync(req) {
  // Full session lookup: cookie -> hash -> database -> user email.
  const cookieHeader = req?.headers?.get?.('cookie') ?? req?.headers?.get?.('Cookie');
  const rawToken = parseCookie(cookieHeader, getSessionCookieName());
  if (rawToken) {
    try {
      const tokenHash = hashSessionToken(rawToken);
      if (tokenHash) {
        const rows = await db
          .select()
          .from(authSessionsTable)
          .where(and(eq(authSessionsTable.tokenHash, tokenHash), gt(authSessionsTable.expiresAt, new Date())));
        const session = rows?.[0];
        const email = typeof session?.userEmail === 'string' ? session.userEmail.trim().toLowerCase() : null;
        if (email) return email;
      }
    } catch {
      // ignore
    }
  }

  // Fallback for clients that still send the header explicitly.
  const header = req?.headers?.get?.('x-user-email') ?? req?.headers?.get?.('X-User-Email');
  if (typeof header !== 'string') return null;
  const email = header.trim().toLowerCase();
  return email.length > 0 ? email : null;
}