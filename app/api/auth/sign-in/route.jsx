import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { authSessionsTable, usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createRawSessionToken, getSessionCookieName, getSessionCookieOptions, getSessionExpiryDate, hashSessionToken } from '@/lib/session';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
    const user = users?.[0];
    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const rawToken = createRawSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = getSessionExpiryDate();
    await db.insert(authSessionsTable).values({
      userEmail: email,
      tokenHash,
      expiresAt,
    });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
    res.cookies.set(getSessionCookieName(), rawToken, getSessionCookieOptions());
    return res;
  } catch (e) {
    console.error('/api/auth/sign-in error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
