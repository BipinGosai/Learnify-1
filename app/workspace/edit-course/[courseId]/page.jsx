
"use client"
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import CourseInfo from '../_components/CourseInfo';
import ChapterTopicList from '../_components/ChapterTopicList';

function EditCourse({viewCourse=false}) {
    const {courseId} = useParams();
    const router = useRouter();
    const [loading,setLoading] = useState(false);
    const [course,setCourse]=useState();
    const [error,setError]=useState('');

    useEffect(()=>{
    if (courseId) GetCourseInfo();
  },[courseId])

    const GetCourseInfo = async()=>{
        setLoading(true);
        setError('');
        try{
        const result = await axios.get('/api/courses?courseId='+courseId);
        const data = result.data;

        if (!data) {
            setError('Course not found. You may not have permission to edit this course.');
            setCourse(null);
            return;
        }

        // If backend cloned a copy for this user, move to the new id
        if (data?.cid && data.cid !== courseId && data?.duplicatedFrom) {
            router.replace('/workspace/edit-course/' + data.cid);
        }

        setCourse(data);
        }catch(err){
            const msg = err?.response?.data?.error || 'Course not found. You may not have permission to edit this course.';
            setError(msg);
            setCourse(null);
        }finally{
        setLoading(false);
        }
    }
  return (
    <div>
      {error && <div className='p-4 mb-4 border rounded-md bg-secondary text-sm'>{error}</div>}
      <CourseInfo course={course} viewCourse={viewCourse} refreshCourse={GetCourseInfo} />
      <ChapterTopicList course={course}/>
    </div>
  )
}

export default EditCourse
