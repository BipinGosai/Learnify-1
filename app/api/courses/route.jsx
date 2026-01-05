import crypto from "crypto";
import { db } from "@/config/db";
import { coursesTable } from "@/config/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUserEmailFromRequestAsync } from "@/lib/authServer";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId"); // string
        const userEmail = await getUserEmailFromRequestAsync(req);

        //  EXPLORE PAGE: show only verified courses from ALL users
        if (courseId === "0") {
            const result = await db
                .select()
                .from(coursesTable)
                .where(
                    and(
                        sql`${coursesTable.courseContent}::jsonb != '{}'::jsonb`,
                        eq(coursesTable.reviewStatus, 'verified')
                    )
                )
                .orderBy(desc(coursesTable.id));

            return NextResponse.json(result || []);
        }

        // Protected routes
        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Single course (owner only; used by edit-course page)
        if (courseId) {
            const rows = await db
                .select()
                .from(coursesTable)
                .where(eq(coursesTable.cid, courseId));

            const course = rows?.[0];

            // No course with this id anywhere in the system
            if (!course) {
                return NextResponse.json(null, { status: 404 });
            }

            // If the requester owns the course, return it as-is
            if (course.userEmail === userEmail) {
                return NextResponse.json(course);
            }

            // If the requester already cloned this course (by name), reuse that copy
            const courseName = course?.name || course?.courseJson?.course?.name || "";
            if (courseName) {
                const existingCopy = await db
                    .select()
                    .from(coursesTable)
                    .where(and(eq(coursesTable.userEmail, userEmail), eq(coursesTable.name, courseName)));

                if (existingCopy?.[0]) {
                    return NextResponse.json({ ...existingCopy[0], duplicatedFrom: course.cid });
                }
            }

            // Clone the course for the new user so they can edit/verify independently
            const newCid = crypto.randomUUID();
            const [clonedCourse] = await db
                .insert(coursesTable)
                .values({
                    cid: newCid,
                    courseDomain: course?.courseDomain || newCid,
                    name: course?.name,
                    description: course?.description,
                    noOfChapters: course?.noOfChapters,
                    includeVideo: course?.includeVideo,
                    level: course?.level,
                    category: course?.category,
                    courseJson: course?.courseJson,
                    bannerImageUrl: course?.bannerImageUrl,
                    courseContent: course?.courseContent,
                    userEmail,
                    reviewStatus: "draft",
                    reviewRequestedAt: null,
                    reviewTokenHash: null,
                    reviewProfessorEmail: null,
                    reviewFeedback: null,
                    reviewReviewedAt: null,
                })
                .returning();

            return NextResponse.json({ ...clonedCourse, duplicatedFrom: course.cid });
        }

        //  User's own courses
        const result = await db
            .select()
            .from(coursesTable)
            .where(
                eq(
                    coursesTable.userEmail,
                    userEmail
                )
            )
            .orderBy(desc(coursesTable.id));

        return NextResponse.json(result || []);

    } catch (error) {
        console.error("Error in courses API:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch courses",
                message: error.message,
            },
            { status: 500 }
        );
    }
}

export async function DELETE(req) {
    try {
        const userEmail = await getUserEmailFromRequestAsync(req);
        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await req.json();
        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        // Verify course ownership
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
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Delete the course
        await db.delete(coursesTable).where(eq(coursesTable.cid, courseId));

        return NextResponse.json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting course:", error);
        return NextResponse.json(
            {
                error: "Failed to delete course",
                message: error.message,
            },
            { status: 500 }
        );
    }
}
