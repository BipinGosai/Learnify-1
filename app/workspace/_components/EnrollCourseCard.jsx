"use client"

import Link from 'next/link';
import { PlayCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


function EnrollCourseCard({course,enrollCourse}) {
    const courseJson = course?.courseJson?.course || course;
    const bannerSrc = typeof course?.bannerImageUrl === 'string' ? course.bannerImageUrl.trim() : '';
    const [showVerificationDetails, setShowVerificationDetails] = useState(false);
    const verifiedBy = course?.verifiedBy;
    const reviewedDate = course?.reviewReviewedAt ? new Date(course.reviewReviewedAt) : null;

const CalculatePerProgress = () => {
  const completed = enrollCourse?.completedChapters?.length ?? 0;
  const total = course?.courseContent?.length ?? 1;

  return Math.round((completed / total) * 100);
};

const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const parseSpecializations = (spec) => {
    if (!spec) return [];
    if (Array.isArray(spec)) return spec;
    if (typeof spec === 'string') {
      return spec.split(',').map(s => s.trim()).filter(s => s);
    }
    return [];
};

  return (
    <>
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
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h2 className='font-bold text-lg leading-tight line-clamp-2'>{courseJson?.name}</h2>
              {verifiedBy && (
                <button
                  onClick={() => setShowVerificationDetails(true)}
                  className='p-1 hover:bg-secondary rounded-md transition-colors shrink-0'
                  title="View verification details"
                >
                  <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
                </button>
              )}
            </div>

            
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <span>Progress</span>
              <span className='text-primary font-medium'>{CalculatePerProgress()}%</span>
            </div>
            <Progress value={CalculatePerProgress()} />
          </div>

          <Link href={'/course/' + course?.cid}>
            <Button className={'w-full'}>
              <PlayCircle />
              Continue Learning
            </Button>
          </Link>
        </div>
      </div>

      {/* Verification Details Dialog */}
      <Dialog open={showVerificationDetails} onOpenChange={setShowVerificationDetails}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-green-600' />
              Course Verification Details
            </DialogTitle>
            <DialogDescription>
              Information about who verified this course
            </DialogDescription>
          </DialogHeader>
          
          {verifiedBy && (
            <div className='space-y-4'>
              <div className='border border-border rounded-lg p-4 bg-background'>
                <div className='space-y-3'>
                  <div>
                    <div className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>Professor Name</div>
                    <div className='font-semibold text-base mt-1'>{verifiedBy.name || 'Professor'}</div>
                  </div>

                  <div>
                    <div className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>Email</div>
                    <div className='font-mono text-sm mt-1 break-all'>{verifiedBy.email}</div>
                  </div>

                  {verifiedBy.specializations && (
                    <div>
                      <div className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>Specializations</div>
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {parseSpecializations(verifiedBy.specializations).map((spec, idx) => (
                          <span key={idx} className='text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md'>
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {verifiedBy.bio && (
                    <div>
                      <div className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>Bio</div>
                      <div className='text-sm mt-1 text-foreground leading-relaxed'>{verifiedBy.bio}</div>
                    </div>
                  )}

                  {reviewedDate && (
                    <div>
                      <div className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>Verified On</div>
                      <div className='font-medium text-sm mt-1'>{formatDate(reviewedDate)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className='bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3'>
                <div className='text-sm text-green-900 dark:text-green-100'>
                  ✓ This course has been verified by a qualified professor and is ready for learning.
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EnrollCourseCard