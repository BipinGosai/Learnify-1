"use client";

import React, { useState } from 'react'
import Image from 'next/image'
import { Book, PlayCircle, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function CourseCard({ course }) {
  const courseJson = course?.courseJson.course;
  const bannerSrc = typeof course?.bannerImageUrl === 'string' ? course.bannerImageUrl.trim() : '';
  const reviewStatus = course?.reviewStatus ?? 'draft';
  const [enrolling, setEnrolling] = useState(false);
  const router = useRouter();

  const enrollAndContinue = async () => {
    if (!course?.cid) return;
    setEnrolling(true);
    try {
      const resp = await axios.post('/api/enroll-course', { courseId: course.cid });
      if (resp.data?.resp) {
        // already enrolled
      } else {
        toast.success('Enrolled successfully');
      }
      router.push('/course/' + course.cid);
    } catch (e) {
      toast.error('Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };
  return (
    <div className='shadow-sm rounded-xl overflow-hidden border border-border bg-background'>
      {bannerSrc ? (
        <Image
          src={bannerSrc}
          alt={courseJson?.name ?? 'Course banner'}
          width={400}
          height={300}
          className='w-full aspect-video rounded-t-xl object-cover'
        />
      ) : (
        <Skeleton className='w-full aspect-video rounded-t-xl' />
      )}
      <div className='p-4 flex flex-col gap-3'>
        <div className='space-y-1'>
          <div className='flex items-center justify-between gap-2'>
          <h2 className='font-bold text-lg leading-tight line-clamp-2'>{courseJson?.name}</h2>
            <div className='text-xs px-2 py-1 rounded-md border border-border bg-secondary text-secondary-foreground shrink-0'>
              {reviewStatus === 'pending_verification'
                ? 'Pending verification'
                : reviewStatus === 'needs_changes'
                  ? 'Needs changes'
                  : reviewStatus === 'verified'
                    ? 'Verified'
                    : 'Draft'}
            </div>
          </div>
          <p className='text-muted-foreground text-sm leading-relaxed line-clamp-3'>
            {courseJson?.description}
          </p>
        </div>

        <div className='flex items-center justify-between gap-3 pt-1'>
          <h2 className='flex items-center text-sm gap-2 text-muted-foreground'>
            <Book className='text-primary h-5 w-5' />
            {courseJson?.noOfChapters} Chapters
          </h2>
          {reviewStatus === 'verified' ? (
            <Button size={'sm'} className='shrink-0 gap-2' onClick={enrollAndContinue} disabled={enrolling}>
              {enrolling ? <Loader2 className='h-4 w-4 animate-spin' /> : <PlayCircle className='h-4 w-4' />}
              Enroll & Continue
            </Button>
          ) : (
            <Link href={'/workspace/edit-course/' + course?.cid}>
              <Button size={'sm'} variant='outline' className='shrink-0 gap-2'>
                <Settings className='h-4 w-4' />
                {course?.courseContent?.length ? 'Edit / Verify' : 'Generate Course'}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
export default CourseCard;