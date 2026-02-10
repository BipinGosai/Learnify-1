"use client";
import { SelectedChapterIndexContext } from "@/context/SelectedChapterIndexContext";
import React, { useContext } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, Loader2Icon } from "lucide-react";

function ChapterListSidebar({ courseInfo, isLoading = false }) {
  const course = courseInfo?.courses;
  const enrollCourse =courseInfo?.enrollCourse;
  const courseContent = courseInfo?.courses?.courseContent;
  const verifiedBy = courseInfo?.courses?.verifiedBy;
  const reviewedDate = course?.reviewReviewedAt ? new Date(course.reviewReviewedAt) : null;
  const { selectedChapterIndex, setSelectedChapterIndex } = useContext(SelectedChapterIndexContext)
  let completedChapter= enrollCourse?.completedChapters ?? [];

  // Parse courseContent if it's a string
  const parsedCourseContent = Array.isArray(courseContent) 
    ? courseContent 
    : (typeof courseContent === 'string' 
      ? (() => { try { return JSON.parse(courseContent); } catch { return []; } })() 
      : []);

  const parseSpecializations = (spec) => {
    if (!spec) return [];
    if (Array.isArray(spec)) return spec;
    if (typeof spec === 'string') {
      return spec.split(',').map(s => s.trim()).filter(s => s);
    }
    return [];
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <aside className="w-full md:w-80 flex-none bg-secondary h-auto md:h-[calc(100svh-10rem)] p-4 rounded-xl border border-border overflow-auto">
        <h2 className="text-lg font-bold">Chapters</h2>
        <div className="mt-2 flex flex-col items-start text-sm text-muted-foreground">
          <span>Loading course chapters...</span>
          <Loader2Icon className="mt-3 animate-spin" />
        </div>
      </aside>
    );
  }

  if (!parsedCourseContent || parsedCourseContent.length === 0) {
    return (
      <aside className="w-full md:w-80 flex-none bg-secondary h-auto md:h-[calc(100svh-10rem)] p-4 rounded-xl border border-border overflow-auto">
        <h2 className="text-lg font-bold">Chapters</h2>
        <p className="text-sm text-muted-foreground">
          No chapters found
        </p>
      </aside>
    );
  }
  return (
    <aside className="w-full md:w-80 flex-none bg-secondary h-auto md:h-[calc(100svh-10rem)] p-4 rounded-xl border border-border overflow-auto overflow-x-hidden">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Chapters</h2>
        <p className="text-xs text-muted-foreground">{parsedCourseContent?.length} total</p>
      </div>

      <Accordion type="single" collapsible >
        {parsedCourseContent?.map((chapter, index) => (
          <AccordionItem key={chapter?.cid ?? index} value={String(index)}>
            <AccordionTrigger
              onClick={() => setSelectedChapterIndex(index)}
              className={
                `text-sm font-medium px-3 py-3 rounded-lg hover:no-underline text-left min-w-0 ` +
                `${completedChapter.includes(index) ? "bg-purple-100 text-purple-800" : ""} ` +
                `${selectedChapterIndex === index ? "ring-1 ring-border bg-white" : ""}`
              }
            >
              <span className="block min-w-0 whitespace-normal wrap-break-word">
                {index + 1}. {chapter.courseData.chapterName}
              </span>
            </AccordionTrigger>
            <AccordionContent asChild>
              <div className="px-3 pb-3">
                {(Array.isArray(chapter.courseData.topics) ? chapter.courseData.topics : [chapter.courseData.topics]).map((topic,index_)=>(
                  <div
                    key={index_}
                    className={
                      `px-3 py-2 my-1 rounded-md text-xs border border-border/50 leading-snug ` +
                      `${completedChapter.includes(index) ? "bg-purple-200 text-purple-800" : "bg-white"}`
                    }
                  >
                    <span className="block whitespace-normal wrap-break-word">
                      {topic?.topic}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}

export default ChapterListSidebar;
