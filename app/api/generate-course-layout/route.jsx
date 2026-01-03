import { coursesTable } from '@/config/schema'; 
import { db } from '@/config/db';
import { eq } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import axios from 'axios';
import { getUserEmailFromRequestAsync } from '@/lib/authServer';

const PROMPT = `Generate Learning Course depends on following details. In which Make sure to add Course Name Description, Chapter Name+ Image Prompt (Create a modern, flat-style 2D digital illustration representing user Topic. Include UI/UX elements such as mockup screens, text blocks, icons, buttons, and creative workspace tools. Add symbolic elements related to user Course, like sticky notes, design components, and visual aids. Use a vibrant color palette (blues, purples, oranges) with a clean, professional look. The illustration should feel creative, tech-savvy, and educational, ideal for visualizing concepts in user Course) for Course Banner in 3d format, Topic under each chapters , Duration for each chapters etc, in JSON format only.
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
    const { courseId, ...formData } = await req.json();
    const userEmail = await getUserEmailFromRequestAsync(req);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Google AI content generation
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const config = {
      thinkingConfig: { thinkingBudget: -1 },
      imageConfig: { imageSize: '1K' },
    };
    const model = 'gemini-3-flash';
    const contents = [
      { role: 'user', parts: [{ text: PROMPT + JSON.stringify(formData) }] },
    ];

    const response = await ai.models.generateContent({ model, config, contents });
    const rawResp = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Safe JSON parsing
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

    // Generate course banner image
    const bannerPrompt =
      (typeof JSONResp.course?.imagePrompt === 'string' && JSONResp.course.imagePrompt.trim())
        ? JSONResp.course.imagePrompt.trim()
        : (typeof JSONResp.course?.chapters?.[0]?.imagePrompt === 'string' && JSONResp.course.chapters[0].imagePrompt.trim())
          ? JSONResp.course.chapters[0].imagePrompt.trim()
          : `Create a modern course banner illustration for: ${JSONResp.course?.name ?? 'an online course'}`;

    const bannerImageUrl = await GenerateImage(bannerPrompt);

    // Save course to database
    await db.insert(coursesTable).values({
      ...formData,
      courseJson: JSONResp,
      userEmail,
      cid: courseId,
      noOfChapters: JSONResp.course.noOfChapters || 1,
      bannerImageUrl,
    });

    return NextResponse.json({ courseId });
  } catch (error) {
    console.error('Generate course error:', error);
    return NextResponse.json({ error: 'Failed to generate course', message: error.message }, { status: 500 });
  }
}

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
