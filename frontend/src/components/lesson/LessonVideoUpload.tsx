"use client";

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Film, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { removeLessonVideo, uploadLessonVideo } from '@/lib/lessonVideo';

interface LessonVideoUploadProps {
  lessonId?: string;
  videoUrl?: string | null;
  onVideoChange?: (videoUrl: string | null) => void;
  disabled?: boolean;
}

export function LessonVideoUpload({
  lessonId,
  videoUrl,
  onVideoChange,
  disabled = false,
}: LessonVideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(videoUrl || null);

  const displayUrl = localUrl || videoUrl;
  const canUpload = Boolean(lessonId) && !disabled;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    setPendingFile(file);
  };

  const handleUpload = async () => {
    if (!lessonId || !pendingFile) return;
    setUploading(true);
    try {
      const res = await uploadLessonVideo(lessonId, pendingFile);
      setLocalUrl(res.url);
      onVideoChange?.(res.url);
      setPendingFile(null);
      toast.success('Video uploaded to Cloudinary');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Video upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!lessonId || !displayUrl) {
      setPendingFile(null);
      setLocalUrl(null);
      onVideoChange?.(null);
      return;
    }
    if (!confirm('Remove this lesson video?')) return;
    setUploading(true);
    try {
      await removeLessonVideo(lessonId);
      setLocalUrl(null);
      setPendingFile(null);
      onVideoChange?.(null);
      toast.success('Video removed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700 block">Lesson video (Cloudinary)</label>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        disabled={!canUpload || uploading}
        onChange={handleFileSelect}
      />

      {displayUrl && !pendingFile && (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-black">
          <video src={displayUrl} controls className="w-full aspect-video" preload="metadata" />
          {canUpload && (
            <div className="p-2 bg-gray-50 border-t flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
                Replace video
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-red-600" disabled={uploading} onClick={handleRemove}>
                <Trash2 size={14} className="mr-1" /> Remove
              </Button>
            </div>
          )}
        </div>
      )}

      {pendingFile && (
        <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-800 truncate">{pendingFile.name}</p>
            <button type="button" onClick={() => setPendingFile(null)} className="text-gray-400 hover:text-red-500">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500">{(pendingFile.size / (1024 * 1024)).toFixed(1)} MB</p>
          {!lessonId ? (
            <p className="text-xs text-amber-700">Save the lesson first, then upload the video.</p>
          ) : (
            <Button type="button" className="bg-black text-white w-full" disabled={uploading} onClick={handleUpload}>
              {uploading ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Uploading to Cloudinary…</>
              ) : (
                'Upload video'
              )}
            </Button>
          )}
        </div>
      )}

      {!displayUrl && !pendingFile && (
        <button
          type="button"
          disabled={!canUpload || uploading}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition cursor-pointer gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Film size={32} className="text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">Upload lesson video</span>
          <span className="text-xs text-gray-400">MP4, MOV, WebM — hosted on Cloudinary</span>
        </button>
      )}
    </div>
  );
}
