"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Quiz, QuizAnswerSubmission } from '@/types/quiz';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TakeQuizPage() {
  const { id, quizId } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerSubmission>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const submittedRef = useRef(false);

  const submitQuiz = useCallback(async () => {
    if (!quiz || submitting || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = quiz.questions.map((q) => {
        const a = answers[q._id!];
        return {
          questionId: q._id,
          type: q.type,
          selectedOption: q.type === 'MCQ' ? a?.selectedOption : undefined,
          answerText: q.type === 'QNA' ? a?.answerText : undefined,
        };
      });
      const res = await fetchApi(`/quizzes/${quizId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: payload }),
      });
      toast.success(`Submitted! Score: ${res.score}/${quiz.totalMarks}`);
      router.push(`/courses/${id}/quizzes/${quizId}/result`);
    } catch (err: unknown) {
      submittedRef.current = false;
      toast.error(err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  }, [quiz, answers, quizId, id, router, submitting]);

  useEffect(() => {
    fetchApi(`/quizzes/${quizId}`)
      .then((res) => {
        const q = res.quiz as Quiz;
        setQuiz(q);
        setSecondsLeft((q.durationInMinutes || 10) * 60);
        const initial: Record<string, QuizAnswerSubmission> = {};
        q.questions.forEach((question) => {
          if (question._id) {
            initial[question._id] = { questionId: question._id, type: question.type };
          }
        });
        setAnswers(initial);
      })
      .catch((err: Error) => {
        toast.error(err.message);
        router.push(`/courses/${id}`);
      })
      .finally(() => setLoading(false));
  }, [quizId, id, router]);

  useEffect(() => {
    if (!quiz || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, secondsLeft, submitQuiz]);

  if (loading || !quiz) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  const allAnswered = quiz.questions.every((q) => {
    const a = answers[q._id!];
    if (q.type === 'MCQ') return a?.selectedOption !== undefined;
    return (a?.answerText || '').trim().length > 0;
  });

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <Button variant="ghost" className="mb-4 flex items-center gap-2" onClick={() => router.push(`/courses/${id}`)}>
        <ArrowLeft size={18} /> Back to Course
      </Button>

      <Card className="shadow-xl border-0 mb-6">
        <CardHeader className="bg-gray-50 border-b flex flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">{quiz.title}</CardTitle>
            {quiz.description && <p className="text-gray-600 mt-2 text-sm">{quiz.description}</p>}
            <p className="text-sm text-gray-500 mt-2">Total marks: {quiz.totalMarks} · Pass: {quiz.passingMarks}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-sm font-bold ${secondsLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-black text-white'}`}>
            <Clock size={16} />
            {formatTime(secondsLeft)}
          </div>
        </CardHeader>
      </Card>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuiz();
        }}
        className="space-y-6"
      >
        {quiz.questions.map((q, index) => (
          <Card key={q._id} className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Q{index + 1}. {q.question}
                <span className="ml-2 text-xs font-normal text-gray-500">({q.marks} mark{q.marks !== 1 ? 's' : ''})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {q.type === 'MCQ' ? (
                <div className="space-y-2">
                  {(q.options || []).map((opt, optIndex) => (
                    <label
                      key={optIndex}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        answers[q._id!]?.selectedOption === optIndex
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q._id}
                        checked={answers[q._id!]?.selectedOption === optIndex}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q._id!]: { questionId: q._id!, type: 'MCQ', selectedOption: optIndex },
                          }))
                        }
                        className="accent-black"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full min-h-[100px] border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Type your answer..."
                  value={answers[q._id!]?.answerText || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q._id!]: { questionId: q._id!, type: 'QNA', answerText: e.target.value },
                    }))
                  }
                />
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={!allAnswered || submitting}
            className="bg-black hover:bg-gray-800 text-white gap-2 px-8"
          >
            <Send size={16} />
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </form>
    </div>
  );
}
