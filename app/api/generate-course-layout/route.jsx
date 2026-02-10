import { coursesTable } from '@/config/schema'; 
import { db } from '@/config/db';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import axios from 'axios';
import { getUserEmailFromRequestAsync } from '@/lib/authServer';

// Turn a title into a URL-friendly slug.
const toSlug = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 120);

// Prompt template sent to the AI model for course layout generation.
const PROMPT = `Generate Learning Course depends on following details. In which Make sure to add Course Name Description (max 2 lines), Chapter Name+ Image Prompt (Create a modern, flat-style 2D digital illustration representing user Topic. Include UI/UX elements such as mockup screens, text blocks, icons, buttons, and creative workspace tools. Add symbolic elements related to user Course, like sticky notes, design components, and visual aids. Use a vibrant color palette (blues, purples, oranges) with a clean, professional look. The illustration should feel creative, tech-savvy, and educational, ideal for visualizing concepts in user Course) for Course Banner in 3d format, Topic under each chapters , Duration for each chapters etc, in JSON format only.
Schema:{
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
"topics": [
"string"
],
"imagePrompt": "string"
}
]
}
}
, User Input:`;

export async function POST(req) {
  try {
    // Read form data and ensure the user is authenticated.
    const { courseId, ...formData } = await req.json();
    const userEmail = await getUserEmailFromRequestAsync(req);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for duplicate VERIFIED course with same name & category.
    const courseName = (formData?.name || '').trim();
    const courseCategory = (formData?.category || '').trim();
    if (courseName && courseCategory) {
      const verifiedDuplicates = await db
        .select()
        .from(coursesTable)
        .where(
          and(
            ilike(coursesTable.name, courseName),
            ilike(coursesTable.category, courseCategory),
            eq(coursesTable.reviewStatus, 'verified'),
            sql`${coursesTable.courseContent}::jsonb != '{}'::jsonb`
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

    // Google AI content generation.
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const config = {
      thinkingConfig: { thinkingBudget: -1 },
      imageConfig: { imageSize: '1K' },
    };
    const model = 'gemini-2.5-flash';
    const contents = [
      { role: 'user', parts: [{ text: PROMPT + JSON.stringify(formData) }] },
    ];

    const response = await ai.models.generateContent({ model, config, contents });
    const rawResp = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Safe JSON parsing.
    let JSONResp;
    try {
      const rawJson = rawResp.replace(/```json/i, '').replace(/```/g, '').trim();
      JSONResp = JSON.parse(rawJson);
    } catch (err) {
      console.error('AI returned invalid JSON:', rawResp);
      return NextResponse.json({ error: 'AI returned invalid JSON', rawResp }, { status: 500 });
    }

    if (!JSONResp?.course) {
      return NextResponse.json({ error: 'AI response missing course data', rawResp }, { status: 500 });
    }

    // Generate course banner image.
    const bannerPrompt =
      (typeof JSONResp.course?.imagePrompt === 'string' && JSONResp.course.imagePrompt.trim())
        ? JSONResp.course.imagePrompt.trim()
        : (typeof JSONResp.course?.chapters?.[0]?.imagePrompt === 'string' && JSONResp.course.chapters[0].imagePrompt.trim())
          ? JSONResp.course.chapters[0].imagePrompt.trim()
          : `Create a modern course banner illustration for: ${JSONResp.course?.name ?? 'an online course'}`;

    const bannerImageUrl = await GenerateImage(bannerPrompt);

    const domainSource =
      formData.courseDomain || JSONResp.course?.name || formData.name || courseId;
    const courseDomain = toSlug(domainSource) || courseId;

    // Save course to database.
    await db.insert(coursesTable).values({
      ...formData,
      courseJson: JSONResp,
      userEmail,
      cid: courseId,
      courseDomain,
      noOfChapters: JSONResp.course.noOfChapters || 1,
      bannerImageUrl,
    });

    return NextResponse.json({ courseId });
  } catch (error) {
    console.error('Generate course error:', error);
    return NextResponse.json({ error: 'Failed to generate course', message: error.message }, { status: 500 });
  }
}

// Optional helper to generate banner art via a separate AI image API.
const GenerateImage = async (imagePrompt) => {
  const BASE_URL = 'https://aigurulab.tech';
  try {
    const apiKey = process.env.AI_GURU_LAB_API_KEY || process.env.AI_GURU_LAB_API;
    if (!apiKey) {
      return '';
    }
    if (!imagePrompt || typeof imagePrompt !== 'string') {
      return '';
    }

    const result = await axios.post(
      BASE_URL + '/api/generate-image',
      {
        width: 1024,
        height: 1024,
        input: imagePrompt,
        model: 'sdxl',
        aspectRatio: '16:9',
      },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    return result.data.image || '';
  } catch (error) {
    console.error('Banner image generation failed:', error?.message ?? error);
    return '';
  }
};
