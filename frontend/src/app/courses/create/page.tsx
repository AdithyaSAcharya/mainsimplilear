"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi, uploadFile } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function CreateCourse() {
  const router = useRouter();
  const [newCourse, setNewCourse] = useState({ title: '', shortDescription: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Step 1: Create the course
      const res = await fetchApi('/courses', {
        method: 'POST',
        body: JSON.stringify(newCourse)
      });
      const courseId = res.courseId;

      // Step 2: Upload image if one was selected
      if (imageFile && courseId) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await uploadFile(`/uploads/course/${courseId}/thumbnail`, formData);
      }

      toast.success('Course created successfully!');
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" className="mb-6 flex items-center gap-2 hover:bg-gray-200 transition" onClick={() => router.push('/dashboard')}>
        <ArrowLeft size={18} /> Back to Dashboard
      </Button>

      <Card className="shadow-2xl border-0 overflow-hidden bg-white rounded-2xl max-w-3xl">
        <div className="h-2 bg-black w-full"></div>
        <CardHeader className="bg-gray-50 border-b px-8 py-6">
          <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">Create New Course</CardTitle>
          <p className="text-gray-500 mt-2 text-sm">Fill in the details to start building your new course.</p>
        </CardHeader>
        <CardContent className="p-8 md:p-10 bg-white">
          <form onSubmit={handleAddCourse} className="space-y-6">
            <div>
              <Label className="text-gray-700 font-semibold mb-2 block text-sm">Course Title</Label>
              <Input
                className="bg-gray-50 border-gray-300 focus:ring-2 focus:ring-gray-900 rounded-md shadow-sm"
                placeholder="Enter title..."
                value={newCourse.title}
                onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="text-gray-700 font-semibold mb-2 block text-sm">Short Description</Label>
              <textarea
                className="w-full bg-gray-50 border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none shadow-sm"
                placeholder="What is this course about?"
                rows={5}
                value={newCourse.shortDescription}
                onChange={e => setNewCourse({ ...newCourse, shortDescription: e.target.value })}
                required
              />
            </div>

            {/* Thumbnail Upload */}
            <div>
              <Label className="text-gray-700 font-semibold mb-2 block text-sm">Course Thumbnail (optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-red-50 transition"
                  >
                    <X size={16} className="text-red-500" />
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

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
              <Button type="button" variant="outline" className="px-6 font-semibold text-gray-600 rounded-md" onClick={() => router.push('/dashboard')}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="px-6 font-semibold bg-black hover:bg-gray-800 text-white shadow-sm rounded-md">
                {isSubmitting ? 'Creating...' : 'Create Draft Course'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
