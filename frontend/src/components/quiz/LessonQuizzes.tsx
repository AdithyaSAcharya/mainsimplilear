"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ClipboardList, Edit, Trash2, Users, Play, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import type { QuizSummary } from '@/types/quiz';

interface LessonQuizzesProps {
  courseId: string;
  lessonId: string;
  role: string;
  isEnrolled: boolean;
}

export function LessonQuizzes({ courseId, lessonId, role, isEnrolled }: LessonQuizzesProps) {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [attempted, setAttempted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const isInstructor = role === 'INSTRUCTOR' || role === 'SUPER_ADMIN';
  const isStudent = role === 'STUDENT';

  const load = () => {
    setLoading(true);
    fetchApi(`/quizzes/lesson/${lessonId}`)
      .then(async (res) => {
        const list = res.quizzes || [];
        setQuizzes(list);
        if (isStudent && isEnrolled) {
          const flags: Record<string, boolean> = {};
          await Promise.all(
            list.map(async (q: QuizSummary) => {
              try {
                await fetchApi(`/quizzes/${q._id}/result`);
                flags[q._id] = true;
              } catch {
                flags[q._id] = false;
              }
            })
          );
          setAttempted(flags);
        }
      })
      .catch(() => setQuizzes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [lessonId, isStudent, isEnrolled]);

  const handleDelete = async (quizId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this quiz?')) return;
    try {
      await fetchApi(`/quizzes/${quizId}`, { method: 'DELETE' });
      toast.success('Quiz deleted');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500 py-2">Loading quizzes...</p>;
  }

  return (
    <div className="mt-8 pt-8 border-t">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
          <ClipboardList size={20} className="text-black" /> Lesson Quizzes
        </h3>
        {isInstructor && (
          <Link href={`/courses/${courseId}/add-quiz?lessonId=${lessonId}`}>
            <Button size="sm" className="bg-black hover:bg-gray-800 text-white">
              + Add Quiz
            </Button>
          </Link>
        )}
      </div>

      {quizzes.length === 0 ? (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 border border-dashed">
          {isInstructor ? 'No quizzes for this lesson yet.' : 'No quizzes available.'}
        </p>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{quiz.title}</p>
                {quiz.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{quiz.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {quiz.totalMarks} marks · {quiz.durationInMinutes} min
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isInstructor ? (
                  <>
                    <Link href={`/courses/${courseId}/quizzes/${quiz._id}/submissions`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Users size={14} /> Submissions
                      </Button>
                    </Link>
                    <Link href={`/courses/${courseId}/quizzes/${quiz._id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600"
                      onClick={(e) => handleDelete(quiz._id, e)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </>
                ) : isStudent && isEnrolled ? (
                  attempted[quiz._id] ? (
                    <Link href={`/courses/${courseId}/quizzes/${quiz._id}/result`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Trophy size={14} /> View Result
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/courses/${courseId}/quizzes/${quiz._id}`}>
                      <Button size="sm" className="bg-black hover:bg-gray-800 text-white gap-1">
                        <Play size={14} /> Take Quiz
                      </Button>
                    </Link>
                  )
                ) : (
                  <span className="text-xs text-gray-400 font-medium">Enroll to take quiz</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
