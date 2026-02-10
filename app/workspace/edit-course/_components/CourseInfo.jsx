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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

// Course summary + actions for generating content and submitting verification.
function CourseInfo({ course, viewCourse, refreshCourse }) {
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verificationSubmitting, setVerificationSubmitting] = useState(false);
    const [verificationNoticeVisible, setVerificationNoticeVisible] = useState(false);
    const [professorEmail, setProfessorEmail] = useState('');
    const [professorList, setProfessorList] = useState([]);
    const [professorListError, setProfessorListError] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const [availableCourseDialog, setAvailableCourseDialog] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Avoid rendering until we are mounted (Next.js client safety).
        setIsMounted(true);
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                // Fetch professor list to suggest a reviewer.
                const params = new URLSearchParams();
                if (course?.category) params.append('courseCategory', course.category);
                if (course?.name) params.append('courseName', course.name);
                
                const resp = await axios.get(`/api/professors${params.toString() ? '?' + params.toString() : ''}`);
                if (!alive) return;
                const list = Array.isArray(resp.data?.professors) ? resp.data.professors : [];
                setProfessorList(list);
                setProfessorListError(null);
                if (!professorEmail && list.length > 0) {
                    const suggested = suggestProfessor(course, list);
                    setProfessorEmail(suggested?.email || list[0]?.email || '');
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
    }, [course?.category, course?.name]);

    // Re-evaluate suggested professor when course data or list loads
    useEffect(() => {
        if (!course || professorList.length === 0) return;
        const current = professorList.find((p) => p.email === professorEmail);
        if (current) return; // keep user's choice if valid
        const suggested = suggestProfessor(course, professorList);
        if (suggested?.email) {
            setProfessorEmail(suggested.email);
        }
    }, [course, professorList, professorEmail]);

    if (!course || !isMounted) {
        return <div className='p-5 rounded-xl shadow'>Loading course information...</div>;
    }

    const courseJson = typeof course.courseJson === 'string' ? JSON.parse(course.courseJson) : course.courseJson;
    const courseLayout = courseJson?.course;

    // Convert chapter durations into total minutes.
    const getTotalDurationMinutes = () => {
        const chapters = courseLayout?.chapters;
        if (!Array.isArray(chapters) || chapters.length === 0) return null;

        let totalMinutes = 0;

        chapters.forEach((chapter) => {
            const duration = chapter?.duration;
            if (!duration && duration !== 0) return;

            if (typeof duration === 'number') {
                totalMinutes += duration;
                return;
            }

            if (typeof duration === 'string') {
                const lower = duration.toLowerCase();
                let minutesForChapter = 0;

                const hoursMatch = lower.match(/(\d+)\s*(?:h|hr|hour|hours)/i);
                const minutesMatch = lower.match(/(\d+)\s*(?:m|min|minute|minutes)/i);

                if (hoursMatch) {
                    minutesForChapter += parseInt(hoursMatch[1], 10) * 60;
                }
                if (minutesMatch) {
                    minutesForChapter += parseInt(minutesMatch[1], 10);
                }

                if (!hoursMatch && !minutesMatch) {
                    const genericNumberMatch = lower.match(/(\d+(?:\.\d+)?)/);
                    if (genericNumberMatch) {
                        minutesForChapter += Math.round(parseFloat(genericNumberMatch[1]));
                    }
                }

                totalMinutes += minutesForChapter;
            }
        });

        return totalMinutes > 0 ? totalMinutes : null;
    };

    const formatTotalDuration = (totalMinutes) => {
        if (!totalMinutes || Number.isNaN(totalMinutes)) return 'Not specified';

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours && minutes) {
            return `${hours} ${hours === 1 ? 'Hour' : 'Hours'} ${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`;
        }
        if (hours) {
            return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
        }
        return `${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`;
    };

    const totalDurationLabel = formatTotalDuration(getTotalDurationMinutes());

    // Normalize content so we can check if it exists.
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

    const normalize = (str = '') => (typeof str === 'string' ? str.toLowerCase().trim() : '');
    const scoreProfessor = (prof) => {
        const spec = prof?.specializations;
        const specialization = Array.isArray(spec) 
            ? spec.join(', ').toLowerCase().trim()
            : normalize(spec);
        
        if (!specialization) return 0;
        const courseCategory = normalize(course?.category || courseJson?.course?.category);
        const courseName = normalize(course?.name || courseJson?.course?.name);
        let score = 0;
        
        // Course name word matching (primary)
        courseName.split(/\s+/).forEach((w) => {
            if (w.length > 3 && specialization.includes(w)) score += 10;
        });
        
        // Category match (secondary)
        if (courseCategory && specialization.includes(courseCategory)) score += 5;
        
        // Partial category words
        courseCategory.split(/[&,\s]+/).forEach((w) => {
            if (w.length > 3 && specialization.includes(w)) score += 2;
        });
        
        return score;
    };

    const suggestProfessor = (courseData, list) => {
        if (!Array.isArray(list) || list.length === 0) return null;
        let best = null;
        let bestScore = 0;
        for (const prof of list) {
            const s = scoreProfessor(prof);
            if (s > bestScore) {
                bestScore = s;
                best = prof;
            }
        }
        return bestScore > 0 ? best : list[0];
    };

    const getProfessorSpecializationArray = (prof) => {
        const specialization = prof?.specializations;
        if (!specialization) return [];
        
        // If already an array, return it cleaned
        if (Array.isArray(specialization)) {
            return specialization.map(s => String(s).trim()).filter(s => s.length > 0);
        }
        
        // If string, split it
        if (typeof specialization === 'string') {
            return specialization.split(/[,&]/).map(s => s.trim()).filter(s => s.length > 0);
        }
        
        return [];
    };

    const getMatchingSpecialization = (prof) => {
        const specialization = getProfessorSpecializationArray(prof);
        const courseCategory = normalize(course?.category || courseJson?.course?.category);
        const courseName = normalize(course?.name || courseJson?.course?.name);
        const courseWords = courseName.split(/\s+/).filter(w => w.length > 3);
        const categoryWords = courseCategory.split(/[&,\s]+/).filter(w => w.length > 3);
        
        const matches = [];
        specialization.forEach(spec => {
            const specNorm = normalize(spec);
            if (courseCategory && specNorm === courseCategory) {
                matches.push(spec);
            }
            if (categoryWords.some(w => specNorm.includes(w) || w.includes(specNorm))) {
                if (!matches.includes(spec)) matches.push(spec);
            }
            if (courseWords.some(w => specNorm.includes(w) || w.includes(specNorm))) {
                if (!matches.includes(spec)) matches.push(spec);
            }
        });
        return matches;
    };

    // Enroll the user and open the course reader.
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

    // Send course to professor for verification.
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

        // Check if course name matches with professor specialization
        if (professorList.length > 0) {
            const prof = professorList.find((p) => p.email === email);
            if (!prof) {
                toast.error('This professor cannot verify');
                return;
            }
            
            const courseName = normalize(course?.name || courseJson?.course?.name);
            const spec = prof?.specializations;
            const specialization = Array.isArray(spec) 
                ? spec.join(', ').toLowerCase().trim()
                : normalize(spec);
            
            // Check if any word from course name matches with professor specialization
            const courseWords = courseName.split(/\s+/).filter(w => w.length > 2);
            const hasMatch = courseWords.some(word => specialization.includes(word));
            
            if (!hasMatch) {
                toast.error('This professor cannot verify');
                return;
            }
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

    // Revert a pending verification if the user changes their mind.
    const CancelVerification = async () => {
        if (!isMounted || !course?.cid) return;

        setVerificationSubmitting(true);
        try {
            await axios.post('/api/courses/cancel-verification', {
                courseId: course.cid,
            });
            toast.success('Verification cancelled successfully');
            await refreshCourse?.();
            setVerificationNoticeVisible(false);
        } catch (e) {
            console.error('Error cancelling verification:', e);
            toast.error('Failed to cancel verification');
        } finally {
            setVerificationSubmitting(false);
        }
    };

// Generate content for all chapters via the AI service.
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
        const status = e?.response?.status;
        const availableCourseId = e?.response?.data?.availableCourseId;
        const courseName = e?.response?.data?.courseName;
        
        if (status === 409 && availableCourseId) {
            setAvailableCourseDialog({
                courseId: availableCourseId,
                courseName: courseName,
            });
            setLoading(false);
            return;
        }
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
                            <h2 className='font-semibold'>{totalDurationLabel}</h2>
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
                                            <Button 
                                                type='button' 
                                                variant='destructive' 
                                                size='sm'
                                                onClick={CancelVerification}
                                                disabled={verificationSubmitting}
                                            >
                                                {verificationSubmitting ? (
                                                    <>
                                                        <Loader2 className='w-3 h-3 animate-spin mr-1' />
                                                        Cancelling...
                                                    </>
                                                ) : (
                                                    'Cancel Verification'
                                                )}
                                            </Button>
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
                                                        <>
                                                            <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1'>
                                                                Select Professor for Verification
                                                            </div>
                                                            <Select value={professorEmail} onValueChange={setProfessorEmail} disabled={loading}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder='Choose professor' />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {professorList.map((prof) => {
                                                                        return (
                                                                            <SelectItem key={prof.email} value={prof.email}>
                                                                                {prof.email}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                            </SelectContent>
                                                        </Select>
                                                        {professorEmail && professorList.find(p => p.email === professorEmail) && (
                                                            <div className='text-xs border border-border rounded-lg p-2 bg-blue-50 dark:bg-blue-950'>
                                                                <div className='font-medium text-blue-900 dark:text-blue-100'>
                                                                    ✓ Recommended Professor
                                                                </div>
                                                                <div className='text-blue-800 dark:text-blue-200 mt-1'>
                                                                    <div className='font-semibold'>{professorList.find(p => p.email === professorEmail)?.name || 'Professor'}</div>
                                                                    <div className='mt-1'>
                                                                        <strong>Specialization:</strong> {(professorList.find(p => p.email === professorEmail)?.specializationArray || getProfessorSpecializationArray(professorList.find(p => p.email === professorEmail))).join(', ') || 'Not specified'}
                                                                    </div>
                                                                    {getMatchingSpecialization(professorList.find(p => p.email === professorEmail)).length > 0 && (
                                                                        <div className='mt-1'>
                                                                            <strong>Matches your course:</strong> {getMatchingSpecialization(professorList.find(p => p.email === professorEmail)).join(', ')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        </>
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

            {/* Dialog for already available course */}
            <Dialog open={!!availableCourseDialog} onOpenChange={(open) => !open && setAvailableCourseDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className='flex items-center gap-2'>
                            <span>This course is already available</span>
                        </DialogTitle>
                        <DialogDescription>
                            This course "{availableCourseDialog?.courseName}" is already available in the system.
                        </DialogDescription>
                    </DialogHeader>
                    <p className='text-sm text-muted-foreground'>
                        You can view and enroll in this verified course from the Explore Courses section. Would you like to view it now?
                    </p>
                    <DialogFooter>
                        <Button 
                            variant='outline' 
                            onClick={() => setAvailableCourseDialog(null)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => {
                                const courseId = availableCourseDialog?.courseId;
                                setAvailableCourseDialog(null);
                                router.push(`/workspace/explore?courseId=${courseId}`);
                            }}
                        >
                            View Course
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default CourseInfo;