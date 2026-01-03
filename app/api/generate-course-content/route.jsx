import { db } from '@/config/db';
import { eq } from 'drizzle-orm';
import axios from 'axios';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { coursesTable } from '@/config/schema';

const PROMPT = `Depends on Chapter name and Topic. Generate content for each topic in HTML and give the response in JSON format.
Schema:
{
  "chapterName": "<>",
  "topics": [
    {
      "topic": "<>",
      "content": "<>"
    }
  ]
}
:User Input:
`;

export async function POST(req) {
    const { courseJson, courseTitle, courseId } = await req.json();
    const chapters = courseJson?.chapters;
    if (!courseId) {
        return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    // If a course is already sent for verification, regenerating content would invalidate the professor link.
    // Block it to prevent the link from appearing to "expire" early.
    const existingRows = await db.select().from(coursesTable).where(eq(coursesTable.cid, courseId));
    const existingCourse = existingRows?.[0];
    if (existingCourse?.reviewStatus === 'pending_verification') {
        return NextResponse.json(
            { error: 'Course is pending verification. Wait for professor review before regenerating content.' },
            { status: 409 }
        );
    }
    if (!Array.isArray(chapters) || chapters.length === 0) {
        return NextResponse.json({ error: 'courseJson.chapters is required' }, { status: 400 });
    }

    const promises = chapters.map(async (chapter) => {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-3-flash' });

            const result = await model.generateContent(PROMPT + JSON.stringify(chapter));
            const response = await result.response;
            const text = response.text();

            const rawJson = text.replace(/```json/i, '').replace(/```/g, '').trim();
            let JSONResp;
            try {
                JSONResp = JSON.parse(rawJson);
            } catch (e) {
                JSONResp = {
                    chapterName: chapter?.chapterName ?? 'Untitled',
                    topics: [],
                    _error: 'AI returned invalid JSON',
                    _raw: text,
                };
            }

            const youtubeData = await GetYoutubeVideo(chapter?.chapterName);
            return {
                youtubeVideo: youtubeData,
                courseData: JSONResp,
            };
        } catch (error) {
            console.error('Error generating chapter content:', error);
            return {
                youtubeVideo: [],
                courseData: {
                    chapterName: chapter?.chapterName ?? 'Untitled',
                    topics: [],
                    _error: 'Failed to generate content',
                },
            };
        }
    });

    const CourseContent = await Promise.all(promises);

    // Save to database
    const dbResp = await db.update(coursesTable).set({
        courseContent: CourseContent,
        reviewStatus: 'draft',
        reviewRequestedAt: null,
        reviewTokenHash: null,
        reviewProfessorEmail: null,
        reviewFeedback: null,
        reviewReviewedAt: null,
    }).where(eq(coursesTable.cid, courseId));

    return NextResponse.json({
        courseName: courseTitle,
        CourseContent: CourseContent
    });
}

// YouTube API helper function
const GetYoutubeVideo = async (topic) => {
    try {
        const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3/search';
        const params = {
            part: 'snippet',
            q: `${topic} tutorial`,
            maxResults: 4,
            type: 'video',
            key: process.env.YOUTUBE_API_KEY
        };
        const resp = await axios.get(YOUTUBE_BASE_URL, { params });
        return resp.data.items.map(item => ({
            videoId: item.id?.videoId,
            title: item.snippet?.title,
            thumbnail: item.snippet?.thumbnails?.medium?.url
        }));
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return []; // Return empty array instead of failing the whole request
    }
};
