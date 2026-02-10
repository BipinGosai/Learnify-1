import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { getUserEmailFromRequestAsync } from '@/lib/authServer';

export async function GET(req) {
  // Identify the requester using session cookie or header.
  const email = await getUserEmailFromRequestAsync(req);
  if (!email) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Fetch the user record for the authenticated email.
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
  const user = users?.[0];
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Return a safe, minimal user payload to the client.
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}
