"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import type { QuizQuestion, QuestionType, QuizType } from '@/types/quiz';

interface QuestionEditorProps {
  question: QuizQuestion;
  index: number;
  quizType: QuizType;
  onChange: (question: QuizQuestion) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function QuestionEditor({
  question,
  index,
  quizType,
  onChange,
  onRemove,
  canRemove,
}: QuestionEditorProps) {
  const showTypePicker = quizType === 'MIXED';

  const updateOption = (optIndex: number, value: string) => {
    const options = [...(question.options || ['', '', '', ''])];
    options[optIndex] = value;
    onChange({ ...question, options });
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6 bg-gray-50 border-b">
        <CardTitle className="text-base font-semibold text-gray-900">Question {index + 1}</CardTitle>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={onRemove}>
            <Trash2 size={16} className="mr-1" /> Remove
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <FormRow>
          {showTypePicker && (
            <FormCol>
              <Label>Question type</Label>
              <select
                className="w-full border border-gray-300 rounded-md h-10 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                value={question.type}
                onChange={(e) =>
                  onChange({
                    ...question,
                    type: e.target.value as QuestionType,
                    options: e.target.value === 'MCQ' ? ['', '', '', ''] : undefined,
                    correctAnswer: e.target.value === 'MCQ' ? 0 : undefined,
                  })
                }
              >
                <option value="MCQ">Multiple choice</option>
                <option value="QNA">Written answer</option>
              </select>
            </FormCol>
          )}
          <FormCol className={showTypePicker ? '' : 'sm:col-span-2'}>
            <Label>Marks</Label>
            <Input
              type="number"
              min={1}
              value={question.marks}
              onChange={(e) => onChange({ ...question, marks: Number(e.target.value) || 1 })}
              className="bg-gray-50"
            />
          </FormCol>
        </FormRow>

        <FormCol>
          <Label>Question text</Label>
          <textarea
            className="w-full min-h-[80px] border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"
            value={question.question}
            onChange={(e) => onChange({ ...question, question: e.target.value })}
            placeholder="Enter the question..."
            required
          />
        </FormCol>

        {question.type === 'MCQ' ? (
          <div className="space-y-3">
            <Label>Options (select the correct answer)</Label>
            {(question.options || ['', '', '', '']).map((opt, optIndex) => (
              <div key={optIndex} className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`correct-${index}`}
                  checked={question.correctAnswer === optIndex}
                  onChange={() => onChange({ ...question, correctAnswer: optIndex })}
                  className="h-4 w-4 accent-black"
                />
                <Input
                  value={opt}
                  onChange={(e) => updateOption(optIndex, e.target.value)}
                  placeholder={`Option ${optIndex + 1}`}
                  className="bg-gray-50 flex-1"
                  required
                />
              </div>
            ))}
          </div>
        ) : (
          <FormCol>
            <Label>Model answer (for your reference; not shown to students)</Label>
            <textarea
              className="w-full min-h-[72px] border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"
              value={question.answer || ''}
              onChange={(e) => onChange({ ...question, answer: e.target.value })}
              placeholder="Expected answer or grading notes..."
            />
          </FormCol>
        )}
      </CardContent>
    </Card>
  );
}

function FormRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>{children}</div>;
}

function FormCol({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}
