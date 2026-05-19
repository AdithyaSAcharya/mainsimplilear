"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { QuizForm, type QuizFormValues } from '@/components/quiz/QuizForm';
import { computeTotalMarks, createEmptyQuestion } from '@/types/quiz';

function AddQuizContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLesson = searchParams.get('lessonId') || '';

  const [lessons, setLessons] = useState<{ _id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = (localStorage.getItem('role') || '').toUpperCase();
    if (role !== 'INSTRUCTOR' && role !== 'SUPER_ADMIN') {
      toast.error('Only instructors can create quizzes');
      router.push(`/courses/${id}`);
      return;
    }
    fetchApi(`/courses/${id}`)
      .then((res) => setLessons(res.course?.lessons || []))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (values: QuizFormValues) => {
    const totalMarks = computeTotalMarks(values.questions);
    await fetchApi(`/quizzes/course/${id}`, {
      method: 'POST',
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
    toast.success('Quiz created successfully!');
    router.push(`/courses/${id}`);
  };

  if (loading) {
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
          <CardTitle className="text-2xl font-bold">Create Quiz</CardTitle>
          <p className="text-gray-500 mt-2 text-sm">Add a quiz linked to a lesson. Enrolled students can take it.</p>
        </CardHeader>
        <CardContent className="p-8 md:p-10">
          {lessons.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Add at least one lesson before creating a quiz.</p>
          ) : (
            <QuizForm
              lessons={lessons}
              submitLabel="Publish Quiz"
              onCancel={() => router.push(`/courses/${id}`)}
              initial={{
                lessonId: preselectedLesson,
                title: '',
                description: '',
                quizType: 'MCQ',
                durationInMinutes: 10,
                passingMarks: 0,
                questions: [createEmptyQuestion('MCQ')],
              }}
              onSubmit={handleSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddQuizPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" /></div>}>
      <AddQuizContent />
    </Suspense>
  );
}
