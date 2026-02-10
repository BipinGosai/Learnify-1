"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import axios from 'axios';
import { Loader2, Search } from 'lucide-react'
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import CourseCard from '../_components/CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

// Inner component so Suspense can handle search params.
function ExploreContent() {
    const searchParams = useSearchParams();
    const highlightCourseId = searchParams.get('courseId');
    const [courseList, setCourseList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isRubyCourse = (course) => {
        const name = (course?.name || course?.courseJson?.course?.name || '').toString().toLowerCase().trim();
        return name === 'ruby';
    };
    // Fetch all verified courses for exploration.
    const GetCourseList = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await axios.get('/api/courses?scope=explore');
            const list = Array.isArray(result.data) ? result.data : [];
            setCourseList(list.filter((course) => !isRubyCourse(course)));
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            setError('Failed to load courses. Please try again later.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        GetCourseList();
    }, []);

    // Simple search that scores by match position.
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const visibleCourses = useMemo(() => {
        if (!normalizedQuery) return courseList;

        return courseList
            .map((course) => {
                const courseJson = course?.courseJson?.course || {};
                const name = String(courseJson?.name || '').toLowerCase();
                const description = String(courseJson?.description || '').toLowerCase();
                const haystack = `${name} ${description}`.trim();
                const matchIndex = haystack.indexOf(normalizedQuery);

                if (matchIndex === -1) return null;
                return { course, matchIndex, name };
            })
            .filter(Boolean)
            .sort((a, b) => a.matchIndex - b.matchIndex || a.name.localeCompare(b.name))
            .map((item) => item.course);
    }, [courseList, normalizedQuery]);
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading courses...</span>
            </div>
        );
    }
    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={GetCourseList}>Try Again</Button>
            </div>
        );
    }
        return (
        <div className="space-y-6">
            <h2 className='font-bold text-3xl'>Explore More Courses</h2>

            <div className='flex gap-5 max-w-md'>
                <Input
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Button><Search /></Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'>
                {visibleCourses.length > 0 ? visibleCourses.map((course, index) => (
                    <div 
                        key={index}
                        className={highlightCourseId === course.cid ? 'ring-2 ring-blue-500 rounded-lg' : ''}
                    >
                        <CourseCard course={course} />
                    </div>
                )) :
                    (courseList.length === 0
                        ? [0, 1, 2, 3].map((item, index) => (
                            <Skeleton key={index} className={'w-full h-60'} />
                        ))
                        : (
                            <div className="col-span-full text-center text-muted-foreground py-8">
                                No courses match "{searchTerm.trim()}".
                            </div>
                        ))
                }
            </div>
        </div>
    )
}

// Wrap in Suspense to safely read search params.
function Explore() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading courses...</span>
                </div>
            }
        >
            <ExploreContent />
        </Suspense>
    );
}

export default Explore