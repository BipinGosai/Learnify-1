"use client"
import { Button } from '@/components/ui/button';
import React, { useEffect, useState, useContext } from 'react'
import AddNewCourseDialog from './AddNewCourseDialog';
import axios from 'axios';
import CourseCard from './CourseCard';
import { Loader2 } from 'lucide-react';
import { UserDetailContext } from '@/context/UserDetailContext';

function CourseList() {
    const [courseList, setCourseList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userDetail, isUserLoading } = useContext(UserDetailContext);
    const isRubyCourse = (course) => {
        const name = (course?.name || course?.courseJson?.course?.name || '').toString().toLowerCase().trim();
        return name === 'ruby';
    };
    const GetCourseList = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await axios.get('/api/courses?scope=mine');
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
        if (isUserLoading) return;
        if (userDetail?.email) {
            GetCourseList();
        } else {
            setLoading(false);
        }
    }, [isUserLoading, userDetail?.email]);
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading courses...</span>
            </div>
        );
    }
    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading your account...</span>
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
    if (!userDetail?.email) {
        return (
            <div className='mt-10'>
                <h2 className='font-bold text-2xl'>Course List</h2>
                <div className='mt-4 border border-border rounded-2xl p-6 bg-secondary'>
                    <p className='text-muted-foreground'>Please sign in to view your courses.</p>
                    <div className='mt-4'>
                        <Button asChild>
                            <a href='/sign-in'>Go to Sign In</a>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
  return (
    <div className='mt-10'>
      <h2 className='font-bold text-2xl'>Course List</h2>
                        {courseList?.length === 0 ? 
            <div className='flex p-7 items-center justify-center flex-col border rounded-2xl mt-2 bg-secondary'>
        <h2 className='my-2 text-xl font-bold'>Look like you haven't created any courses yet</h2>
        <AddNewCourseDialog>
        <Button>+ Create your first course</Button>
        </AddNewCourseDialog>
        </div>:
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'>
                                                {courseList?.map((course,index)=>(
              <CourseCard course={course} key={index}/>
            ))}
            </div>}
    </div>
  )
}
export default CourseList