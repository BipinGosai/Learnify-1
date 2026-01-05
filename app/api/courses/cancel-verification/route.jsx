import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/config/db';
import { coursesTable } from '@/config/schema';
import { getUserEmailFromRequestAsync } from '@/lib/authServer';

export async function POST(req) {
    try {
        const userEmail = await getUserEmailFromRequestAsync(req);
        if (!userEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { courseId } = await req.json();
        if (!courseId) {
            return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
        }

        // Verify course ownership and current status
        const courses = await db
            .select()
            .from(coursesTable)
            .where(
                and(
                    eq(coursesTable.cid, courseId),
                    eq(coursesTable.userEmail, userEmail)
                )
            )
            .limit(1);

        const course = courses?.[0];
        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        if (course.reviewStatus !== 'pending_verification') {
            return NextResponse.json(
                { error: 'Can only cancel courses in pending_verification status' },
                { status: 400 }
            );
        }

        // Reset verification fields back to draft
        await db
            .update(coursesTable)
            .set({
                reviewStatus: 'draft',
                reviewRequestedAt: null,
                reviewTokenHash: null,
                reviewProfessorEmail: null,
                reviewFeedback: null,
                reviewReviewedAt: null,
            })
            .where(eq(coursesTable.cid, courseId));

        return NextResponse.json({
            success: true,
            message: 'Verification cancelled successfully',
        });
    } catch (error) {
        console.error('Error cancelling verification:', error);
        return NextResponse.json(
            { error: 'Failed to cancel verification' },
            { status: 500 }
        );
    }
}
