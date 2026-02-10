
"use client"
import React, { useEffect } from 'react'
import axios from 'axios';
import { useState } from 'react';
import EnrollCourseCard from './EnrollCourseCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';


function EnrollCourseList() {

  const [enrolledCourseList, setEnrolledCourseList]=useState([]);
  const [loading, setLoading] = useState(true);
  const isRubyCourse = (course) => {
    const name = (course?.name || course?.courseJson?.course?.name || '').toString().toLowerCase().trim();
    return name === 'ruby';
  };
    useEffect(()=>{
        GetEnrolledCourse();
    }, [])
    const GetEnrolledCourse= async ()=>{
        try {
          setLoading(true);
          const result= await axios.get('/api/enroll-course');
          const list = Array.isArray(result.data) ? result.data : [];
          setEnrolledCourseList(list.filter((item) => !isRubyCourse(item?.courses)));
        } catch (err) {
          setEnrolledCourseList([]);
        } finally {
          setLoading(false);
        }
    }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-48'>
        <Loader2 className='h-6 w-6 animate-spin' />
        <span className='ml-2'>Loading your learning...</span>
      </div>
    );
  }

  if (enrolledCourseList?.length === 0) {
    return (
      <div className='mt-3'>
        <h2 className='font-bold text-2xl'>Continue learning your course</h2>
        <div className='mt-4 border border-border rounded-2xl p-6 bg-secondary'>
          <p className='text-muted-foreground'>You haven't enrolled in any courses yet.</p>
          <p className='text-sm text-muted-foreground mt-1'>Enroll now to start learning.</p>
          <div className='mt-4'>
            <Button asChild>
              <Link href='/workspace/explore'>Explore Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-3'>
      <h2 className='font-bold text-2xl'>Continue learning your course</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'>
        {enrolledCourseList?.map((course, index) =>(
          <EnrollCourseCard course={course?.courses} enrollCourse={course?.enrollCourse} key={index}/>
        ))}
      </div>
    </div>
  )
}
export default EnrollCourseList