'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { Book, Clock, Loader2, PlayCircle, Settings, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

function CourseInfo({ course, viewCourse, refreshCourse }) {
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verificationSubmitting, setVerificationSubmitting] = useState(false);
    const [verificationNoticeVisible, setVerificationNoticeVisible] = useState(false);
    const [professorEmail, setProfessorEmail] = useState('');
    const [professorList, setProfessorList] = useState([]);
    const [professorListError, setProfessorListError] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const resp = await axios.get('/api/professors');
                if (!alive) return;
                const list = Array.isArray(resp.data?.professors) ? resp.data.professors : [];
                setProfessorList(list);
                setProfessorListError(null);
                if (!professorEmail && list.length > 0) {
                    setProfessorEmail(list[0]);
                }
            } catch (e) {
                if (!alive) return;
                setProfessorList([]);
                setProfessorListError('Failed to load professor list');
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!course || !isMounted) {
        return <div className='p-5 rounded-xl shadow'>Loading course information...</div>;
    }

    const courseJson = typeof course.courseJson === 'string' ? JSON.parse(course.courseJson) : course.courseJson;
    const courseLayout = courseJson?.course;

    const parsedCourseContent = (() => {
        const cc = course?.courseContent;
        if (!cc) return null;
        if (typeof cc === 'string') {
            try {
                return JSON.parse(cc);
            } catch {
                return null;
            }
        }
        return cc;
    })();

    const hasGeneratedContent = Array.isArray(parsedCourseContent)
        ? parsedCourseContent.length > 0
        : parsedCourseContent && typeof parsedCourseContent === 'object'
          ? Object.keys(parsedCourseContent).length > 0
          : false;

    const reviewStatus = course?.reviewStatus ?? 'draft';

    const enrollAndContinue = async () => {
        if (!course?.cid) return;
        setEnrolling(true);
        try {
            await axios.post('/api/enroll-course', { courseId: course.cid });
            router.push('/course/' + course.cid);
        } catch (e) {
            toast.error('Failed to enroll');
        } finally {
            setEnrolling(false);
        }
    };

    const SubmitForVerification = async () => {
        if (!isMounted) return;

        if (!hasGeneratedContent) {
            toast.error('Generate course content before submitting for verification');
            return;
        }

        const email = professorEmail.trim();
        if (!email) {
            toast.error('Please enter professor email');
            return;
        }

        // Show the user immediate UI feedback instead of keeping the button spinning.
        setVerificationNoticeVisible(true);
        setVerificationSubmitting(true);
        try {
            const respPromise = axios.post('/api/courses/submit-verification', {
                courseId: course?.cid,
                professorEmail: email,
            });

            const resp = await respPromise;
            if (resp.data?.emailSent === false && resp.data?.verificationLink) {
                const missing = Array.isArray(resp.data?.emailMissing) ? resp.data.emailMissing : [];
                const suffix = missing.length > 0 ? ` Missing: ${missing.join(', ')}` : '';
                const extra = typeof resp.data?.emailMessage === 'string' ? ` (${resp.data.emailMessage})` : '';
                toast.message(`Email not configured.${suffix}${extra} (Check console for link)`);
                console.log('Professor verification link:', resp.data.verificationLink);
            } else {
                toast.success('Sent to professor for verification');
            }
            await refreshCourse?.();
        } catch (e) {
            const msg = e?.response?.data?.error;
            toast.error(typeof msg === 'string' ? msg : 'Failed to submit for verification');
            setVerificationNoticeVisible(false);
        } finally {
            setVerificationSubmitting(false);
        }
    };

const GenerateCourseContent = async () => {
    if (!isMounted) return;
    
    setLoading(true);
    try {
        const result = await axios.post('/api/generate-course-content', {
            courseJson: courseLayout,
            courseTitle: course?.name,
            courseId: course?.cid
        });
        console.log(result.data);
        toast.success('Course Generated Successfully');
        await refreshCourse?.();
        setVerificationNoticeVisible(false);
    } catch (e) {
        console.error('Error generating content:', e);
        toast.error('Server Side error, Try Again!');
    } finally {
        setLoading(false);
    }
};

    return (
        <div className='md:flex gap-5 justify-between p-5 rounded-xl shadow'>
            <div className='flex flex-col gap-3'>
                <h2 className='font-bold text-3xl'>{courseLayout?.name || 'Untitled Course'}</h2>
                <p className='line-clamp-2 text-gray-500'>{courseLayout?.description || 'No description available'}</p>
                
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='flex gap-3 items-center p-4 rounded-lg shadow hover:shadow-md transition-shadow'>
                        <div className='p-2 bg-blue-50 rounded-full'>
                            <Clock className='w-5 h-5 text-blue-500' />
                        </div>
                        <section>
                            <h2 className='text-sm font-medium text-gray-500'>Duration</h2>
                            <h2 className='font-semibold'>2 Hours</h2>
                        </section>
                    </div>
                    
                    <div className='flex gap-3 items-center p-4 rounded-lg shadow hover:shadow-md transition-shadow'>
                        <div className='p-2 bg-green-50 rounded-full'>
                            <Book className='w-5 h-5 text-green-500' />
                        </div>
                        <section>
                            <h2 className='text-sm font-medium text-gray-500'>Chapters</h2>
                            <h2 className='font-semibold'>{courseLayout?.chapters?.length || 0}</h2>
                        </section>
                    </div>
                    
                    <div className='flex gap-3 items-center p-4 rounded-lg shadow hover:shadow-md transition-shadow'>
                        <div className='p-2 bg-red-50 rounded-full'>
                            <TrendingUp className='w-5 h-5 text-red-500' />
                        </div>
                        <section>
                            <h2 className='text-sm font-medium text-gray-500'>Difficulty</h2>
                            <h2 className='font-semibold capitalize'>{course?.level || 'Not specified'}</h2>
                        </section>
                    </div>
                </div>
                
                {!viewCourse ? (
                    <div className='flex flex-col gap-2 max-w-sm mt-2'>
                        <div className='text-sm text-muted-foreground'>
                            Status: <span className='font-medium text-foreground'>{reviewStatus}</span>
                        </div>

                        {reviewStatus === 'verified' ? (
                            <div className='text-sm border border-border rounded-lg p-3 bg-background'>
                                <div className='font-medium'>Course verified</div>
                                <div className='text-muted-foreground mt-1'>You can now enroll and start learning.</div>
                                <div className='mt-3 flex gap-2'>
                                    <Button type='button' className='gap-2' onClick={enrollAndContinue} disabled={enrolling}>
                                        {enrolling ? <Loader2 className='w-4 h-4 animate-spin' /> : <PlayCircle className='w-4 h-4' />}
                                        Enroll & Continue Learning
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {reviewStatus === 'needs_changes' && course?.reviewFeedback ? (
                                    <div className='text-sm border border-border rounded-lg p-3 bg-background'>
                                        <div className='font-medium'>Professor feedback</div>
                                        <div className='text-muted-foreground mt-1'>{course.reviewFeedback}</div>
                                    </div>
                                ) : null}

                                {reviewStatus === 'pending_verification' ? (
                                    <div className='text-sm border border-border rounded-lg p-3 bg-background'>
                                        <div className='font-medium'>Verification ongoing</div>
                                        <div className='text-muted-foreground mt-1'>
                                            Waiting for professor approval. You won’t be able to open the generated content until it is accepted.
                                        </div>
                                        <div className='mt-3 flex gap-2'>
                                            <Link href={'/workspace'}>
                                                <Button type='button' variant='outline' size='sm'>
                                                    Go to dashboard
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {(!hasGeneratedContent || reviewStatus === 'needs_changes') ? (
                                            <Button
                                                onClick={GenerateCourseContent}
                                                disabled={loading || verificationSubmitting || verificationNoticeVisible}
                                                className='gap-2'
                                                variant='outline'
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className='w-4 h-4 animate-spin' />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Settings className='w-4 h-4' />
                                                        Generate Content
                                                    </>
                                                )}
                                            </Button>
                                        ) : null}

                                        {hasGeneratedContent ? (
                                            <>
                                                <div className='flex flex-col gap-2'>
                                                    {professorList.length > 0 ? (
                                                        <Select value={professorEmail} onValueChange={setProfessorEmail} disabled={loading}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder='Choose professor email' />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {professorList.map((email) => (
                                                                    <SelectItem key={email} value={email}>
                                                                        {email}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <>
                                                            <Input
                                                                value={professorEmail}
                                                                onChange={(e) => setProfessorEmail(e.target.value)}
                                                                placeholder='Professor email (e.g. professor@gmail.com)'
                                                                disabled={loading}
                                                            />
                                                            {professorListError ? (
                                                                <div className='text-xs text-muted-foreground'>{professorListError}</div>
                                                            ) : (
                                                                <div className='text-xs text-muted-foreground'>
                                                                    Configure `PROFESSOR_EMAILS` to show a selectable list.
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {verificationNoticeVisible ? (
                                                    <div className='text-sm border border-border rounded-lg p-3 bg-background'>
                                                        <div className='font-medium'>Verification submitted</div>
                                                        <div className='text-muted-foreground mt-1'>
                                                            It may take some time for verification.
                                                        </div>
                                                        <div className='mt-3 flex gap-2'>
                                                            <Link href={'/workspace'}>
                                                                <Button type='button' variant='outline' size='sm'>
                                                                    Go to dashboard
                                                                </Button>
                                                            </Link>
                                                            {verificationSubmitting ? (
                                                                <div className='text-xs text-muted-foreground flex items-center'>Sending…</div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ) : null}

                                                <Button
                                                    onClick={SubmitForVerification}
                                                    disabled={loading || verificationSubmitting}
                                                    className='gap-2'
                                                >
                                                    Send for verification
                                                </Button>
                                            </>
                                        ) : null}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <Link href={'/course/'+course?.cid}>
                        <Button><PlayCircle/> Continue Lerning </Button>
                    </Link>
                )}
            </div>
            
            {course?.bannerImageUrl ? (
                <div className='relative w-full md:w-1/2 lg:w-1/3 h-60 mt-5 md:mt-0 rounded-2xl overflow-hidden'>
                    <Image 
                        src={course.bannerImageUrl} 
                        alt='Course banner'
                        fill
                        className='object-cover'
                        priority
                    />
                </div>
            ) : (
                <div className='w-full md:w-1/2 lg:w-1/3 h-60 mt-5 md:mt-0 rounded-2xl bg-gray-100 flex items-center justify-center'>
                    <span className='text-gray-400'>No banner image</span>
                </div>
            )}
        </div>
    );
}

export default CourseInfo;