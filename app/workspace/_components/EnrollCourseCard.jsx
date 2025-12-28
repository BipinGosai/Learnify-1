"use client"

import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import Image from 'next/image';
import React from 'react'
import { Button } from '@/components/ui/button';
import { Progress } from '@radix-ui/react-progress';

function EnrollCourseCard({course,enrollCourse}) {
    const courseJson = course?.course || course;

    const CalculatePerProgress=()=>{
        return (enrollCourse?.completedChapters?.length??0/course?.courseContent?.length)*100
    }
  return (
    <div className='shadow rounded-xl'>
      <Image src={course?.bannerImageUrl} alt={course.name}
        width={400}
        height={300}
        className='w-full aspect-video rounded-t-xl object-cover' />
      <div className='p-4 flex-col gap-4'>
        <h2 className='font-bold text-lg'>{courseJson?.name}</h2>
        <p className='line-clamp-3 text-grey-400 text-sm'>{courseJson?.description}</p>
        <div> 
            <h2 className='flex justify-between text-sm text-primary'>Progress <span>{CalculatePerProgress()}%</span></h2>
            <div className='bg-purple-200 h-2 rounded-full'>
                <Progress value={CalculatePerProgress()}/>
            </div>
            <Link href={'/workspace/view-course/' + course?.cid}><Button className={'w-full mt-3'}><PlayCircle />Continue Learning</Button></Link>
        </div>
      </div>
    </div>
  )
}

export default EnrollCourseCard