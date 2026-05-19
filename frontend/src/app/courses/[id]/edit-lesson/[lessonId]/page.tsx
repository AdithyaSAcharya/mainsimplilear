"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi, uploadFile } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { LessonVideoUpload } from '@/components/lesson/LessonVideoUpload';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <p className="text-gray-500">Loading editor...</p> });

export default function EditLesson() {
  const { id, lessonId } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState({
    title: '',
    description: '',
    content: '',
    courseId: id,
    thumbnail: '',
    videoUrl: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchApi(`/lessons/${lessonId}`)
      .then(res => {
        setLesson({
          title: res.title || '',
          description: res.description || '',
          content: res.content || '',
          courseId: id as string,
          thumbnail: res.thumbnail || '',
          videoUrl: res.videoUrl || null,
        });
        if (res.thumbnail) setImagePreview(res.thumbnail);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load lesson details');
        setLoading(false);
      });
  }, [lessonId, id]);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Step 1: Update lesson content
      await fetchApi(`/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(lesson)
      });

      // Step 2: Upload new thumbnail if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await uploadFile(`/uploads/lesson/${lessonId}/thumbnail`, formData);
      }

      toast.success('Lesson updated successfully!');
      router.push(`/courses/${id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>;
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" className="mb-6 flex items-center gap-2 hover:bg-gray-200 transition" onClick={() => router.push(`/courses/${id}`)}>
        <ArrowLeft size={18} /> Back to Course
      </Button>

      <Card className="shadow-2xl border-0 overflow-hidden bg-white rounded-2xl">
        <div className="h-2 bg-black w-full"></div>
        <CardHeader className="bg-gray-50 border-b px-8 py-6">
          <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">Edit Lesson</CardTitle>
          <p className="text-gray-500 mt-2 text-sm">Update the details and content for this lesson.</p>
        </CardHeader>
        <CardContent className="p-8 md:p-10">
          <form onSubmit={handleUpdateLesson} className="space-y-8">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Lesson Title</label>
              <Input
                placeholder="e.g. Introduction to Generative AI"
                className="bg-gray-50 border-gray-300 focus:ring-2 focus:ring-gray-900 rounded-md shadow-sm"
                value={lesson.title}
                onChange={e => setLesson({...lesson, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Short Description</label>
              <Input
                placeholder="What will the student learn in this lesson?"
                className="bg-gray-50 border-gray-300 focus:ring-2 focus:ring-gray-900 rounded-md shadow-sm"
                value={lesson.description}
                onChange={e => setLesson({...lesson, description: e.target.value})}
                required
              />
            </div>

            {/* Lesson Thumbnail Upload */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Lesson Thumbnail (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <img src={imagePreview} alt="Lesson Thumbnail Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); setLesson({...lesson, thumbnail: ''}); }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-red-50 transition"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-black text-white text-xs px-3 py-1.5 rounded-md hover:bg-gray-800 transition"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition cursor-pointer gap-2"
                >
                  <ImagePlus size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500 font-medium">Click to upload thumbnail</span>
                  <span className="text-xs text-gray-400">JPG, PNG, WEBP — max 5MB</span>
                </button>
              )}
            </div>

            <LessonVideoUpload
              lessonId={lessonId as string}
              videoUrl={lesson.videoUrl}
              onVideoChange={(videoUrl) =>
                setLesson((prev) => ({ ...prev, videoUrl }))
              }
            />

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Rich Content</label>
              <div className="pb-12">
                <ReactQuill
                  theme="snow"
                  placeholder="Write your lesson content here..."
                  className="bg-white h-[350px] mb-8 rounded-xl overflow-hidden shadow-sm border border-gray-300"
                  value={lesson.content}
                  modules={modules}
                  onChange={(val: string) => setLesson({...lesson, content: val})}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
              <Button type="button" variant="outline" className="px-6 font-semibold text-gray-600 rounded-md" onClick={() => router.push(`/courses/${id}`)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="px-6 font-semibold bg-black hover:bg-gray-800 text-white shadow-sm rounded-md">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
