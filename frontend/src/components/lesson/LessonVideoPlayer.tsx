"use client";

interface LessonVideoPlayerProps {
  videoUrl: string;
  title?: string;
}

export function LessonVideoPlayer({ videoUrl, title }: LessonVideoPlayerProps) {
  if (!videoUrl) return null;

  return (
    <div className="mb-8 rounded-xl overflow-hidden border border-gray-200 bg-black shadow-sm">
      <video
        src={videoUrl}
        controls
        className="w-full aspect-video"
        preload="metadata"
        title={title || 'Lesson video'}
      />
    </div>
  );
}
