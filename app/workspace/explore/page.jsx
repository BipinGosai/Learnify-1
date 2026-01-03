"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import axios from 'axios';
import { Loader2, Search } from 'lucide-react'
import React, { useState , useEffect } from 'react'
import CourseCard from '../_components/CourseCard';
import { Skeleton } from '@/components/ui/skeleton';


function Explore() {
    const [courseList, setCourseList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const GetCourseList = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await axios.get('/api/courses?courseId=0');
            setCourseList(Array.isArray(result.data) ? result.data : []);
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
                <Input placeholder="Search" />
                <Button><Search /></Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'>
                {courseList.length > 0 ? courseList?.map((course, index) => (
                    <CourseCard course={course} key={index} />
                )) :
                    [0, 1, 2, 3].map((item, index) => (
                        <Skeleton key={index} className={'w-full h-60'} />
                    ))
                }
            </div>
        </div>
  )
}

export default Explore