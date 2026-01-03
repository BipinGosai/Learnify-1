import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing?.length) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await db
      .insert(usersTable)
      .values({ name, email, passwordHash })
      .returning();
    const user = inserted?.[0];

    return NextResponse.json({
      user: { id: user?.id, name: user?.name ?? name, email },
    });
  } catch (e) {
    console.error('/api/auth/sign-up error:', e);
    const code = e?.code ?? e?.cause?.code;
    if (code === '23505') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
