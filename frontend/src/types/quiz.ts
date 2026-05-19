export type QuestionType = 'MCQ' | 'QNA';
export type QuizType = 'MCQ' | 'QNA' | 'MIXED';

export interface QuizQuestion {
  _id?: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer?: number;
  answer?: string;
  marks: number;
}

export interface QuizSummary {
  _id: string;
  title: string;
  description?: string;
  totalMarks: number;
  durationInMinutes: number;
}

export interface Quiz extends QuizSummary {
  lessonId: string;
  courseId: string;
  quizType: QuizType;
  questions: QuizQuestion[];
  passingMarks: number;
  isPublished?: boolean;
}

export interface QuizAnswerSubmission {
  questionId: string;
  type: QuestionType;
  selectedOption?: number;
  answerText?: string;
}

export function createEmptyQuestion(type: QuestionType = 'MCQ'): QuizQuestion {
  return {
    type,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    answer: '',
    marks: 1,
  };
}

export function computeTotalMarks(questions: QuizQuestion[]): number {
  return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
}
