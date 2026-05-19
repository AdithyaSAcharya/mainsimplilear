"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { QuestionEditor } from '@/components/quiz/QuestionEditor';
import type { QuizQuestion, QuizType, QuestionType } from '@/types/quiz';
import { computeTotalMarks, createEmptyQuestion } from '@/types/quiz';

export interface QuizFormValues {
  lessonId: string;
  title: string;
  description: string;
  quizType: QuizType;
  durationInMinutes: number;
  passingMarks: number;
  questions: QuizQuestion[];
}

interface QuizFormProps {
  initial: QuizFormValues;
  lessons: { _id: string; title: string }[];
  submitLabel: string;
  onSubmit: (values: QuizFormValues) => Promise<void>;
  onCancel: () => void;
}

export function QuizForm({ initial, lessons, submitLabel, onSubmit, onCancel }: QuizFormProps) {
  const [form, setForm] = useState<QuizFormValues>(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultQuestionType = (quizType: QuizType): QuestionType =>
    quizType === 'QNA' ? 'QNA' : 'MCQ';

  const handleQuizTypeChange = (quizType: QuizType) => {
    const type = defaultQuestionType(quizType);
    setForm((prev) => ({
      ...prev,
      quizType,
      questions: prev.questions.map((q) => ({ ...q, type: quizType === 'MIXED' ? q.type : type })),
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion(defaultQuestionType(prev.quizType))],
    }));
  };

  const updateQuestion = (index: number, question: QuizQuestion) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? question : q)),
    }));
  };

  const removeQuestion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.questions.length === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalMarks = computeTotalMarks(form.questions);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2 sm:col-span-2">
          <Label>Lesson</Label>
          <select
            className="w-full border border-gray-300 rounded-md h-10 px-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
            value={form.lessonId}
            onChange={(e) => setForm({ ...form, lessonId: e.target.value })}
            required
          >
            <option value="">Select a lesson</option>
            {lessons.map((l) => (
              <option key={l._id} value={l._id}>{l.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Quiz title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Chapter 1 checkpoint"
            className="bg-gray-50"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Quiz type</Label>
          <select
            className="w-full border border-gray-300 rounded-md h-10 px-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
            value={form.quizType}
            onChange={(e) => handleQuizTypeChange(e.target.value as QuizType)}
          >
            <option value="MCQ">Multiple choice only</option>
            <option value="QNA">Written answers only</option>
            <option value="MIXED">Mixed (MCQ + written)</option>
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Description (optional)</Label>
          <textarea
            className="w-full min-h-[72px] border border-gray-300 rounded-md p-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief instructions for students..."
          />
        </div>
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            min={1}
            value={form.durationInMinutes}
            onChange={(e) => setForm({ ...form, durationInMinutes: Number(e.target.value) || 10 })}
            className="bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <Label>Passing marks</Label>
          <Input
            type="number"
            min={0}
            value={form.passingMarks}
            onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) || 0 })}
            className="bg-gray-50"
          />
        </div>
        <div className="sm:col-span-2 rounded-lg bg-gray-50 border px-4 py-3 text-sm text-gray-700">
          Total marks: <span className="font-bold text-black">{totalMarks}</span> (auto-calculated from questions)
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
          <Button type="button" variant="outline" onClick={addQuestion} className="gap-1">
            <Plus size={16} /> Add question
          </Button>
        </div>
        {form.questions.map((q, index) => (
          <QuestionEditor
            key={index}
            question={q}
            index={index}
            quizType={form.quizType}
            onChange={(updated) => updateQuestion(index, updated)}
            onRemove={() => removeQuestion(index)}
            canRemove={form.questions.length > 1}
          />
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          type="submit"
          disabled={isSubmitting || form.questions.length === 0 || !form.lessonId}
          className="bg-black hover:bg-gray-800 text-white"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
