import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { and, eq } from 'drizzle-orm';

import { db } from '@/config/db';
import { coursesTable } from '@/config/schema';
import { getUserEmailFromRequestAsync } from '@/lib/authServer';
import { getAppBaseUrl, getProfessorEmail, sendProfessorVerificationEmail } from '@/lib/mail';

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function isCourseContentGenerated(course) {
  const cc = course?.courseContent;
  if (!cc) return false;
  if (Array.isArray(cc)) return cc.length > 0;
  if (typeof cc === 'object') return Object.keys(cc).length > 0;
  return false;
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const v = email.trim();
  if (!v) return false;
  // Simple sanity check; not a full RFC validator.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req) {
  try {
    const userEmail = await getUserEmailFromRequestAsync(req);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const courseId = typeof body?.courseId === 'string' ? body.courseId.trim() : '';
    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const ALLOWED_PROFESSOR_EMAILS = ['bpin.gosai321@gmail.com'];
    const requestedProfessorEmailRaw = typeof body?.professorEmail === 'string' ? body.professorEmail.trim() : '';
    const professorEmail = requestedProfessorEmailRaw || ALLOWED_PROFESSOR_EMAILS[0];
    if (requestedProfessorEmailRaw && !isValidEmail(requestedProfessorEmailRaw)) {
      return NextResponse.json({ error: 'Invalid professor email' }, { status: 400 });
    }
    if (!professorEmail) {
      return NextResponse.json({ error: 'professorEmail is required' }, { status: 400 });
    }
    if (!ALLOWED_PROFESSOR_EMAILS.includes(professorEmail)) {
      return NextResponse.json({ error: 'Selected professor is not allowed' }, { status: 400 });
    }

    const courses = await db
      .select()
      .from(coursesTable)
      .where(and(eq(coursesTable.cid, courseId), eq(coursesTable.userEmail, userEmail)));

    const course = courses?.[0];
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (!isCourseContentGenerated(course)) {
      return NextResponse.json({ error: 'Generate course content before submitting for verification' }, { status: 400 });
    }

    const currentStatus = course.reviewStatus || 'draft';
    if (currentStatus === 'pending_verification') {
      return NextResponse.json({ ok: true, status: 'pending_verification' });
    }

    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = sha256Hex(rawToken);

    const baseUrl = getAppBaseUrl();
    const verificationLink = `${baseUrl}/verify/${rawToken}`;

    await db
      .update(coursesTable)
      .set({
        reviewStatus: 'pending_verification',
        reviewRequestedAt: new Date(),
        reviewTokenHash: tokenHash,
        reviewProfessorEmail: professorEmail || null,
        reviewFeedback: null,
        reviewReviewedAt: null,
      })
      .where(and(eq(coursesTable.cid, courseId), eq(coursesTable.userEmail, userEmail)));

    const emailResult = await sendProfessorVerificationEmail({
      to: professorEmail,
      courseName: course?.courseJson?.course?.name ?? course?.name,
      courseLevel: course?.level,
      courseCategory: course?.category,
      verificationLink,
    });

    return NextResponse.json({
      ok: true,
      status: 'pending_verification',
      emailSent: emailResult.ok,
      emailReason: emailResult.ok ? undefined : emailResult.reason,
      emailMissing: emailResult.ok ? undefined : emailResult.missing,
      emailMessage: emailResult.ok ? undefined : emailResult.message,
      verificationLink: emailResult.ok ? undefined : verificationLink,
    });
  } catch (e) {
    console.error('/api/courses/submit-verification error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
