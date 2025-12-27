"use client"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import AddNewCourseDialog from './AddNewCourseDialog';
import {useUser} from '@clerk/nextjs';
import axios from 'axios';
import CourseCard from './CourseCard';
import { Loader2 } from 'lucide-react';

function CourseList() {
    const [courseList, setCourseList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useUser();
    const GetCourseList = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await axios.get('/api/courses');
            setCourseList(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            setError('Failed to load courses. Please try again later.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (user) {
            GetCourseList();
        }
    }, [user]);
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
    <div className='mt-10'>
      <h2 className='font-bold text-3xl'>Course List</h2>
      {courseList?.length == 0 ? 
      <div className='flex p-7 items-center justify-center flex-col border rounded-2xl mt-2 bg-secondary'>
        <Image src={'/online-education.png'} alt='edu' width={200} height={200}/>
        <h2 className='my-2 text-xl font-bold'>Look like you haven't created any courses yet</h2>
        <AddNewCourseDialog>
        <Button>+ Create your first course</Button>
        </AddNewCourseDialog>
        </div>:
        <div className='grid grid-clos-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'>
            {courseList?.map((course,index)=>(
              <CourseCard course={course} key={index}/>
            ))}
            </div>}
    </div>
  )
}
export default CourseList
