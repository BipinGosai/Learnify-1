import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/config/db';
import { coursesTable } from '@/config/schema';

// Hash the token so it can be safely compared to the stored value.
function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function GET(req) {
  try {
    // Read the verification token from the query string.
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    // Find the course associated with this verification token.
    const tokenHash = sha256Hex(token);
    const rows = await db.select().from(coursesTable).where(eq(coursesTable.reviewTokenHash, tokenHash));
    const course = rows?.[0];
    if (!course) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    // Minimal info for professor review (no sensitive user data).
    const courseJson = course?.courseJson?.course;
    const courseContent = course?.courseContent;
    return NextResponse.json({
      course: {
        cid: course.cid,
        name: courseJson?.name ?? course?.name,
        description: courseJson?.description ?? course?.description,
        category: course?.category ?? courseJson?.category,
        level: course?.level ?? courseJson?.level,
        noOfChapters: course?.noOfChapters ?? courseJson?.noOfChapters,
        chapters: Array.isArray(courseJson?.chapters) ? courseJson.chapters : [],
        courseContent: Array.isArray(courseContent) ? courseContent : [],
        reviewStatus: course?.reviewStatus ?? 'draft',
        reviewFeedback: course?.reviewFeedback ?? null,
        reviewRequestedAt: course?.reviewRequestedAt ?? null,
      },
    });
  } catch (e) {
    console.error('/api/verification GET error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
