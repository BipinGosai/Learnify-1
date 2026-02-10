import { db } from '@/config/db';
import { eq, and, ilike, sql } from 'drizzle-orm';
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

const FEEDBACK_PROMPT = `You are given a course JSON and professor feedback. Update the course to satisfy the feedback.
Rules:
- Keep existing fields unless feedback requires changes.
- Add, remove, or rename chapters based on feedback.
- Ensure noOfChapters matches chapters.length.
- Return JSON only, matching this schema exactly.
Schema:
{
    "course": {
        "name": "string",
        "description": "string",
        "category": "string",
        "level": "string",
        "includeVideo": "boolean",
        "noOfChapters": "number",
        "chapters": [
            {
                "chapterName": "string",
                "duration": "string",
                "topics": ["string"],
                "imagePrompt": "string"
            }
        ]
    }
}
Course JSON:
`;

const TOPICS_PROMPT = `Generate a concise list of 4-6 topics for the given chapter.
Rules:
- Topics must be strings only.
- Return JSON only in this shape:
{ "topics": ["string"] }
Chapter:
`;

const normalizeCourseLayout = (input) => {
    if (!input) return null;
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            return parsed?.course ? parsed.course : parsed;
        } catch {
            return null;
        }
    }
    return input?.course ? input.course : input;
};

const applyFeedbackToCourseLayout = async (courseLayout, feedback) => {
        if (!courseLayout || !feedback) return courseLayout;
        try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const payload = {
                        course: courseLayout,
                        feedback,
                };

                const result = await model.generateContent(
                        FEEDBACK_PROMPT + JSON.stringify(payload)
                );
                const response = await result.response;
                const text = response.text();
                const rawJson = text.replace(/```json/i, '').replace(/```/g, '').trim();
                const updated = JSON.parse(rawJson);
                if (updated?.course && Array.isArray(updated.course.chapters)) {
                        return updated.course;
                }
        } catch (error) {
                console.error('Failed to apply feedback to course layout:', error);
        }
        return courseLayout;
};

    const ensureChapterTopics = async (chapter) => {
        const topics = Array.isArray(chapter?.topics) ? chapter.topics.filter(Boolean) : [];
        if (topics.length > 0) return chapter;
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(TOPICS_PROMPT + JSON.stringify({
                chapterName: chapter?.chapterName,
                duration: chapter?.duration,
            }));
            const response = await result.response;
            const text = response.text();
            const rawJson = text.replace(/```json/i, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(rawJson);
            const generatedTopics = Array.isArray(parsed?.topics) ? parsed.topics.filter(Boolean) : [];
            if (generatedTopics.length > 0) {
                return { ...chapter, topics: generatedTopics };
            }
        } catch (error) {
            console.error('Failed to generate topics for chapter:', chapter?.chapterName, error);
        }
        return { ...chapter, topics: [] };
    };

export async function POST(req) {
    const { courseJson, courseTitle, courseId } = await req.json();
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

    const baseLayout = normalizeCourseLayout(courseJson) || normalizeCourseLayout(existingCourse?.courseJson);
    let workingLayout = baseLayout;

    if (existingCourse?.reviewStatus === 'needs_changes' && existingCourse?.reviewFeedback) {
        workingLayout = await applyFeedbackToCourseLayout(baseLayout, existingCourse.reviewFeedback);
    }

    const chapters = workingLayout?.chapters;
    if (!Array.isArray(chapters) || chapters.length === 0) {
        return NextResponse.json({ error: 'courseJson.chapters is required' }, { status: 400 });
    }

    // Check for duplicate VERIFIED course with same name and category
    const courseName = (courseTitle || existingCourse?.name || workingLayout?.name || '').trim();
    const courseCategory = (workingLayout?.category || existingCourse?.category || '').trim();
    if (courseName && courseCategory) {
        const verifiedDuplicates = await db
            .select()
            .from(coursesTable)
            .where(
                and(
                    ilike(coursesTable.name, courseName),
                    ilike(coursesTable.category, courseCategory),
                    eq(coursesTable.reviewStatus, 'verified'),
                    sql`${coursesTable.courseContent}::jsonb != '{}'::jsonb`,
                    sql`${coursesTable.cid} != ${courseId}`
                )
            )
            .limit(1);

        if (verifiedDuplicates?.[0]) {
            return NextResponse.json(
                {
                    error: 'This course is already available',
                    availableCourseId: verifiedDuplicates[0].cid,
                    courseName: verifiedDuplicates[0].name,
                },
                { status: 409 }
            );
        }
    }

    const normalizedChapters = await Promise.all(chapters.map((chapter) => ensureChapterTopics(chapter)));
    const chapterNameSet = new Set(
        normalizedChapters
            .map((chapter) => (chapter?.chapterName || '').toLowerCase().trim())
            .filter(Boolean)
    );

    const promises = normalizedChapters.map(async (chapter) => {
        try {
            console.log('Generating content for chapter:', chapter?.chapterName);
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const result = await model.generateContent(PROMPT + JSON.stringify(chapter));
            const response = await result.response;
            const text = response.text();

            console.log('Raw Gemini response for', chapter?.chapterName, ':', text.substring(0, 200));

            const rawJson = text.replace(/```json/i, '').replace(/```/g, '').trim();
            let JSONResp;
            try {
                JSONResp = JSON.parse(rawJson);
                console.log('Parsed JSON for chapter', chapter?.chapterName, 'topics:', JSONResp.topics?.length || 0);
            } catch (e) {
                console.error('Failed to parse Gemini response as JSON:', e);
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
            console.error('Error generating chapter content for', chapter?.chapterName, ':', error);
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
    const filteredContent = CourseContent.filter((entry) => {
        const name = entry?.courseData?.chapterName || '';
        return chapterNameSet.size === 0
            ? true
            : chapterNameSet.has(name.toLowerCase().trim());
    });

    console.log('Generated CourseContent:', JSON.stringify(filteredContent, null, 2));

    // Save to database
    const updatedCourseJson = workingLayout
        ? { course: { ...workingLayout, noOfChapters: chapters.length } }
        : existingCourse?.courseJson;

    const dbResp = await db.update(coursesTable).set({
        courseContent: filteredContent,
        courseJson: updatedCourseJson,
        noOfChapters: chapters.length,
        reviewStatus: 'draft',
        reviewRequestedAt: null,
        reviewTokenHash: null,
        reviewProfessorEmail: null,
        reviewFeedback: null,
        reviewReviewedAt: null,
    }).where(eq(coursesTable.cid, courseId));

    console.log('DB Update Response:', dbResp);

    return NextResponse.json({
        courseName: courseTitle,
        CourseContent: filteredContent,
        courseJson: updatedCourseJson,
        dbUpdateCount: dbResp.rowCount
    });
}

const MIN_VIDEO_SECONDS = 300;

const parseIsoDurationToSeconds = (isoDuration) => {
    if (!isoDuration) return 0;
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
};

// YouTube API helper function
const GetYoutubeVideo = async (topic) => {
    try {
        const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3/search';
        
        if (!process.env.YOUTUBE_API_KEY) {
            console.warn('YOUTUBE_API_KEY not configured');
            return [];
        }
        
        const params = {
            part: 'snippet',
            q: `${topic} tutorial`,
            maxResults: 4,
            type: 'video',
            key: process.env.YOUTUBE_API_KEY
        };
        
        console.log('Fetching YouTube videos for topic:', topic);
        const resp = await axios.get(YOUTUBE_BASE_URL, { params });
        const items = resp.data.items || [];
        const videoIds = items.map(item => item.id?.videoId).filter(Boolean);
        if (!videoIds.length) {
            return [];
        }

        const detailsResp = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'contentDetails',
                id: videoIds.join(','),
                key: process.env.YOUTUBE_API_KEY
            }
        });

        const durationById = new Map(
            (detailsResp.data.items || []).map(item => [item.id, item.contentDetails?.duration])
        );

        const videos = items
            // Filter out Shorts by duration while keeping regular videos.
            .filter(item => {
                const duration = durationById.get(item.id?.videoId);
                const seconds = parseIsoDurationToSeconds(duration);
                return seconds >= MIN_VIDEO_SECONDS;
            })
            .map(item => ({
                videoId: item.id?.videoId,
                title: item.snippet?.title,
                thumbnail: item.snippet?.thumbnails?.medium?.url
            }));
        
        console.log(`Found ${videos.length} videos for topic: ${topic}`);
        return videos;
    } catch (error) {
        console.error('Error fetching YouTube videos for topic', topic, ':', error.message);
        return []; // Return empty array instead of failing the whole request
    }
};
