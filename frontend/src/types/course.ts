import { QuizSummary } from './quiz';

export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: string;
  content?: string;
  isCompleted?: boolean; // This will be set by the lesson track
}

export interface Course {
  _id: string;
  title: string;
  short_description: string;
  description?: string;
  instructor_name?: string;
  instructor_id?: string;
  thumbnail?: string;
  lessons: Lesson[];
  quizzes: QuizSummary[]; // Add quizzes to the Course type
}
