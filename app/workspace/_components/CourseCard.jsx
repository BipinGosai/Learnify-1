import React from 'react'
import Image from 'next/image'
import { PlayCircle , Book, Settings} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


const CourseCard = ({course}) => {
    const courseJson=course?.courseJson.course;
  return (
    <div className='shadow rounded-xl'>
        <Image src={course?.bannerImageUrl} alt={course.name}
        width={400}
        height={300}
        className = 'w-full aspect-video rounded-t-xl object-cover'
        />
        <div className='p-4 flex-col gap-4'>
            <h2 className='font-bold text-lg'>{courseJson?.name}</h2>
            <p className='line-clamp-3 text-grey-400 text-sm'>{courseJson?.description}</p>
            <div className='flex justify-between item-center'>
                <h2 className='flex item-center text-sm gap-2'><Book className='text-primary h-5 w-5'/>{courseJson?.noOfChapters} Chapters</h2>
                {course?.courseContent?.length?<Button size={'sm'}><PlayCircle/> Start Learning</Button>:
                <Link href={'/workspace/edit-course/' + course?.cid}><Button size={'sm'} variant='outline'><Settings/>Generate Course</Button></Link>}
            </div>
        </div>
    </div>
  )
}
export default CourseCard