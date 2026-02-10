import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { and, eq, or, ilike } from 'drizzle-orm';

import { db } from '@/config/db';
import { coursesTable, professorsTable } from '@/config/schema';
import { getUserEmailFromRequestAsync } from '@/lib/authServer';
import { getAppBaseUrl, getProfessorEmail, sendProfessorVerificationEmail } from '@/lib/mail';

// Hash the review token for storage.
function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Quick check to ensure the course has content before review.
function isCourseContentGenerated(course) {
  const cc = course?.courseContent;
  if (!cc) return false;
  if (Array.isArray(cc)) return cc.length > 0;
  if (typeof cc === 'object') return Object.keys(cc).length > 0;
  return false;
}

// Normalize strings for comparisons.
function normalize(str = '') {
  return typeof str === 'string' ? str.toLowerCase().trim() : '';
}

// Score a professor based on how well they match the course.
function scoreProfessorForCourse(prof, courseName, courseCategory) {
  const spec = prof?.specializations;
  const specialization = Array.isArray(spec) 
    ? spec.join(', ').toLowerCase().trim()
    : normalize(spec);
  
  if (!specialization) return 0;

  let score = 0;

  // Course name word matching (primary matching)
  const courseNameWords = courseName.split(/\s+/);
  for (const word of courseNameWords) {
    if (word.length > 3 && specialization.includes(word)) {
      score += 10;  // Higher priority for course name matching
    }
  }

  // Category match (secondary)
  if (courseCategory && specialization.includes(courseCategory)) {
    score += 5;
  }

  // Partial category word match
  const categoryWords = courseCategory.split(/[&,\s]+/);
  for (const word of categoryWords) {
    if (word.length > 3 && specialization.includes(word)) score += 2;
  }

  return score;
}

// Pick the best available professor for this course.
function pickBestProfessor(course, professors) {
  const courseCategory = normalize(course?.category || course?.courseJson?.course?.category);
  const courseName = normalize(course?.name || course?.courseJson?.course?.name);
  if (!Array.isArray(professors) || professors.length === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const prof of professors) {
    const score = scoreProfessorForCourse(prof, courseName, courseCategory);
    if (score > bestScore) {
      bestScore = score;
      best = prof;
    }
  }

  return bestScore > 0 ? best : null;
}

export async function POST(req) {
  try {
    // Only the course owner can submit for verification.
    const userEmail = await getUserEmailFromRequestAsync(req);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read the course id and optional professor selection.
    const body = await req.json().catch(() => ({}));
    const courseId = typeof body?.courseId === 'string' ? body.courseId.trim() : '';
    const professorEmailInput = typeof body?.professorEmail === 'string' ? body.professorEmail.trim() : '';

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const courses = await db
      .select()
      .from(coursesTable)
      .where(and(eq(coursesTable.cid, courseId), eq(coursesTable.userEmail, userEmail)));

    const course = courses?.[0];
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Require content before asking a professor to review.
    if (!isCourseContentGenerated(course)) {
      return NextResponse.json({ error: 'Generate course content before submitting for verification' }, { status: 400 });
    }

    const currentStatus = course.reviewStatus || 'draft';
    if (currentStatus === 'pending_verification') {
      return NextResponse.json({ ok: true, status: 'pending_verification' });
    }

    // Fetch all professors for matching/validation.
    const allProfessors = await db.select().from(professorsTable);
    if (!allProfessors.length) {
      return NextResponse.json({ error: 'No professor available for this course category' }, { status: 400 });
    }

    const courseCategory = normalize(course?.category || course?.courseJson?.course?.category);
    const courseName = normalize(course?.name || course?.courseJson?.course?.name);

    let assignedProfessor = null;

    if (professorEmailInput) {
      // If a specific professor was chosen, verify they are a good match.
      const candidate = allProfessors.find((p) => normalize(p.email) === normalize(professorEmailInput));
      if (!candidate) {
        return NextResponse.json({ error: 'Selected professor is not allowed' }, { status: 400 });
      }

      const score = scoreProfessorForCourse(candidate, courseName, courseCategory);
      if (score <= 0) {
        return NextResponse.json({ error: 'Selected professor is not allowed for this course' }, { status: 400 });
      }

      assignedProfessor = candidate;
    } else {
      // Otherwise auto-assign the best matching professor.
      const best = pickBestProfessor(course, allProfessors);
      if (!best) {
        return NextResponse.json({ error: 'No professor available for this course category' }, { status: 400 });
      }
      assignedProfessor = best;
    }

    const professorEmail = assignedProfessor.email;

    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = sha256Hex(rawToken);

    const baseUrl = getAppBaseUrl();
    const verificationLink = `${baseUrl}/verify/${rawToken}`;

    // Store review state on the course.
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

    // Send the review link to the professor.
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
      professorEmail,
      professorName: assignedProfessor?.name || 'Professor',
      emailSent: emailResult.ok,
      emailReason: emailResult.ok ? undefined : emailResult.reason,
      emailMissing: emailResult.ok ? undefined : emailResult.missing,
      emailMessage: emailResult.ok ? undefined : emailResult.message,
      verificationLink: emailResult.ok ? undefined : verificationLink,
      message: `Verification submitted to ${assignedProfessor?.name || 'the assigned professor'}`
    });
  } catch (e) {
    console.error('/api/courses/submit-verification error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
