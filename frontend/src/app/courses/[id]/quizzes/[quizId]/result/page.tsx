"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface SubmissionAnswer {
  questionId: string;
  type: string;
  selectedOption?: number;
  answerText?: string;
  isCorrect?: boolean;
  obtainedMarks?: number;
  reviewedByInstructor?: boolean;
  feedback?: string;
}

interface Submission {
  score: number;
  totalMarks: number;
  status: string;
  answers: SubmissionAnswer[];
  submittedAt: string;
}

export default function QuizResultPage() {
  const { id, quizId } = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(`/quizzes/${quizId}/result`)
      .then((res) => setSubmission(res.submission))
      .catch((err: Error) => {
        toast.error(err.message);
        router.push(`/courses/${id}`);
      })
      .finally(() => setLoading(false));
  }, [quizId, id, router]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  if (!submission) return null;

  const hasPendingQna = submission.answers.some(
    (a) => a.type === 'QNA' && !a.reviewedByInstructor
  );
  const percentage = submission.totalMarks
    ? Math.round((submission.score / submission.totalMarks) * 100)
    : 0;

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Button variant="ghost" className="mb-6 flex items-center gap-2" onClick={() => router.push(`/courses/${id}`)}>
        <ArrowLeft size={18} /> Back to Course
      </Button>

      <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl text-center">
        <div className={`h-2 w-full ${hasPendingQna ? 'bg-amber-500' : percentage >= 50 ? 'bg-green-500' : 'bg-red-500'}`} />
        <CardHeader className="pt-10 pb-4">
          <CardTitle className="text-3xl font-bold">Quiz Submitted</CardTitle>
          <p className="text-gray-500 mt-2 text-sm">
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="pb-10 px-8 space-y-6">
          <div className="text-5xl font-bold text-gray-900">
            {submission.score} <span className="text-2xl text-gray-400 font-normal">/ {submission.totalMarks}</span>
          </div>
          <p className="text-lg text-gray-600">{percentage}% score</p>

          {hasPendingQna ? (
            <div className="flex items-center justify-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-3 px-4 text-sm">
              <Clock size={18} />
              Written answers are pending instructor review. Your final score may change.
            </div>
          ) : submission.status === 'REVIEWED' ? (
            <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg py-3 px-4 text-sm">
              <CheckCircle2 size={18} /> Review complete
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-gray-700 bg-gray-50 border rounded-lg py-3 px-4 text-sm">
              Auto-graded MCQ questions are included in this score.
            </div>
          )}

          <div className="text-left space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-gray-900">Answer breakdown</h3>
            {submission.answers.map((a, i) => (
              <div key={a.questionId || i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border text-sm">
                {a.type === 'MCQ' ? (
                  a.isCorrect ? (
                    <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                  ) : (
                    <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                  )
                ) : (
                  <Clock className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                )}
                <div>
                  <p className="font-medium">
                    Question {i + 1} · {a.obtainedMarks ?? 0} marks
                  </p>
                  {a.type === 'QNA' && a.answerText && (
                    <p className="text-gray-600 mt-1 line-clamp-2">{a.answerText}</p>
                  )}
                  {a.feedback && <p className="text-gray-500 mt-1 italic">Feedback: {a.feedback}</p>}
                </div>
              </div>
            ))}
          </div>

          <Link href={`/courses/${id}`}>
            <Button className="w-full bg-black hover:bg-gray-800 text-white mt-4">Return to Course</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
