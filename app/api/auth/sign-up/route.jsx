import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const value = email.trim();
  if (!value || value.length > 254) return false;
  if (/\s/.test(value)) return false;

  const atIndex = value.indexOf('@');
  if (atIndex <= 0 || atIndex !== value.lastIndexOf('@')) return false;

  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);

  if (!/^[A-Za-z][A-Za-z0-9._+-]*$/.test(local)) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;

  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return false;
  if (domain.startsWith('-') || domain.endsWith('-') || domain.includes('..')) return false;

  const labels = domain.split('.');
  if (labels.length < 2) return false;
  if (labels.some((label) => !label || label.startsWith('-') || label.endsWith('-'))) return false;

  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,24}$/.test(tld)) return false;

  return true;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email format is invalid' }, { status: 400 });
    }
    if (password.length > 8) {
      return NextResponse.json({ error: 'Password must be 8 characters or less' }, { status: 400 });
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
