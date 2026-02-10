"use client";

import React, { useState } from 'react'
import Image from 'next/image'
import { Book, PlayCircle, Settings, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Card for a single course, used across dashboard and explore views.
function CourseCard({ course }) {
  const courseJson = course?.courseJson.course;
  const bannerSrc = typeof course?.bannerImageUrl === 'string' ? course.bannerImageUrl.trim() : '';
  const reviewStatus = course?.reviewStatus ?? 'draft';
  const [enrolling, setEnrolling] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const router = useRouter();

  const verifiedBy = course?.verifiedBy;
  const reviewedDate = course?.reviewReviewedAt ? new Date(course.reviewReviewedAt) : null;

  // Enroll the user, then jump into the course reader.
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

  // Compute progress using either content length or metadata.
  const getProgressPercent = () => {
    const enroll = course?.enrollCourse;
    if (!enroll) return null;

    const completed = Array.isArray(enroll.completedChapters) ? enroll.completedChapters.length : 0;
    const totalFromContent = Array.isArray(course?.courseContent) ? course.courseContent.length : 0;
    const totalFromMeta = course?.noOfChapters || courseJson?.noOfChapters || 0;
    const total = totalFromContent || totalFromMeta || 0;
    if (!total) return 0;
    return Math.round((completed / total) * 100);
  };

  const progressPercent = getProgressPercent();
  const isEnrolled = Boolean(course?.enrollCourse);
  const isComplete = progressPercent !== null && progressPercent >= 100;

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
          <div className='space-y-1'>
            <div className='flex items-center justify-between gap-2'>
            <h2 className='font-bold text-lg leading-tight line-clamp-2'>{courseJson?.name}</h2>
              <div className='flex items-center gap-2 shrink-0'>
                <div className='text-xs px-2 py-1 rounded-md border border-border bg-secondary text-secondary-foreground'>
                  {reviewStatus === 'pending_verification'
                    ? 'Pending verification'
                    : reviewStatus === 'needs_changes'
                      ? 'Needs changes'
                      : reviewStatus === 'verified'
                        ? 'Verified'
                        : 'Draft'}
                </div>
                {reviewStatus === 'verified' && verifiedBy && (
                  <button
                    onClick={() => setShowVerificationDetails(true)}
                    className='p-1 hover:bg-secondary rounded-md transition-colors'
                    title="View verification details"
                  >
                    <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
                  </button>
                )}
              </div>
            </div>
            <p className='text-muted-foreground text-sm leading-relaxed line-clamp-3'>
              {courseJson?.description}
            </p>
          </div>



          {isEnrolled && progressPercent !== null && (
            <div className='space-y-1'>
              <div className='flex items-center justify-between text-sm text-muted-foreground'>
                <span>Progress</span>
                <span className='text-primary font-medium'>{progressPercent}%</span>
              </div>
              <div className='h-2 w-full rounded-full bg-secondary'>
                <div
                  className='h-full rounded-full bg-primary transition-all'
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className='flex items-center justify-between gap-3 pt-1'>
            <h2 className='flex items-center text-sm gap-2 text-muted-foreground'>
              <Book className='text-primary h-5 w-5' />
              {courseJson?.noOfChapters} Chapters
            </h2>
            {reviewStatus === 'verified' ? (
              <Button
                size={'sm'}
                className={isComplete ? 'shrink-0 gap-2 bg-green-600 hover:bg-green-700 text-white' : 'shrink-0 gap-2'}
                onClick={isEnrolled ? () => router.push('/course/' + course.cid) : enrollAndContinue}
                disabled={enrolling}
              >
                {enrolling ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : isComplete ? (
                  <CheckCircle2 className='h-4 w-4' />
                ) : (
                  <PlayCircle className='h-4 w-4' />
                )}
                {isComplete ? 'Review Course' : isEnrolled ? 'Continue' : 'Enroll & Continue'}
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
export default CourseCard;