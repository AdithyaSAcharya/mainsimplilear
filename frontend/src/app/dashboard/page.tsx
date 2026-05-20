"use client";
import { useEffect, useState, Suspense } from 'react';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Users, GraduationCap, LayoutDashboard, UserPlus, Layers, PlayCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

function DashboardContent() {
  const [role, setRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<any[]>([]);
  const [adminData, setAdminData] = useState<any>(null);

  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'overview';

  // Instructor Forms
  const [newCourse, setNewCourse] = useState({ title: '', shortDescription: '' });
  const [showCreateCourse, setShowCreateCourse] = useState(false);

  // Admin Forms
  const [newInstructor, setNewInstructor] = useState({ fullName: '', email: '', password: '' });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);

  useEffect(() => {
    // Reset selection when view changes
    setSelectedUser(null);
    setSelectedInstructor(null);
  }, [view]);

  useEffect(() => {
    const r = (localStorage.getItem('role') || 'STUDENT').toUpperCase();
    setRole(r);
    const uName = localStorage.getItem('userName') || '';
    setUserName(uName);

    if (r === 'STUDENT') {
      fetchApi('/enrollments/user').then(res => setEnrollments(res.enrollments)).catch(console.error);
    } else if (r === 'INSTRUCTOR') {
      fetchApi('/instructors/courses').then(res => setInstructorCourses(res.courses)).catch(console.error);
    } else if (r === 'SUPER_ADMIN') {
      fetchApi('/admin/dashboard').then(res => setAdminData(res)).catch(console.error);
    }
  }, []);

  const formatRole = (r: string) => {
    if (!r) return '';
    if (r === 'SUPER_ADMIN') return 'Super Admin';
    return r.charAt(0) + r.slice(1).toLowerCase();
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      await fetchApi(`/courses/${courseId}`, { method: 'DELETE' });
      toast.success('Course deleted successfully');
      setInstructorCourses(instructorCourses.filter(c => c.id !== courseId));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const publishCourse = async (courseId: number) => {
    try {
      await fetchApi(`/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: 1 })
      });
      toast.success('Course published!');
      setInstructorCourses(instructorCourses.map(c => c.id === courseId ? { ...c, is_published: 1 } : c));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/instructors', {
        method: 'POST',
        body: JSON.stringify(newInstructor)
      });
      toast.success('Instructor provisioned successfully!');
      setNewInstructor({ fullName: '', email: '', password: '' });
      fetchApi('/admin/dashboard').then(res => setAdminData(res)).catch(console.error);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="container mx-auto py-10 px-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-lg text-gray-500 mt-2">
          Welcome back{userName ? `, ${userName}` : ''} ({formatRole(role)}). Here is what is happening today.
        </p>
      </div>

      {role === 'STUDENT' && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="text-black h-5 w-5" /> My Enrollments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map(en => (
              <div
                key={en.id}
                className="group relative bg-white border border-zinc-150 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
              >
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider ${en.completion_status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200/50' : 'bg-zinc-100 text-zinc-700'}`}>
                        {en.completion_status === 'completed' ? (
                          <><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Completed</>
                        ) : (
                          <><span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span> In Progress</>
                        )}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 group-hover:text-black transition-colors mb-2 leading-snug">
                      {en.course_title}
                    </h3>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3">
                      {en.course_short_description}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50/50 p-5 border-t border-zinc-100 flex flex-col gap-2">
                  <Link href={`/courses/${en.course_id}`} className="w-full">
                    <Button className="w-full py-5 rounded-xl font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2">
                      <PlayCircle size={16} /> Continue Study
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {enrollments.length === 0 && (
              <div className="col-span-full p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <p className="text-gray-500 font-medium text-lg">You have not enrolled in any courses yet.</p>
                <Link href="/"><Button className="mt-4 bg-black text-white hover:bg-gray-800">Browse Courses</Button></Link>
              </div>
            )}
          </div>
        </div>
      )}

      {role === 'INSTRUCTOR' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Layers className="text-black h-5 w-5" /> My Authored Courses</h2>
            <Link href="/courses/create">
              <Button className="bg-black hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-md shadow-sm">
                + Create New Course
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructorCourses.map(c => (
              <div
                key={c.id}
                className="group relative bg-white border border-zinc-150 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="w-full h-36 bg-gradient-to-br from-zinc-900 to-black overflow-hidden flex-shrink-0 relative">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <BookOpen size={32} />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${c.is_published ? 'bg-green-500 text-white shadow-sm' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                      {c.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="text-base font-black text-zinc-900 group-hover:text-black transition-colors line-clamp-1 mb-1.5">{c.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{c.short_description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100">
                    <Link href={`/courses/${c.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full font-bold border-zinc-350 rounded-lg py-4 hover:bg-zinc-50">Manage</Button>
                    </Link>
                    {!c.is_published && (
                      <Button onClick={() => publishCourse(c.id)} size="sm" className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg py-4">Publish</Button>
                    )}
                    <Button onClick={() => handleDeleteCourse(c.id)} size="sm" variant="destructive" className="px-3 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg font-bold border-0 shadow-none">Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {role === 'SUPER_ADMIN' && adminData && (
        <>
          {view === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card className="shadow-md border-0 rounded-2xl bg-black text-white">
                  <CardHeader className="pb-2"><CardTitle className="text-gray-300 text-sm font-medium">Total Students</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold">{adminData.totalUsers}</p></CardContent>
                </Card>
                <Card className="shadow-md border-0 rounded-2xl bg-black text-white">
                  <CardHeader className="pb-2"><CardTitle className="text-gray-300 text-sm font-medium">Total Instructors</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold">{adminData.totalInstructors}</p></CardContent>
                </Card>
                <Card className="shadow-md border-0 rounded-2xl bg-black text-white">
                  <CardHeader className="pb-2"><CardTitle className="text-gray-300 text-sm font-medium">Total Courses</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold">{adminData.totalCourses}</p></CardContent>
                </Card>
              </div>

              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800"><BookOpen className="text-black h-5 w-5" /> Platform Courses Registry</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminData.courses.map((c: any) => (
                  <div
                    key={c.id}
                    className="group relative bg-white border border-zinc-150 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.is_published === 1 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {c.is_published === 1 ? 'Published' : 'Draft'}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide">ID: #{c.id}</span>
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 group-hover:text-black transition-colors mb-2 leading-snug line-clamp-1">{c.title}</h3>
                        <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{c.short_description}</p>
                      </div>
                    </div>
                    <div className="bg-zinc-50/50 p-5 border-t border-zinc-100">
                      <Link href={`/courses/${c.id}`}>
                        <Button variant="outline" className="w-full border-zinc-300 font-bold bg-white hover:bg-zinc-50 rounded-xl py-5 transition-all">
                          Inspect Contents
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'students' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {selectedUser ? (
                <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
                  <div className="h-1.5 w-full bg-black"></div>
                  <CardHeader className="bg-white border-b px-8 py-6 flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800">Student Profile: {selectedUser.full_name}</CardTitle>
                      <p className="text-gray-500 mt-1">{selectedUser.email}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedUser(null)}>Back to Directory</Button>
                  </CardHeader>
                  <CardContent className="p-8 bg-gray-50">
                    <h3 className="text-lg font-bold mb-4">Enrolled Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {adminData.enrollments.filter((e: any) => e.user_id === selectedUser.id).length === 0 && (
                        <p className="text-gray-500 italic">No enrollments yet.</p>
                      )}
                      {adminData.enrollments.filter((e: any) => e.user_id === selectedUser.id).map((e: any) => (
                        <Card key={e.course_id} className="shadow-sm border-0">
                          <CardContent className="p-4 flex justify-between items-center">
                            <span className="font-semibold text-gray-800">{e.course_title}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${e.completion_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {e.completion_status}
                            </span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
                  <div className="h-1.5 w-full bg-black"></div>
                  <CardHeader className="bg-white border-b px-8 py-6">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                      <Users className="text-black" size={26} /> Student Directory
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="py-4 px-6 font-semibold text-gray-600">ID</TableHead>
                            <TableHead className="py-4 px-6 font-semibold text-gray-600">Full Name</TableHead>
                            <TableHead className="py-4 px-6 font-semibold text-gray-600">Email</TableHead>
                            <TableHead className="py-4 px-6 font-semibold text-gray-600 text-center">Enrollments</TableHead>
                            <TableHead className="py-4 px-6 font-semibold text-gray-600 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminData.usersList?.map((u: any) => {
                            const enrollmentCount = adminData.enrollments.filter((e: any) => e.user_id === u.id).length;
                            return (
                              <TableRow key={u.id} className="transition-colors">
                                <TableCell className="py-4 px-6 font-medium text-gray-500">#{u.id}</TableCell>
                                <TableCell className="py-4 px-6 font-medium text-gray-900">{u.full_name}</TableCell>
                                <TableCell className="py-4 px-6 text-gray-600">{u.email}</TableCell>
                                <TableCell className="py-4 px-6 text-center">
                                  <span className="inline-flex items-center justify-center bg-gray-100 text-black font-bold px-3 py-1 rounded-full text-xs">
                                    {enrollmentCount} Course{enrollmentCount !== 1 ? 's' : ''}
                                  </span>
                                </TableCell>
                                <TableCell className="py-4 px-6 text-right">
                                  <Button size="sm" variant="ghost" className="hover:bg-gray-100 text-black font-medium" onClick={() => setSelectedUser(u)}>
                                    View Full Details
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {view === 'instructors' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {selectedInstructor ? (
                <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
                  <div className="h-1.5 w-full bg-black"></div>
                  <CardHeader className="bg-white border-b px-8 py-6 flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800">Instructor Profile: {selectedInstructor.full_name}</CardTitle>
                      <p className="text-gray-500 mt-1">{selectedInstructor.email}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedInstructor(null)}>Back to Directory</Button>
                  </CardHeader>
                  <CardContent className="p-8 bg-gray-50">
                    <h3 className="text-lg font-bold mb-4">Authored Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {adminData.instructorCoursesList.filter((c: any) => c.instructor_id === selectedInstructor.id).length === 0 && (
                        <p className="text-gray-500 italic">No courses created yet.</p>
                      )}
                      {adminData.instructorCoursesList.filter((c: any) => c.instructor_id === selectedInstructor.id).map((c: any) => (
                        <Card key={c.course_id} className="shadow-sm border-0 hover:shadow-md transition">
                          <CardContent className="p-5">
                            <span className="font-bold text-lg text-gray-900 block mb-2">{c.title}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Course ID: #{c.course_id}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
                  <div className="h-1.5 w-full bg-black"></div>
                  <CardHeader className="bg-white border-b px-8 py-6">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                      <GraduationCap className="text-black" size={26} /> Instructor Directory
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="py-4 px-6 font-semibold text-gray-600">ID</TableHead>
                            <TableHead className="py-4 px-6 font-semibold text-gray-600">Full Name</TableHead>
                            <TableHead className="py-4 px-6 font-semibold text-gray-600">Email</TableHead>
                            <TableHead className="py-4 px-6 font-semibold text-gray-600 text-center">Authored Courses</TableHead>
                            <TableHead className="py-4 px-6 font-semibold text-gray-600 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminData.instructorsList?.map((ins: any) => {
                            const courseCount = adminData.instructorCoursesList.filter((c: any) => c.instructor_id === ins.id).length;
                            return (
                              <TableRow key={ins.id} className="transition-colors">
                                <TableCell className="py-4 px-6 font-medium text-gray-500">#{ins.id}</TableCell>
                                <TableCell className="py-4 px-6 font-medium text-gray-900">{ins.full_name}</TableCell>
                                <TableCell className="py-4 px-6 text-gray-600">{ins.email}</TableCell>
                                <TableCell className="py-4 px-6 text-center">
                                  <span className="inline-flex items-center justify-center bg-gray-100 text-black font-bold px-3 py-1 rounded-full text-xs">
                                    {courseCount} Course{courseCount !== 1 ? 's' : ''}
                                  </span>
                                </TableCell>
                                <TableCell className="py-4 px-6 text-right">
                                  <Button size="sm" variant="ghost" className="hover:bg-gray-100 text-black font-medium" onClick={() => setSelectedInstructor(ins)}>
                                    View Full Details
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {view === 'add_instructor' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex justify-center mt-10">
              <Card className="w-full max-w-xl shadow-2xl border-0 rounded-2xl overflow-hidden">
                <div className="h-2 w-full bg-black"></div>
                <CardHeader className="bg-white border-b px-10 py-8">
                  <CardTitle className="text-3xl font-extrabold text-center text-gray-900 flex flex-col items-center gap-4">
                    <div className="bg-gray-100 p-4 rounded-full">
                      <UserPlus size={40} className="text-gray-800" />
                    </div>
                    Provision Instructor
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-10 py-10 bg-gray-50">
                  <form onSubmit={handleAddInstructor} className="space-y-6">
                    <div>
                      <Label className="text-gray-700 font-bold mb-2 block text-sm uppercase tracking-wide">Full Legal Name</Label>
                      <Input className="bg-white py-6 text-lg rounded-xl shadow-sm border-gray-300 focus:ring-2 focus:ring-gray-900" placeholder="e.g. John Doe" value={newInstructor.fullName} onChange={e => setNewInstructor({ ...newInstructor, fullName: e.target.value })} required />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-bold mb-2 block text-sm uppercase tracking-wide">Professional Email</Label>
                      <Input className="bg-white py-6 text-lg rounded-xl shadow-sm border-gray-300 focus:ring-2 focus:ring-gray-900" type="email" placeholder="instructor@learnstack.com" value={newInstructor.email} onChange={e => setNewInstructor({ ...newInstructor, email: e.target.value })} required />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-bold mb-2 block text-sm uppercase tracking-wide">Temporary Password</Label>
                      <Input className="bg-white py-6 text-lg rounded-xl shadow-sm border-gray-300 focus:ring-2 focus:ring-gray-900" type="password" placeholder="••••••••" value={newInstructor.password} onChange={e => setNewInstructor({ ...newInstructor, password: e.target.value })} required />
                    </div>
                    <Button type="submit" className="w-full text-lg font-bold py-6 rounded-xl bg-gray-900 hover:bg-gray-800 shadow-xl hover:shadow-2xl transition-all mt-4">
                      Create Instructor Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
