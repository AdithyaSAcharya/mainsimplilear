import { fetchApi, uploadFile } from '@/lib/api';

export async function uploadLessonVideo(lessonId: string, file: File) {
  const formData = new FormData();
  formData.append('video', file);
  return uploadFile(`/uploads/lesson/${lessonId}/video`, formData) as Promise<{
    url: string;
  }>;
}

export async function removeLessonVideo(lessonId: string) {
  await fetchApi(`/uploads/lesson/${lessonId}/video`, { method: 'DELETE' });
}
