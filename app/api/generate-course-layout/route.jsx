import { coursesTable } from '@/config/schema';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import {
  GoogleGenAI,
} from '@google/genai';
import { NextResponse } from 'next/server';
import axios from 'axios';


const PROMT =`Generate Learning Course depends on following details. In which Make sure to add Course Name Description, Chapter Name+ Image Prompt (Create a modern, flat-style 2D digital illustration representing user Topic. Include UI/UX elements such as mockup screens, text blocks, icons, buttons, and creative workspace tools. Add symbolic elements related to user Course, like sticky notes, design components, and visual aids. Use a vibrant color palette (blues, purples, oranges) with a clean, professional look. The illustration should feel creative, tech-savvy, and educational, ideal for visualizing concepts in user Course) for Course Banner in 3d format, Topic under each chapters , Duration for each chapters etc, in JSON format only.
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
, User Input:`

export async function POST(req) {
    const {courseId ,...formData}=await req.json();
    const user = await currentUser();
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    imageConfig: {
      imageSize: '1K',
    },
  };
  const model = 'gemini-2.5-flash';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: PROMT + JSON.stringify(formData),
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });
  console.log(response.candidates[0].content.parts[0].text);
  const RawResp=response?.candidates[0]?.content?.parts[0]?.text
  const RawJson = RawResp.replace('```json','').replace('```','');
  const JSONResp = JSON.parse(RawJson);
  const ImagePrompt=JSONResp.course?.imagePrompt;

  //generate Image
  const bannerImageUrl=await GenerateImage(ImagePrompt);

  //save to database
    await db.insert(coursesTable).values({
    ...formData,
    courseJson:JSONResp,
    userEmail:user?.primaryEmailAddress?.emailAddress,
    cid: courseId,
    noOfChapters: JSONResp.course.noOfChapters,
    bannerImageUrl:bannerImageUrl,
    
  });

  return NextResponse.json({courseId: courseId});
}

const GenerateImage=async(imagePrompt)=>{
  const BASE_URL='https://aigurulab.tech';
const result = await axios.post(BASE_URL+'/api/generate-image',
        {
            width: 1024,
            height: 1024,
            input: imagePrompt,
            model: 'sdxl',//'flux'
            aspectRatio:"16:9"//Applicable to Flux model only
        },
        {
            headers: {
                'x-api-key': process.env.AI_GURU_LAB_API_KEY, // Your API Key
                'Content-Type': 'application/json', // Content Type
            },
        })
        console.log(result.data.image) 
        return result.data.image

}