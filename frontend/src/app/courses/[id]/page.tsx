"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { fetchApi, uploadFile, downloadFile } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle2, PlayCircle, LockIcon as LucideLockIcon, Users, Edit, Trash2, ImagePlus, X, MessageCircle, Award } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { LessonQuizzes } from '@/components/quiz/LessonQuizzes';
import { LessonVideoPlayer } from '@/components/lesson/LessonVideoPlayer';

export default function CourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [role, setRole] = useState<string>('');

  const [lessonProgress, setLessonProgress] = useState<any[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const [isCertLoading, setIsCertLoading] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editCourseData, setEditCourseData] = useState({ title: '', short_description: '' });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const loadProgress = () => {
    fetchApi('/enrollments/completion-status', {
      method: 'POST',
      body: JSON.stringify({ course_id: Number(id) })
    })
      .then(res => {
        if (res && res.lessons) {
          setLessonProgress(
            res.lessons.map((l: any) => ({
              lesson_id: l.lessonId,
              status: l.isCompleted ? 'completed' : (l.trackStatus === 'completed' ? 'in_progress' : l.trackStatus),
              trackStatus: l.trackStatus,
              hasQuiz: l.hasQuiz,
              allQuizzesPassed: l.allQuizzesPassed,
              isCompleted: l.isCompleted
            }))
          );
        }
      })
      .catch(console.error);
  };

  if (lessonProgress.length > 0) {
    console.log(lessonProgress[0].status);
  }
  console.log(course);

  useEffect(() => {
    const currentRole = (localStorage.getItem('role') || 'STUDENT').toUpperCase();
    setRole(currentRole);
    const storedUserId = localStorage.getItem('userId');
    const uId = storedUserId ? Number(storedUserId) : null;
    setUserId(uId);

    loadCourse(currentRole, uId);
    if (currentRole === 'STUDENT') {
      loadProgress();
    }
  }, [id]);

  const loadCourse = (currentRole: string, uId: number | null) => {
    fetchApi(`/courses/${id}`).then(res => {
      setCourse(res.course);
      setEditCourseData({ title: res.course.title, short_description: res.course.short_description });
      if (currentRole === 'SUPER_ADMIN' || (currentRole === 'INSTRUCTOR' && Number(res.course.instructor_id) === uId)) {
        fetchApi(`/enrollments/course/${id}`).then(enrollRes => setEnrollments(enrollRes.enrollments || [])).catch(console.error);
      }
    }).catch(console.error);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(`/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editCourseData)
      });
      // Upload thumbnail if one was selected
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('image', thumbnailFile);
        await uploadFile(`/uploads/course/${id}/thumbnail`, formData);
      }
      toast.success('Course updated successfully!');
      setIsEditingCourse(false);
      setThumbnailFile(null);
      loadCourse();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleLessonStatus = async (lessonId: string, currentTrackStatus: string) => {
    try {
      const nextStatus = currentTrackStatus === 'completed' ? 'not_started' : 'completed';
      await fetchApi(`/lesson-tracks/${id}/${lessonId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });

      // Reload server-verified progress
      loadProgress();

      if (nextStatus === 'completed') {
        const prog = lessonProgress.find(p => p.lesson_id === lessonId);
        if (prog && prog.hasQuiz && !prog.allQuizzesPassed) {
          toast.info('Lesson marked as read, but quizzes are still pending!');
        } else {
          toast.success('Lesson marked as completed!');
        }
      } else {
        toast.success('Lesson marked as incomplete.');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDownloadCertificate = async () => {
    setIsCertLoading(true);
    try {
      await downloadFile(`/certificates/${id}`, `Certificate_${course?.title || 'Course'}.pdf`);
    } catch (err: any) {
      toast.error(err.message || 'Could not generate certificate. Please ensure you have completed all lessons and quizzes.');
    } finally {
      setIsCertLoading(false);
    }
  };

  const openLesson = async (lesson: { _id: string }) => {
    try {
      const fresh = await fetchApi(`/lessons/${lesson._id}`);
      setSelectedLesson(fresh);
    } catch {
      setSelectedLesson(lesson);
    }
  };

  const handleDeleteLesson = async (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await fetchApi(`/lessons/${lessonId}`, { method: 'DELETE' });
      toast.success('Lesson deleted successfully');
      loadCourse(); // Reload the course to update lesson list
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalLessons = course?.lessons?.length || 0;
  const completedLessons = lessonProgress.filter(p => p.status === 'completed').length;
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;


  if (!course) return <div className="p-8 flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>;

  if (selectedLesson) {
    const isEnrolled = !!selectedLesson.content || role === 'SUPER_ADMIN' || (role === 'INSTRUCTOR' && Number(course?.instructor_id) === userId);
    const progressStatus = lessonProgress.find(p => p.lesson_id === selectedLesson._id)?.status || 'not_started';

    return (
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <Button variant="ghost" className="mb-6 flex items-center gap-2 hover:bg-gray-200 transition" onClick={() => setSelectedLesson(null)}>
          <ArrowLeft size={18} /> Back to Course Overview
        </Button>
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="h-2 bg-black w-full" />
          {selectedLesson.thumbnail && (
            <div className="w-full bg-gray-100 border-b">
              <img
                src={selectedLesson.thumbnail}
                alt={selectedLesson.title}
                className="w-full max-h-[min(70vh,520px)] object-contain mx-auto block"
              />
            </div>
          )}
          <CardHeader className="flex flex-col md:flex-row justify-between md:items-start gap-4 border-b bg-gray-50 pb-8 pt-8 px-8">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">{selectedLesson.title}</CardTitle>
              <p className="text-gray-600 mt-2 text-base leading-relaxed max-w-3xl">{selectedLesson.description}</p>
            </div>
            {role === 'STUDENT' && isEnrolled && (() => {
              const prog = lessonProgress.find(p => p.lesson_id === selectedLesson._id);
              const currentTrackStatus = prog?.trackStatus || 'not_started';
              const isFullyCompleted = prog?.isCompleted || false;
              const hasQuiz = prog?.hasQuiz || false;
              const allQuizzesPassed = prog?.allQuizzesPassed || false;

              if (isFullyCompleted) {
                return (
                  <Button
                    size="lg"
                    className="flex-shrink-0 transition-all shadow-md bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => toggleLessonStatus(selectedLesson._id, currentTrackStatus)}
                  >
                    <CheckCircle2 className="mr-2" /> Completed
                  </Button>
                );
              } else if (currentTrackStatus === 'completed' && hasQuiz && !allQuizzesPassed) {
                return (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
                      ⚠️ Quizzes Pending
                    </span>
                    <Button
                      size="lg"
                      className="flex-shrink-0 transition-all shadow-md bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => toggleLessonStatus(selectedLesson._id, currentTrackStatus)}
                    >
                      Mark Incomplete
                    </Button>
                  </div>
                );
              } else {
                return (
                  <Button
                    size="lg"
                    className="flex-shrink-0 transition-all shadow-md bg-black hover:bg-gray-800 text-white"
                    onClick={() => toggleLessonStatus(selectedLesson._id, currentTrackStatus)}
                  >
                    Mark Complete
                  </Button>
                );
              }
            })()}
          </CardHeader>
          <CardContent className="p-8 md:p-12 min-h-[400px]">
            {(isEnrolled || role === 'INSTRUCTOR' || role === 'SUPER_ADMIN') && selectedLesson.videoUrl && (
              <LessonVideoPlayer
                videoUrl={selectedLesson.videoUrl}
                title={selectedLesson.title}
              />
            )}
            {isEnrolled && selectedLesson.content ? (
              <div
                className="lesson-content prose max-w-none prose-lg text-gray-800"
                dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
              />
            ) : (
              <div className="py-20 px-8 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-300">
                <LockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Content Locked</h3>
                <p className="text-lg text-gray-500 font-medium">Please enroll in this course to view the full lesson content.</p>
              </div>
            )}
            <LessonQuizzes
              courseId={id as string}
              lessonId={selectedLesson._id}
              role={role}
              isEnrolled={isEnrolled}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="bg-white rounded-2xl shadow-sm border mb-10 overflow-hidden relative">
        {course.thumbnail ? (
          <div className="w-full h-48 overflow-hidden">
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
        )}
        <div className="p-8 flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{course.title}</h1>
              {(role === 'SUPER_ADMIN' || (role === 'INSTRUCTOR' && Number(course.instructor_id) === userId)) && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingCourse(true)} className="flex items-center gap-1">
                  <Edit size={14} /> Edit
                </Button>
              )}
            </div>
            <p className="text-base text-gray-600 mb-4 max-w-3xl leading-relaxed">{course.short_description}</p>
            {course.instructor_name && (
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-black bg-gray-100 border border-gray-200 inline-block px-4 py-1.5 rounded-full shadow-sm">
                  Instructor: {course.instructor_name}
                </p>
                {role === 'STUDENT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openChat', { detail: { otherUserId: course.instructor_id } }));
                    }}
                  >
                    <MessageCircle size={16} /> Message
                  </Button>
                )}
              </div>
            )}
          </div>
          {role === 'STUDENT' && (
            <div className="w-full md:w-80 flex flex-col gap-3">
              <div className="bg-gray-50 p-5 rounded-xl border shadow-inner">
                <div className="flex justify-between items-center text-sm font-bold mb-3">
                  <span className="text-gray-700 uppercase tracking-wider">Course Progress</span>
                  <span className="text-black text-lg">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2 shadow-inner overflow-hidden">
                  <div className="bg-black h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-sm text-gray-500 text-right font-medium">{completedLessons} of {totalLessons} lessons completed</p>
              </div>
              {percentage === 100 && totalLessons > 0 && (
                <button
                  id="download-certificate-btn"
                  onClick={handleDownloadCertificate}
                  disabled={isCertLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-amber-200 transition-all duration-200 hover:scale-[1.02] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCertLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <Award size={20} />
                  )}
                  {isCertLoading ? 'Generating...' : '🎓 Get Your Certificate'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800"><PlayCircle size={20} className="text-black" /> Course Content</h2>
            {(role === 'SUPER_ADMIN' || (role === 'INSTRUCTOR' && Number(course.instructor_id) === userId)) && (
              <div className="flex gap-2">
                <Link href={`/courses/${id}/add-quiz`}>
                  <Button variant="outline" className="font-semibold rounded-md px-4 py-2 shadow-sm">
                    + Add Quiz
                  </Button>
                </Link>
                <Link href={`/courses/${id}/add-lesson`}>
                  <Button className="bg-black hover:bg-gray-800 text-white font-semibold rounded-md px-4 py-2 shadow-sm">
                    + Add New Lesson
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {course.lessons?.map((l: any, idx: number) => {
              const prog = lessonProgress.find(p => p.lesson_id === l._id);
              const progress = prog?.status || 'not_started';
              const trackStatus = prog?.trackStatus || 'not_started';
              const hasQuiz = prog?.hasQuiz || false;
              const allQuizzesPassed = prog?.allQuizzesPassed || false;
              const isCompleted = prog?.isCompleted || false;

              return (
                <div
                  key={l._id}
                  onClick={() => openLesson(l)}
                  className={`group bg-white p-6 rounded-xl border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${isCompleted ? 'border-l-4 border-l-green-500' : (trackStatus === 'completed' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-gray-900')}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-start gap-4">
                      {l.thumbnail && (
                        <div className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={l.thumbnail} alt={l.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      {!l.thumbnail && (
                        <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isCompleted ? 'bg-green-100 text-green-700' : (trackStatus === 'completed' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-black')}`}>
                          {idx + 1}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-black transition-colors flex items-center gap-2">
                          {l.title}
                          {trackStatus === 'completed' && hasQuiz && !allQuizzesPassed && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                              Quizzes Pending
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{l.description}</p>
                        {l.videoUrl && (
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            Video lesson
                          </span>
                        )}
                      </div>
                    </div>
                    {(role === 'SUPER_ADMIN' || (role === 'INSTRUCTOR' && Number(course.instructor_id) === userId)) ? (
                      <div className="flex items-center gap-1">
                        <Link href={`/courses/${id}/edit-lesson/${l._id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-black">
                            <Edit size={18} />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => handleDeleteLesson(l._id, e)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    ) : role === 'STUDENT' && (
                      isCompleted ? (
                        <CheckCircle2 size={24} className="text-green-500 flex-shrink-0 drop-shadow-sm" />
                      ) : (trackStatus === 'completed' && hasQuiz && !allQuizzesPassed) ? (
                        <span className="text-amber-500 font-medium text-xs flex items-center gap-1">
                          ⚠️ Pending Quiz
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              );
            })}
            {(!course.lessons || course.lessons.length === 0) && (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <p className="text-xl text-gray-500 font-medium">No lessons available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(role === 'SUPER_ADMIN' || (role === 'INSTRUCTOR' && Number(course.instructor_id) === userId)) && (
        <div className="w-full mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800"><Users size={20} className="text-black" /> Enrolled Students ({enrollments.length})</h2>
          </div>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {enrollments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {enrollments.map((en, idx) => (
                  <div key={en.id || idx} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">{en.full_name}</p>
                      <p className="text-sm text-gray-500">{en.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {(role === 'INSTRUCTOR' || role === 'SUPER_ADMIN') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('openChat', { detail: { otherUserId: en.user_id } }));
                          }}
                        >
                          <MessageCircle size={16} className="mr-1" /> Message
                        </Button>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${en.completion_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-black'}`}>
                        {en.completion_status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No students enrolled yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Course Dialog */}
      <Dialog open={isEditingCourse} onOpenChange={setIsEditingCourse}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Course Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCourse} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Course Title</Label>
              <Input
                value={editCourseData.title}
                onChange={(e) => setEditCourseData({ ...editCourseData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Short Description</Label>
              <textarea
                className="w-full min-h-[100px] border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                value={editCourseData.short_description}
                onChange={(e) => setEditCourseData({ ...editCourseData, short_description: e.target.value })}
                required
              />
            </div>
            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label>Course Thumbnail</Label>
              <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)); }
              }} />
              {thumbnailPreview ? (
                <div className="relative w-full h-36 rounded-lg overflow-hidden border border-gray-200">
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50">
                    <X size={14} className="text-red-500" />
                  </button>
                  <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="absolute bottom-2 right-2 bg-black text-white text-xs px-2 py-1 rounded hover:bg-gray-800">
                    Change
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="flex items-center justify-center w-full h-28 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition gap-2">
                  {course?.thumbnail ? (
                    <img src={course.thumbnail} alt="Current thumbnail" className="h-full w-full object-cover rounded-lg opacity-60" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-gray-400">
                      <ImagePlus size={24} />
                      <span className="text-xs">Upload thumbnail</span>
                    </span>
                  )}
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditingCourse(false)}>Cancel</Button>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple Lock Icon component since we might not have it imported from lucide
function LockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
