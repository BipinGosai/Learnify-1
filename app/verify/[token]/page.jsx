"use client";

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useParams } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function VerifyCoursePage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [doneStatus, setDoneStatus] = useState(null);
  const [showRejectFeedback, setShowRejectFeedback] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await axios.get(`/api/verification?token=${encodeURIComponent(token)}`);
        if (!alive) return;
        setCourse(resp.data?.course ?? null);
        setFeedback(resp.data?.course?.reviewFeedback ?? '');
      } catch (e) {
        const msg = e?.response?.data?.error;
        setError(typeof msg === 'string' ? msg : 'Failed to load verification page');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const canSubmit = useMemo(() => {
    return !!token && !!course && !submitting;
  }, [token, course, submitting]);

  const canSubmitRejection = useMemo(() => {
    return canSubmit && feedback.trim().length > 0;
  }, [canSubmit, feedback]);

  const submit = async (action) => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await axios.post('/api/verification/review', {
        token,
        action,
        feedback: action === 'request_changes' ? feedback : '',
      });
      setDoneStatus(resp.data?.status ?? 'done');
    } catch (e) {
      const msg = e?.response?.data?.error;
      setError(typeof msg === 'string' ? msg : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-2xl mx-auto border border-border rounded-2xl bg-card p-6">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-2xl mx-auto border border-border rounded-2xl bg-card p-6">
          <div className="text-lg font-semibold">Verification</div>
          <div className="text-sm text-destructive mt-2">{error}</div>
        </div>
      </div>
    );
  }

  if (doneStatus) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-2xl mx-auto border border-border rounded-2xl bg-card p-6">
          <div className="text-lg font-semibold">Thanks!</div>
          <div className="text-sm text-muted-foreground mt-2">
            Review submitted. Status: <span className="font-medium text-foreground">{doneStatus}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-2xl mx-auto border border-border rounded-2xl bg-card p-6 space-y-4">
        <div>
          <div className="text-lg font-semibold">Course Verification</div>
          <div className="text-sm text-muted-foreground">Review the AI-generated course and provide feedback.</div>
        </div>

        <div className="border border-border rounded-xl p-4 bg-background">
          <div className="text-sm text-muted-foreground">Course</div>
          <div className="text-base font-semibold">{course?.name ?? '—'}</div>
          <div className="text-sm text-muted-foreground mt-1">{course?.description ?? '—'}</div>
          <div className="text-sm text-muted-foreground mt-3">
            Category: <span className="text-foreground">{course?.category ?? '—'}</span> · Level:{' '}
            <span className="text-foreground">{course?.level ?? '—'}</span>
          </div>
        </div>

        {showRejectFeedback ? (
          <div>
            <div className="text-sm font-medium">Feedback</div>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Explain what needs to be changed..."
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground mt-2">
              Feedback is required to reject.
            </div>
          </div>
        ) : null}

        <div className="border border-border rounded-xl p-4 bg-background">
          <div className="text-sm font-medium">Generated content</div>
          <div className="text-xs text-muted-foreground mt-1">
            Expand chapters to review topics.
          </div>

          <div className="mt-3">
            {Array.isArray(course?.courseContent) && course.courseContent.length > 0 ? (
              <Accordion type="single" collapsible>
                {course.courseContent.map((chapter, idx) => {
                  const chapterName = chapter?.courseData?.chapterName || `Chapter ${idx + 1}`;
                  const topics = Array.isArray(chapter?.courseData?.topics)
                    ? chapter.courseData.topics
                    : chapter?.courseData?.topics
                      ? [chapter.courseData.topics]
                      : [];
                  return (
                    <AccordionItem key={idx} value={String(idx)}>
                      <AccordionTrigger>
                        {idx + 1}. {chapterName}
                      </AccordionTrigger>
                      <AccordionContent>
                        {topics.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No topics</div>
                        ) : (
                          <div className="space-y-4">
                            {topics.map((t, tIdx) => (
                              <div key={tIdx} className="border border-border rounded-lg p-3">
                                <div className="font-medium text-sm">{t?.topic || `Topic ${tIdx + 1}`}</div>
                                <div
                                  className="prose prose-sm max-w-none mt-2"
                                  dangerouslySetInnerHTML={{ __html: t?.content || '' }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-sm text-muted-foreground mt-2">No generated content found.</div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {showRejectFeedback ? (
            <>
              <Button variant="outline" disabled={!canSubmit} onClick={() => setShowRejectFeedback(false)}>
                Cancel
              </Button>
              <Button variant="outline" disabled={!canSubmitRejection} onClick={() => submit('request_changes')}>
                Submit rejection
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={!canSubmit}
                onClick={() => {
                  setShowRejectFeedback(true);
                  setFeedback('');
                }}
              >
                Reject
              </Button>
              <Button disabled={!canSubmit} onClick={() => submit('approve')}>
                Accept
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
