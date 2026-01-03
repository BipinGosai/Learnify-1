"use client";

import AppHeader from "@/app/workspace/_components/AppHeader";
import React, { useState, useEffect } from "react";
import ChapterContent from "./_components/ChapterContent";
import ChapterListSidebar from "./_components/ChapterListSidebar";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Course() {
  const { courseId } = useParams();
  const [courseInfo, setCourseInfo] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (courseId) {
      GetEnrolledCourseById();
    }
  }, [courseId]);

  const GetEnrolledCourseById = async () => {
    setLoadError(null);
    try {
      const result = await axios.get("/api/enroll-course?courseId=" + courseId);
      console.log("API RESULT ", result.data);
      setCourseInfo(result.data);
    } catch (e) {
      const status = e?.response?.status;
      const message = e?.response?.data?.error;
      setCourseInfo(null);
      setLoadError({
        status,
        message: typeof message === "string" ? message : "Failed to load course",
        reviewStatus: e?.response?.data?.reviewStatus,
      });
    }
  };

  return (
    <div>
      <AppHeader hideSidebar={true} hideUserButton={true} showDashboardLink={true} />
      <div className="px-4 md:px-6 py-4">
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen((v) => !v)}
            disabled={!!loadError}
          >
            {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            {isSidebarOpen ? "Hide Chapters" : "Show Chapters"}
          </Button>
        </div>

        {loadError ? (
          <div className="p-6 bg-background rounded-xl border border-border">
            <div className="font-semibold">{loadError.message}</div>
            {loadError.status === 403 ? (
              <div className="text-sm text-muted-foreground mt-2">
                This course is not readable until it is verified by a professor.
                {loadError.reviewStatus ? ` Current status: ${loadError.reviewStatus}.` : null}
              </div>
            ) : null}
            {loadError.status === 401 ? (
              <div className="text-sm text-muted-foreground mt-2">
                Please sign in to continue.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex w-full flex-col md:flex-row gap-4 md:gap-6 items-start">
            {isSidebarOpen && <ChapterListSidebar courseInfo={courseInfo} />}
            <ChapterContent courseInfo={courseInfo} refreshData={GetEnrolledCourseById} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Course;
