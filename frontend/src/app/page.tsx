"use client";
import { fetchApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlayCircle, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchApi('/courses').then(res => setCourses(res.courses)).catch(console.error);
    
    const currentRole = (localStorage.getItem('role') || '').toUpperCase();
    setRole(currentRole);

    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(Number(storedUserId));
    }

    if (localStorage.getItem('token')) {
      setIsLoggedIn(true);
      if (currentRole === 'STUDENT') {
        fetchApi('/enrollments/user')
          .then(res => {
            if (res.enrollments) {
              setEnrolledCourseIds(res.enrollments.map((e: any) => Number(e.course_id)));
            }
          })
          .catch(console.error);
      }
    }
  }, []);

  const handleEnroll = async (courseId: number) => {
    if (!isLoggedIn) {
      toast.error('Please login to enroll');
      router.push('/login');
      return;
    }

    try {
      await fetchApi('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId })
      });
      toast.success('Enrolled successfully!');
      router.push(`/courses/${courseId}`);
    } catch (e: any) {
      toast.error(e.message || 'Error during enrollment');
      if (e.message?.toLowerCase().includes('unauthorized') || e.message?.toLowerCase().includes('token')) {
        router.push('/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 w-full">
      {/* Hero Section */}
      {!isLoggedIn && (
        <div className="bg-gradient-to-b from-zinc-950 via-black to-zinc-900 w-full relative overflow-hidden border-b border-zinc-800">
          {/* Decorative background blur shapes */}
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-zinc-700/10 rounded-full blur-[140px] pointer-events-none" />

          <header className="absolute top-0 w-full flex justify-between items-center px-6 md:px-12 py-6 z-20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                <GraduationCap className="text-white h-6 w-6" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">LearnStack</span>
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white hover:text-black font-bold rounded-xl px-4 transition-all">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-zinc-200 font-extrabold rounded-xl px-5 transition-all shadow-md">
                  Sign up
                </Button>
              </Link>
            </div>
          </header>
          
          <div className="container mx-auto px-6 pt-36 pb-28 relative z-10 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-800/80 border border-zinc-700 text-zinc-300 mb-6 backdrop-blur-md">
              🚀 Welcome to LearnStack 2.0
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-none">
              Elevate Your Career <br className="hidden md:block" /> with LearnStack
            </h1>
            <p className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium mb-10 leading-relaxed">
              Master the most in-demand skills through world-class courses designed by industry experts.
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-white hover:bg-zinc-200 text-black font-extrabold rounded-xl px-8 py-6 transition-all hover:scale-[1.02] active:scale-100 shadow-xl shadow-white/5 flex items-center gap-2" 
                onClick={() => {
                  document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Browse Courses <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Courses Section */}
      <div id="courses-section" className={`container mx-auto px-4 md:px-8 max-w-5xl ${isLoggedIn ? 'pt-16' : 'mt-16'}`}>
        <div className="mb-10 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white rounded-xl">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Course Catalog</h2>
          </div>
          <span className="text-sm font-semibold text-zinc-500">
            Showing {courses.length} course{courses.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-col gap-6">
          {courses.length === 0 && (
            <div className="p-20 text-center bg-white rounded-2xl border border-zinc-150 shadow-sm">
              <PlayCircle className="mx-auto h-16 w-16 text-zinc-300 mb-4" />
              <p className="text-2xl font-extrabold text-zinc-700 mb-2">No courses available yet.</p>
              <p className="text-zinc-500">Please check back soon.</p>
            </div>
          )}
          
          {courses.map(c => {
            const isEnrolled = enrolledCourseIds.includes(Number(c.id));
            const lessonsCount = c.lessons ? (typeof c.lessons === 'string' ? JSON.parse(c.lessons).length : c.lessons.length) : 0;
            return (
              <div 
                key={c.id} 
                className="group relative bg-white border border-gray-150 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row overflow-hidden w-full md:h-56"
              >
                {/* Thumbnail / Image Container */}
                <div className="md:w-56 h-48 md:h-full flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-zinc-900 to-black">
                  {c.thumbnail ? (
                    <img 
                      src={c.thumbnail} 
                      alt={c.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-2 p-6">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/15 shadow-inner">
                        <BookOpen size={28} className="text-white/70" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">LMS Course</span>
                    </div>
                  )}
                  {/* Floating Lesson Badge */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm flex items-center gap-1.5">
                    <BookOpen size={13} className="text-black" />
                    <span className="text-[11px] font-extrabold text-black">{lessonsCount} Lesson{lessonsCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Course Info */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-hidden md:h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md">
                        Self-Paced
                      </span>
                      {isEnrolled && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200/50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Enrolled
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 mb-1.5 leading-snug group-hover:text-black transition-colors line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">
                      {c.short_description}
                    </p>
                  </div>

                  {/* Instructor detail */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-zinc-100">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-extrabold uppercase text-xs shadow-md border-2 border-white">
                      {(c.instructor_name || 'I')[0]}
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none mb-1">Instructor</p>
                      <p className="text-sm font-extrabold text-zinc-850 leading-none">
                        {c.instructor_name || `Instructor #${c.instructor_id}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Actions Sidebar */}
                <div className="bg-zinc-50/50 p-6 md:w-60 border-t md:border-t-0 md:border-l border-zinc-100 flex flex-col justify-center items-center gap-3 shrink-0 md:h-full">
                  {role === 'SUPER_ADMIN' || (role === 'INSTRUCTOR' && Number(c.instructor_id) === userId) ? (
                    <Button 
                      className="w-full py-6 rounded-xl text-sm font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all hover:scale-[1.02] active:scale-100" 
                      onClick={() => router.push(`/courses/${c.id}`)}
                    >
                      Manage Course
                    </Button>
                  ) : isEnrolled ? (
                    <Button 
                      className="w-full py-6 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-750 text-white shadow-md transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2" 
                      onClick={() => router.push(`/courses/${c.id}`)}
                    >
                      <PlayCircle className="h-5 w-5" /> Continue Study
                    </Button>
                  ) : (
                    <Button 
                      className="w-full py-6 rounded-xl text-sm font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-1.5" 
                      onClick={() => handleEnroll(c.id)}
                    >
                      Enroll Now <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest mt-1">Full Lifetime Access</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
