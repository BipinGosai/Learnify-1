import { Button } from "@/components/ui/button";
import { SelectedChapterIndexContext } from "@/context/SelectedChapterIndexContext";
import axios from "axios";
import { CheckCircle, ChevronDown, Loader2Icon, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import YouTube from "react-youtube";
import { toast } from "sonner";

function ChapterContent({ courseInfo, refreshData }) {
    const { courseId } = useParams();
    const courseContent = courseInfo?.courses?.courseContent;
    const enrollCourse = courseInfo?.enrollCourse;

    // Debug logging
    useEffect(() => {
        console.log('ChapterContent - courseInfo:', courseInfo);
        console.log('ChapterContent - courseContent:', courseContent);
    }, [courseInfo, courseContent]);

    const { selectedChapterIndex, setSelectedChapterIndex } = useContext(SelectedChapterIndexContext);
    const [loading, setLoading] = useState(false);
    const [showVideos, setShowVideos] = useState(true);

    // Parse courseContent if it's a string
    const parsedCourseContent = useMemo(() => {
        if (!courseContent) {
            console.log('No courseContent');
            return [];
        }
        if (Array.isArray(courseContent)) {
            console.log('courseContent is array, length:', courseContent.length);
            return courseContent;
        }
        if (typeof courseContent === 'string') {
            try {
                const parsed = JSON.parse(courseContent);
                console.log('Parsed courseContent from string:', parsed);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Failed to parse courseContent:', e, 'raw:', courseContent);
                return [];
            }
        }
        console.log('courseContent type:', typeof courseContent, 'value:', courseContent);
        return [];
    }, [courseContent]);

    const videoData = parsedCourseContent?.[selectedChapterIndex]?.youtubeVideo;
    const topics = parsedCourseContent?.[selectedChapterIndex]?.courseData?.topics;

    const youtubeOpts = useMemo(
        () => ({
            width: "100%",
            height: "100%",
            playerVars: {
                modestbranding: 1,
                rel: 0,
            },
        }),
        []
    );

    const completedChapter = useMemo(
        () => (Array.isArray(enrollCourse?.completedChapters) ? enrollCourse.completedChapters : []),
        [enrollCourse?.completedChapters]
    );

    const topicList = useMemo(() => (Array.isArray(topics) ? topics : []), [topics]);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);

    const pendingTopicIndexRef = useRef(null);

    useEffect(() => {
        if (pendingTopicIndexRef.current !== null) {
            setSelectedTopicIndex(pendingTopicIndexRef.current);
            pendingTopicIndexRef.current = null;
            return;
        }
        setSelectedTopicIndex(0);
    }, [selectedChapterIndex]);

    const isFirstChapter = selectedChapterIndex === 0;
    const isLastChapter = !parsedCourseContent || selectedChapterIndex >= parsedCourseContent.length - 1;
    const isFirstSlide = selectedTopicIndex === 0;
    const isLastSlide = topicList.length === 0 ? true : selectedTopicIndex >= topicList.length - 1;

    const getTopicCountForChapter = (chapterIndex) => {
        const chapterTopics = parsedCourseContent?.[chapterIndex]?.courseData?.topics;
        if (Array.isArray(chapterTopics)) return chapterTopics.length;
        return chapterTopics ? 1 : 0;
    };

    const handlePrev = () => {
        if (topicList.length === 0) return;

        if (!isFirstSlide) {
            setSelectedTopicIndex((i) => Math.max(0, i - 1));
            return;
        }

        if (isFirstChapter) return;

        const prevChapterIndex = Math.max(0, selectedChapterIndex - 1);
        const prevTopicCount = getTopicCountForChapter(prevChapterIndex);
        pendingTopicIndexRef.current = Math.max(0, prevTopicCount - 1);
        setSelectedChapterIndex(prevChapterIndex);
    };

    const handleNext = () => {
        if (topicList.length === 0) return;

        if (!isLastSlide) {
            setSelectedTopicIndex((i) => Math.min(topicList.length - 1, i + 1));
            return;
        }

        if (!isLastChapter) {
            setSelectedChapterIndex((i) => {
                const maxIndex = (parsedCourseContent?.length ?? 1) - 1;
                return Math.min(maxIndex, i + 1);
            });
        }
    };

    const markChapterCompleted = async () => {
        setLoading(true);
        try {
            const updated = Array.from(new Set([...completedChapter, selectedChapterIndex]));
            await axios.put("/api/enroll-course", {
                courseId,
                completedChapter: updated,
            });
            refreshData?.();
            toast.success("Chapter Marked Completed!");
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const markInCompleteChapter = async () => {
        setLoading(true);
        try {
            const updated = completedChapter.filter((item) => item !== selectedChapterIndex);
            await axios.put("/api/enroll-course", {
                courseId,
                completedChapter: updated,
            });
            refreshData?.();
            toast.success("Chapter Marked InCompleted!");
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!parsedCourseContent || parsedCourseContent.length === 0) {
        return <div className="p-10 text-sm text-muted-foreground">No course content found.</div>;
    }

    return (
        <div className="flex-1 min-w-0 p-6 bg-background rounded-xl border border-border">
            <div className="flex justify-between items-center">
                <h2 className="font-bold text-2xl">
                    {selectedChapterIndex + 1}. {parsedCourseContent?.[selectedChapterIndex]?.courseData?.chapterName}
                </h2>

                {!completedChapter?.includes(selectedChapterIndex) ? (
                    <Button onClick={markChapterCompleted} disabled={loading}>
                        {loading ? <Loader2Icon className="animate-spin" /> : <CheckCircle />}
                        Mark as Completed
                    </Button>
                ) : (
                    <Button variant="outline" onClick={markInCompleteChapter} disabled={loading}>
                        {loading ? <Loader2Icon className="animate-spin" /> : <X />}
                        Mark Incomplete
                    </Button>
                )}
            </div>

            <div className="my-2 flex items-center justify-between">
                <h2 className="font-bold text-lg">Related Videos</h2>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVideos((v) => !v)}
                    aria-expanded={showVideos}
                >
                    <ChevronDown className={showVideos ? "rotate-180 transition-transform" : "transition-transform"} />
                </Button>
            </div>

            {showVideos && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videoData && videoData.length > 0 ? (
                        videoData.slice(0, 2).map((video, index) => (
                            <div key={video?.videoId ?? index} className="w-full">
                                <div className="w-full aspect-video overflow-hidden rounded-lg bg-secondary">
                                    <YouTube
                                        videoId={video?.videoId}
                                        opts={youtubeOpts}
                                        className="w-full h-full"
                                        iframeClassName="w-full h-full"
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground py-4">
                            No videos available for this chapter.
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg">Chapter Content</h2>
                    <div className="text-sm text-muted-foreground">
                        {topicList.length > 0
                            ? `Slide ${selectedTopicIndex + 1} of ${topicList.length}`
                            : "No topics"}
                    </div>
                </div>

                {topicList.length > 0 ? (
                    <div className="mt-3 p-5 bg-secondary rounded-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-bold text-2xl text-primary">
                                {selectedTopicIndex + 1}.{topicList[selectedTopicIndex]?.topic}
                            </h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    disabled={topicList.length === 0 || (isFirstSlide && isFirstChapter)}
                                >
                                    Prev
                                </Button>
                                <Button
                                    onClick={() =>
                                        handleNext()
                                    }
                                    disabled={
                                        topicList.length === 0 ||
                                        (isLastSlide && isLastChapter)
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>

                        <div
                            className="mt-6 max-h-[65vh] overflow-auto"
                            dangerouslySetInnerHTML={{ __html: topicList[selectedTopicIndex]?.content }}
                            style={{ lineHeight: "2.5" }}
                        />
                    </div>
                ) : (
                    <div className="mt-3 text-sm text-muted-foreground">No topics found for this chapter.</div>
                )}
            </div>
        </div>
    );
}

export default ChapterContent;
