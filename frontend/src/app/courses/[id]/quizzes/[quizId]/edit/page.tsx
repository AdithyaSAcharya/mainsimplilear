"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { QuizForm, type QuizFormValues } from '@/components/quiz/QuizForm';
import { computeTotalMarks, createEmptyQuestion } from '@/types/quiz';
import type { Quiz } from '@/types/quiz';

export default function EditQuizPage() {
  const { id, quizId } = useParams();
  const router = useRouter();
  const [lessons, setLessons] = useState<{ _id: string; title: string }[]>([]);
  const [initial, setInitial] = useState<QuizFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = (localStorage.getItem('role') || '').toUpperCase();
    if (role !== 'INSTRUCTOR' && role !== 'SUPER_ADMIN') {
      toast.error('Only instructors can edit quizzes');
      router.push(`/courses/${id}`);
      return;
    }

    Promise.all([
      fetchApi(`/courses/${id}`),
      fetchApi(`/quizzes/${quizId}/manage`),
    ])
      .then(([courseRes, quizRes]) => {
        const quiz = quizRes.quiz as Quiz;
        setLessons(courseRes.course?.lessons || []);
        setInitial({
          lessonId: quiz.lessonId,
          title: quiz.title,
          description: quiz.description || '',
          quizType: quiz.quizType,
          durationInMinutes: quiz.durationInMinutes,
          passingMarks: quiz.passingMarks,
          questions: quiz.questions?.length ? quiz.questions : [createEmptyQuestion('MCQ')],
        });
      })
      .catch((err: Error) => {
        toast.error(err.message);
        router.push(`/courses/${id}`);
      })
      .finally(() => setLoading(false));
  }, [id, quizId, router]);

  const handleSubmit = async (values: QuizFormValues) => {
    const totalMarks = computeTotalMarks(values.questions);
    await fetchApi(`/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify({
        lessonId: values.lessonId,
        title: values.title,
        description: values.description,
        quizType: values.quizType,
        questions: values.questions,
        durationInMinutes: values.durationInMinutes,
        totalMarks,
        passingMarks: values.passingMarks,
      }),
    });
    toast.success('Quiz updated successfully!');
    router.push(`/courses/${id}`);
  };

  if (loading || !initial) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <Button variant="ghost" className="mb-6 flex items-center gap-2" onClick={() => router.push(`/courses/${id}`)}>
        <ArrowLeft size={18} /> Back to Course
      </Button>
      <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl">
        <div className="h-2 bg-black w-full" />
        <CardHeader className="bg-gray-50 border-b px-8 py-6">
          <CardTitle className="text-2xl font-bold">Edit Quiz</CardTitle>
        </CardHeader>
        <CardContent className="p-8 md:p-10">
          <QuizForm
            lessons={lessons}
            submitLabel="Save Changes"
            onCancel={() => router.push(`/courses/${id}`)}
            initial={initial}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
