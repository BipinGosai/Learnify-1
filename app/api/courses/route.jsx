import crypto from "crypto";
import { db } from "@/config/db";
import { coursesTable, professorsTable } from "@/config/schema";
import { and, desc, eq, sql, leftJoin } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUserEmailFromRequestAsync } from "@/lib/authServer";

const HIDDEN_COURSE_IDS = new Set([25]);

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId"); // string
        const scope = searchParams.get("scope");
        const userEmail = await getUserEmailFromRequestAsync(req);

        //  EXPLORE PAGE: show only verified courses from ALL users
        if (scope === "explore" || courseId === "0") {
            const result = await db
                .select({
                    course: coursesTable,
                    professor: professorsTable,
                })
                .from(coursesTable)
                .leftJoin(professorsTable, eq(coursesTable.reviewProfessorEmail, professorsTable.email))
                .where(
                    and(
                        sql`${coursesTable.courseContent}::jsonb != '{}'::jsonb`,
                        eq(coursesTable.reviewStatus, 'verified')
                    )
                )
                .orderBy(desc(coursesTable.id));

            // Transform the result to flatten the structure
            const transformedResult = result.map(item => ({
                ...item.course,
                verifiedBy: item.professor ? {
                    email: item.professor.email,
                    name: item.professor.name,
                    specializations: item.professor.specializations,
                    bio: item.professor.bio
                } : null
            }));

            const filteredResult = transformedResult.filter(course => !HIDDEN_COURSE_IDS.has(course.id));

            return NextResponse.json(filteredResult || []);
        }

        if (scope === "mine" && !userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        //  User's own courses
        const result = await db
            .select({
                course: coursesTable,
                professor: professorsTable,
            })
            .from(coursesTable)
            .leftJoin(professorsTable, eq(coursesTable.reviewProfessorEmail, professorsTable.email))
            .where(
                eq(
                    coursesTable.userEmail,
                    userEmail
                )
            )
            .orderBy(desc(coursesTable.id));

        // Transform the result to flatten the structure
        const transformedResult = result.map(item => ({
            ...item.course,
            verifiedBy: item.professor ? {
                email: item.professor.email,
                name: item.professor.name,
                specializations: item.professor.specializations,
                bio: item.professor.bio
            } : null
        }));

        return NextResponse.json(transformedResult || []);

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
