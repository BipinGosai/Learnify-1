import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/config/db';
import { coursesTable } from '@/config/schema';

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const action = typeof body?.action === 'string' ? body.action.trim() : '';
    const feedback = typeof body?.feedback === 'string' ? body.feedback.trim() : '';

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }
    if (action !== 'approve' && action !== 'request_changes') {
      return NextResponse.json({ error: 'action must be approve or request_changes' }, { status: 400 });
    }

    if (action === 'request_changes' && !feedback) {
      return NextResponse.json({ error: 'Feedback is required to reject' }, { status: 400 });
    }

    const tokenHash = sha256Hex(token);
    const rows = await db.select().from(coursesTable).where(eq(coursesTable.reviewTokenHash, tokenHash));
    const course = rows?.[0];
    if (!course) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    const nextStatus = action === 'approve' ? 'verified' : 'needs_changes';

    await db
      .update(coursesTable)
      .set({
        reviewStatus: nextStatus,
        reviewFeedback: action === 'approve' ? null : feedback,
        reviewReviewedAt: new Date(),
      })
      .where(eq(coursesTable.reviewTokenHash, tokenHash));

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (e) {
    console.error('/api/verification/review error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
