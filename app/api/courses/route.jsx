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

        //  EXPLORE PAGE: show courses from ALL users
        if (courseId === "0") {
            const result = await db
                .select()
                .from(coursesTable)
                .where(
                    sql`${coursesTable.courseContent}::jsonb != '{}'::jsonb`
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
            const result = await db
                .select()
                .from(coursesTable)
                .where(and(eq(coursesTable.cid, courseId), eq(coursesTable.userEmail, userEmail)));

            return NextResponse.json(result[0] || null);
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
