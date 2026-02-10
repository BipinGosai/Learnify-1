import { coursesTable, enrollCourseTable, professorsTable } from "@/config/schema";
import { eq, and, desc, leftJoin } from "drizzle-orm";
import { db } from "@/config/db";
import { NextResponse } from "next/server";
import { getUserEmailFromRequestAsync } from "@/lib/authServer";

const HIDDEN_COURSE_IDS = new Set([25]);

// Handle course enrollment
export async function POST(req) {
  const { courseId } = await req.json();
  const userEmail = await getUserEmailFromRequestAsync(req);

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  // Check if course is already enrolled
  const enrollCourses = await db
    .select()
    .from(enrollCourseTable)
    .where(
      and(
        eq(enrollCourseTable.userEmail, userEmail),
        eq(enrollCourseTable.cid, courseId)
      )
    );

  if (enrollCourses?.length === 0) {
    const result = await db
      .insert(enrollCourseTable)
      .values({
        cid: courseId,
        userEmail,
      })
      .returning(enrollCourseTable);

    return NextResponse.json(result);
  }

  return NextResponse.json({ resp: "Course already enrolled" });
}

// Fetch enrolled courses
export async function GET(req) {
  const userEmail = await getUserEmailFromRequestAsync(req);
  const { searchParams } = new URL(req.url);
  const courseId = searchParams?.get("courseId");

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (courseId) {
    const result = await db
      .select()
      .from(coursesTable)
      .innerJoin(enrollCourseTable, eq(coursesTable.cid, enrollCourseTable.cid))
      .leftJoin(professorsTable, eq(coursesTable.reviewProfessorEmail, professorsTable.email))
      .where(
        and(
          eq(enrollCourseTable.userEmail, userEmail),
          eq(enrollCourseTable.cid, courseId)
        )
      )
      .orderBy(desc(enrollCourseTable.id));

    const row = result?.[0];
    if (!row) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const course = row?.courses;
    if (course && HIDDEN_COURSE_IDS.has(course.id)) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }
    const professor = row?.professors;
    const reviewStatus = course?.reviewStatus ?? "draft";

    if (reviewStatus !== "verified") {
      return NextResponse.json(
        { error: "Course content is pending verification", reviewStatus },
        { status: 403 }
      );
    }

    // Ensure courseContent is properly parsed as array
    const courseContent = course?.courseContent;
    let parsedCourseContent = courseContent;
    
    if (courseContent && typeof courseContent === 'string') {
      try {
        parsedCourseContent = JSON.parse(courseContent);
      } catch (e) {
        console.error('Error parsing courseContent from DB:', e);
        parsedCourseContent = [];
      }
    }

    return NextResponse.json({
      courses: { 
        ...course, 
        courseContent: parsedCourseContent,
        verifiedBy: professor ? {
          email: professor.email,
          name: professor.name,
          specializations: professor.specializations,
          bio: professor.bio
        } : null
      },
      enrollCourse: row?.enrollCourse
    });
  }

  const result = await db
    .select()
    .from(coursesTable)
    .innerJoin(enrollCourseTable, eq(coursesTable.cid, enrollCourseTable.cid))
    .leftJoin(professorsTable, eq(coursesTable.reviewProfessorEmail, professorsTable.email))
    .where(
      and(
        eq(enrollCourseTable.userEmail, userEmail),
        eq(coursesTable.reviewStatus, "verified")
      )
    )
    .orderBy(desc(enrollCourseTable.id));

  const transformedResult = result.map(item => ({
    courses: {
      ...item.courses,
      verifiedBy: item.professors ? {
        email: item.professors.email,
        name: item.professors.name,
        specializations: item.professors.specializations,
        bio: item.professors.bio
      } : null
    },
    enrollCourse: item.enrollCourse
  }));

  const filteredResult = transformedResult.filter(item => !HIDDEN_COURSE_IDS.has(item?.courses?.id));

  return NextResponse.json(filteredResult);
}

export  async function PUT(req) {
  const {completedChapter,courseId}=await req.json();
  const userEmail = await getUserEmailFromRequestAsync(req);

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  const result=await db.update(enrollCourseTable).set({
    completedChapters:completedChapter
  }).where(and(eq(enrollCourseTable.cid,courseId),
  eq(enrollCourseTable.userEmail,userEmail)))
   .returning(enrollCourseTable)

   return NextResponse.json(result);

}