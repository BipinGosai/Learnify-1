'use client';

import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Book, Clock, Loader2, PlayCircle, Settings, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

function CourseInfo({ course, viewCourse }) {
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!course || !isMounted) {
        return <div className='p-5 rounded-xl shadow'>Loading course information...</div>;
    }

    const courseJson = typeof course.courseJson === 'string' ? JSON.parse(course.courseJson) : course.courseJson;
    const courseLayout = courseJson?.course;

const GenerateCourseContent = async () => {
    if (!isMounted) return;
    
    setLoading(true);
    try {
        const result = await axios.post('/api/generate-course-content', {
            courseJson: courseLayout,
            courseTitle: course?.name,
            courseId: course?.cid
        });
        console.log(result.data);
        toast.success('Course Generated Successfully');
        // Redirect to dashboard after a short delay to show the success message
        setTimeout(() => {
            router.push('/workspace');
        }, 1000);
    } catch (e) {
        console.error('Error generating content:', e);
        toast.error('Server Side error, Try Again!');
    } finally {
        setLoading(false);
    }
};

    return (
        <div className='md:flex gap-5 justify-between p-5 rounded-xl shadow'>
            <div className='flex flex-col gap-3'>
                <h2 className='font-bold text-3xl'>{courseLayout?.name || 'Untitled Course'}</h2>
                <p className='line-clamp-2 text-gray-500'>{courseLayout?.description || 'No description available'}</p>
                
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='flex gap-3 items-center p-4 rounded-lg shadow hover:shadow-md transition-shadow'>
                        <div className='p-2 bg-blue-50 rounded-full'>
                            <Clock className='w-5 h-5 text-blue-500' />
                        </div>
                        <section>
                            <h2 className='text-sm font-medium text-gray-500'>Duration</h2>
                            <h2 className='font-semibold'>2 Hours</h2>
                        </section>
                    </div>
                    
                    <div className='flex gap-3 items-center p-4 rounded-lg shadow hover:shadow-md transition-shadow'>
                        <div className='p-2 bg-green-50 rounded-full'>
                            <Book className='w-5 h-5 text-green-500' />
                        </div>
                        <section>
                            <h2 className='text-sm font-medium text-gray-500'>Chapters</h2>
                            <h2 className='font-semibold'>{courseLayout?.chapters?.length || 0}</h2>
                        </section>
                    </div>
                    
                    <div className='flex gap-3 items-center p-4 rounded-lg shadow hover:shadow-md transition-shadow'>
                        <div className='p-2 bg-red-50 rounded-full'>
                            <TrendingUp className='w-5 h-5 text-red-500' />
                        </div>
                        <section>
                            <h2 className='text-sm font-medium text-gray-500'>Difficulty</h2>
                            <h2 className='font-semibold capitalize'>{course?.level || 'Not specified'}</h2>
                        </section>
                    </div>
                </div>
                
               {!viewCourse ?
               <Button 
                    onClick={GenerateCourseContent} 
                    disabled={loading}
                    className='max-w-sm mt-2 gap-2'
                >
                    {loading ? (
                        <>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Settings className='w-4 h-4' />
                            Generate Content
                        </>
                    )}
                </Button>
                :<Link href={'/course/'+course?.cid}>
                <Button><PlayCircle/> Continue Lerning </Button></Link>}
            </div>
            
            {course?.bannerImageUrl ? (
                <div className='relative w-full md:w-1/2 lg:w-1/3 h-60 mt-5 md:mt-0 rounded-2xl overflow-hidden'>
                    <Image 
                        src={course.bannerImageUrl} 
                        alt='Course banner'
                        fill
                        className='object-cover'
                        priority
                    />
                </div>
            ) : (
                <div className='w-full md:w-1/2 lg:w-1/3 h-60 mt-5 md:mt-0 rounded-2xl bg-gray-100 flex items-center justify-center'>
                    <span className='text-gray-400'>No banner image</span>
                </div>
            )}
        </div>
    );
}

export default CourseInfo;