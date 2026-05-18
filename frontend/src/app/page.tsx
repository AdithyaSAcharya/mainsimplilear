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
  const router = useRouter();

  useEffect(() => {
    fetchApi('/courses').then(res => setCourses(res.courses)).catch(console.error);
    
    const currentRole = (localStorage.getItem('role') || '').toUpperCase();
    setRole(currentRole);

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
    <div className="min-h-screen bg-gray-50 pb-24 w-full">
      {/* Hero Section */}
      {!isLoggedIn && (
        <div className="bg-black w-full relative overflow-hidden border-b border-gray-800">
          <header className="absolute top-0 w-full flex justify-between items-center px-6 md:px-12 py-6 z-20">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-white h-7 w-7" />
              <span className="text-xl font-bold text-white tracking-tight">LearnStack</span>
            </div>
            <div className="flex gap-4">
              <Link href="/login"><Button variant="ghost" className="text-white hover:bg-white hover:text-black font-semibold">Log in</Button></Link>
              <Link href="/register"><Button className="bg-white text-black hover:bg-gray-200 font-bold">Sign up</Button></Link>
            </div>
          </header>
          <div className="container mx-auto px-6 pt-32 pb-24 relative z-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Elevate Your Career <br className="hidden md:block" /> with LearnStack
            </h1>
            <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto font-medium mb-8 leading-relaxed">
              Master the most in-demand skills through world-class courses designed by industry experts.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-white hover:bg-gray-200 text-black font-semibold px-6 py-4" onClick={() => {
                document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Browse Courses <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Courses Section */}
      <div id="courses-section" className={`container mx-auto px-4 md:px-8 max-w-5xl ${isLoggedIn ? 'pt-16' : 'mt-16'}`}>
        <div className="mb-8 flex items-center gap-2">
          <BookOpen className="text-black h-6 w-6" />
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Course Catalog</h2>
        </div>

        <div className="flex flex-col gap-6">
          {courses.length === 0 && (
            <div className="p-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-sm">
              <PlayCircle className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-2xl font-bold text-gray-700 mb-2">No courses available yet.</p>
              <p className="text-gray-500">Please check back soon.</p>
            </div>
          )}
          
          {courses.map(c => {
            const isEnrolled = enrolledCourseIds.includes(Number(c.id));
            const lessonsCount = c.lessons ? (typeof c.lessons === 'string' ? JSON.parse(c.lessons).length : c.lessons.length) : 0;
            
            return (
              <Card key={c.id} className="border shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden flex flex-col md:flex-row bg-white w-full">
                {/* Thumbnail */}
                <div className="md:w-48 h-40 md:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <BookOpen size={40} />
                    </div>
                  )}
                </div>

                <CardContent className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{c.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{c.short_description}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-black font-bold uppercase text-sm">
                      {(c.instructor_name || 'I')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.instructor_name || `Instructor #${c.instructor_id}`}</p>
                      <p className="text-xs text-gray-500">{lessonsCount} Lesson{lessonsCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </CardContent>
                
                <div className="bg-gray-50/50 p-6 md:w-56 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center items-center gap-4 shrink-0">
                  {role === 'INSTRUCTOR' || role === 'SUPER_ADMIN' ? (
                    <Button className="w-full py-4 text-sm font-semibold bg-black hover:bg-gray-800 text-white shadow-sm" onClick={() => router.push(`/courses/${c.id}`)}>
                      View Course
                    </Button>
                  ) : isEnrolled ? (
                    <Button className="w-full py-4 text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200" onClick={() => router.push(`/courses/${c.id}`)}>
                      <PlayCircle className="mr-2 h-4 w-4" /> Continue
                    </Button>
                  ) : (
                    <Button className="w-full py-4 text-sm font-semibold bg-black hover:bg-gray-800 text-white shadow-sm" onClick={() => handleEnroll(c.id)}>
                      Enroll Now
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
