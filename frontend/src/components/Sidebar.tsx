"use client";
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { BookOpen, LayoutDashboard, LogOut, GraduationCap, LogIn, UserPlus, Users, Settings } from 'lucide-react';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  const view = searchParams.get('view') || 'overview';

  useEffect(() => {
    setRole(localStorage.getItem('role')?.toUpperCase() || null);
  }, [pathname]);

  if (pathname === '/login' || pathname === '/register') return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setRole(null);
    router.push('/login');
  };

  return (
    <div className="w-72 bg-[#0b1120] text-gray-300 flex flex-col min-h-screen shadow-2xl sticky top-0 h-screen border-r border-gray-800/50">
      <div className="p-6 pb-4 border-b border-gray-800/50 flex flex-col items-center gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-3 rounded-2xl shadow-lg">
          <GraduationCap size={32} className="text-white" />
        </div>
        <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-wider">
          LearnStack
        </span>
        {role && <span className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-gray-900 px-3 py-1 rounded-full">{role.replace('_', ' ')}</span>}
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <Link href="/" className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${pathname === '/' ? 'bg-blue-600 shadow-md text-white' : 'hover:bg-gray-800/80 hover:text-white'}`}>
          <BookOpen size={20} /> Course Catalog
        </Link>

        {role === 'STUDENT' && (
          <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${pathname === '/dashboard' ? 'bg-blue-600 shadow-md text-white' : 'hover:bg-gray-800/80 hover:text-white'}`}>
            <LayoutDashboard size={20} /> My Dashboard
          </Link>
        )}

        {role === 'INSTRUCTOR' && (
          <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${pathname === '/dashboard' ? 'bg-indigo-600 shadow-md text-white' : 'hover:bg-gray-800/80 hover:text-white'}`}>
            <LayoutDashboard size={20} /> Instructor Panel
          </Link>
        )}

        {role === 'SUPER_ADMIN' && pathname === '/dashboard' && (
          <div className="pt-4 pb-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-3">Admin Controls</div>
            <div className="space-y-1.5">
              <Link href="/dashboard?view=overview" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-800/80 hover:text-white'}`}>
                <LayoutDashboard size={18} /> Platform Overview
              </Link>
              <Link href="/dashboard?view=students" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'students' ? 'bg-cyan-600 text-white shadow-md' : 'hover:bg-gray-800/80 hover:text-white'}`}>
                <Users size={18} /> Manage Students
              </Link>
              <Link href="/dashboard?view=instructors" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'instructors' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-800/80 hover:text-white'}`}>
                <GraduationCap size={18} /> Manage Instructors
              </Link>
              <Link href="/dashboard?view=add_instructor" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'add_instructor' ? 'bg-gray-700 text-white shadow-md' : 'hover:bg-gray-800/80 hover:text-white'}`}>
                <UserPlus size={18} /> Provision Instructor
              </Link>
            </div>
          </div>
        )}

        {role === 'SUPER_ADMIN' && pathname !== '/dashboard' && (
          <Link href="/dashboard?view=overview" className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${pathname === '/dashboard' ? 'bg-blue-600 shadow-md text-white' : 'hover:bg-gray-800/80 hover:text-white'}`}>
            <Settings size={20} /> Admin Dashboard
          </Link>
        )}
      </nav>
      <div className="p-5 border-t border-gray-800/50 space-y-3">
        {role ? (
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-3.5 w-full rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors font-medium border border-transparent hover:border-red-500/20 shadow-sm">
            <LogOut size={18} /> Logout
          </button>
        ) : (
          <>
            <Link href="/login" className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 text-white font-medium">
              <LogIn size={18} /> Login
            </Link>
            <Link href="/register" className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors text-white font-medium border border-gray-700">
              <UserPlus size={18} /> Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="w-72 bg-[#0b1120] min-h-screen"></div>}>
      <SidebarContent />
    </Suspense>
  );
}
