
import { db } from "@/config/db";
import { coursesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (courseId) {
            const result = await db
                .select()
                .from(coursesTable)
                .where(eq(coursesTable.cid, courseId));
            return NextResponse.json(result[0] || null);
        } else {
            const result = await db
                .select()
                .from(coursesTable)
                .where(eq(coursesTable.userEmail, user.primaryEmailAddress?.emailAddress))
                .orderBy(desc(coursesTable.id));
            return NextResponse.json(result || []);
        }
    } catch (error) {
        console.error('Error in courses API:', error);
        return NextResponse.json(
            { 
                error: "Failed to fetch courses",
                message: error.message
            },
            { status: 500 }
        );
    }
}
