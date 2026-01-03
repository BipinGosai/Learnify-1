import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { authSessionsTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { getSessionCookieName, hashSessionToken } from '@/lib/session';

function parseCookie(cookieHeader, name) {
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export async function POST(req) {
  try {
    const cookieHeader = req?.headers?.get?.('cookie') ?? req?.headers?.get?.('Cookie');
    const rawToken = parseCookie(cookieHeader, getSessionCookieName());
    const tokenHash = rawToken ? hashSessionToken(rawToken) : null;
    if (tokenHash) {
      await db.delete(authSessionsTable).where(eq(authSessionsTable.tokenHash, tokenHash));
    }
  } catch (e) {
    console.error('/api/auth/sign-out error:', e);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
