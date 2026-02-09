"use client"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
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
    const { userDetail } = useContext(UserDetailContext);
    const GetCourseList = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await axios.get('/api/courses?scope=mine');
            setCourseList(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            setError('Failed to load courses. Please try again later.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (userDetail?.email) {
            GetCourseList();
        } else {
            setLoading(false);
        }
    }, [userDetail?.email]);
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
            {courseList
                ?.filter((course) => {
                    const owner = typeof course?.userEmail === 'string' ? course.userEmail.trim().toLowerCase() : '';
                    const current = typeof userDetail?.email === 'string' ? userDetail.email.trim().toLowerCase() : '';
                    return owner && current ? owner === current : false;
                })
                ?.length == 0 ? 
      <div className='flex p-7 items-center justify-center flex-col border rounded-2xl mt-2 bg-secondary'>
        <Image src={'/online-education.png'} alt='edu' width={200} height={200}/>
        <h2 className='my-2 text-xl font-bold'>Look like you haven't created any courses yet</h2>
        <AddNewCourseDialog>
        <Button>+ Create your first course</Button>
        </AddNewCourseDialog>
        </div>:
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'>
                        {courseList
                            ?.filter((course) => {
                                const owner = typeof course?.userEmail === 'string' ? course.userEmail.trim().toLowerCase() : '';
                                const current = typeof userDetail?.email === 'string' ? userDetail.email.trim().toLowerCase() : '';
                                return owner && current ? owner === current : false;
                            })
                            ?.map((course,index)=>(
              <CourseCard course={course} key={index}/>
            ))}
            </div>}
    </div>
  )
}
export default CourseList