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
  "topics":
    {
      "topic": "<>",
      "content": "<>"
    }
}
:User Input:
`;

export async function POST(req) {
    const { courseJson, courseTitle, courseId } = await req.json();

    const promises = courseJson?.chapters?.map(async (chapter) => {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent(PROMPT + JSON.stringify(chapter));
        const response = await result.response;
        const text = response.text();

        // Clean the response
        const RawJson = text.replace('```json', '').replace('```', '').trim();
        const JSONResp = JSON.parse(RawJson);

        // Get YouTube videos
        const youtubeData = await GetYoutubeVideo(chapter?.chapterName);

        console.log({
            youtubeVideo: youtubeData,
            courseData: JSONResp
        });

        return {
            youtubeVideo: youtubeData,
            courseData: JSONResp
        };
    });

    const CourseContent = await Promise.all(promises);

    // Save to database
    const dbResp = await db.update(coursesTable).set({
        courseContent: CourseContent
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