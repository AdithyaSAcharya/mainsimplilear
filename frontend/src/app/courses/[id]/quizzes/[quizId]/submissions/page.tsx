"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SubmissionAnswer {
  questionId: string;
  type: string;
  answerText?: string;
  obtainedMarks?: number;
  reviewedByInstructor?: boolean;
  feedback?: string;
}

interface Submission {
  _id: string;
  studentId: string;
  score: number;
  totalMarks: number;
  status: string;
  answers: SubmissionAnswer[];
  submittedAt: string;
}

export default function QuizSubmissionsPage() {
  const { id, quizId } = useParams();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<Record<string, { obtainedMarks: number; feedback: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSubmissions = () => {
    fetchApi(`/quizzes/${quizId}/submissions`)
      .then((res) => setSubmissions(res.submissions || []))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const role = (localStorage.getItem('role') || '').toUpperCase();
    if (role !== 'INSTRUCTOR' && role !== 'SUPER_ADMIN') {
      toast.error('Instructors only');
      router.push(`/courses/${id}`);
      return;
    }
    loadSubmissions();
  }, [quizId, id, router]);

  const openReview = (sub: Submission) => {
    setExpandedId(sub._id);
    const draft: Record<string, { obtainedMarks: number; feedback: string }> = {};
    sub.answers.forEach((a) => {
      draft[a.questionId] = {
        obtainedMarks: a.obtainedMarks ?? 0,
        feedback: a.feedback || '',
      };
    });
    setReviewDraft(draft);
  };

  const saveReview = async (submissionId: string, answers: SubmissionAnswer[]) => {
    setSaving(true);
    try {
      const payload = answers
        .filter((a) => a.type === 'QNA')
        .map((a) => ({
          questionId: a.questionId,
          obtainedMarks: reviewDraft[a.questionId]?.obtainedMarks ?? 0,
          feedback: reviewDraft[a.questionId]?.feedback ?? '',
        }));

      if (payload.length === 0) {
        toast.info('No written answers to review in this submission');
        return;
      }

      await fetchApi(`/quizzes/submissions/${submissionId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ answers: payload }),
      });
      toast.success('Submission reviewed');
      setExpandedId(null);
      loadSubmissions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Button variant="ghost" className="mb-6 flex items-center gap-2" onClick={() => router.push(`/courses/${id}`)}>
        <ArrowLeft size={18} /> Back to Course
      </Button>

      <h1 className="text-2xl font-bold mb-6">Quiz Submissions ({submissions.length})</h1>

      {submissions.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">No submissions yet.</Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <Card key={sub._id} className="border shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center py-4">
                <div>
                  <CardTitle className="text-base font-semibold">Student {sub.studentId.slice(-6)}</CardTitle>
                  <p className="text-sm text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{sub.score}/{sub.totalMarks}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${sub.status === 'REVIEWED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {sub.status}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => openReview(sub)}>
                    Review
                  </Button>
                </div>
              </CardHeader>

              {expandedId === sub._id && (
                <CardContent className="border-t bg-gray-50 space-y-4">
                  {sub.answers
                    .filter((a) => a.type === 'QNA')
                    .map((a, i) => (
                      <div key={a.questionId} className="p-4 bg-white rounded-lg border space-y-3">
                        <p className="font-medium text-sm text-gray-700">Written answer {i + 1}</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">{a.answerText || '—'}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label>Marks awarded</Label>
                            <Input
                              type="number"
                              min={0}
                              value={reviewDraft[a.questionId]?.obtainedMarks ?? 0}
                              onChange={(e) =>
                                setReviewDraft((prev) => ({
                                  ...prev,
                                  [a.questionId]: {
                                    ...prev[a.questionId],
                                    obtainedMarks: Number(e.target.value) || 0,
                                    feedback: prev[a.questionId]?.feedback ?? '',
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1 col-span-2 sm:col-span-1">
                            <Label>Feedback</Label>
                            <Input
                              value={reviewDraft[a.questionId]?.feedback ?? ''}
                              onChange={(e) =>
                                setReviewDraft((prev) => ({
                                  ...prev,
                                  [a.questionId]: {
                                    obtainedMarks: prev[a.questionId]?.obtainedMarks ?? 0,
                                    feedback: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Optional feedback"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  {sub.answers.filter((a) => a.type === 'QNA').length === 0 && (
                    <p className="text-sm text-gray-500">This submission has only MCQ answers (auto-graded).</p>
                  )}
                  <Button
                    className="bg-black text-white gap-2"
                    disabled={saving}
                    onClick={() => saveReview(sub._id, sub.answers)}
                  >
                    <Save size={16} /> Save review
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
