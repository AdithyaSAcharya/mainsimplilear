"use client"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { BookOpen, LayoutDashboard, LogOut, GraduationCap, LogIn, UserPlus, Users, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

function AppSidebarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const { setOpenMobile } = useSidebar()

  const view = searchParams.get("view") || "overview"

  useEffect(() => {
    setRole(localStorage.getItem("role")?.toUpperCase() || null)
    setUserName(localStorage.getItem("userName") || '')
  }, [pathname])

  if (pathname === "/login" || pathname === "/register") return null

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("userId")
    localStorage.removeItem("userName")
    setRole(null)
    setUserName('')
    router.push("/login")
    setOpenMobile(false)
  }

  const closeMobile = () => setOpenMobile(false)

  return (
    <Sidebar className="bg-white border-r border-gray-200">
      <SidebarHeader className="p-4 border-b border-gray-100 flex flex-row items-center gap-2">
        <div className="bg-black p-2 rounded-md">
          <GraduationCap size={24} className="text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-black tracking-tight">LearnStack</span>
          {userName && <span className="text-sm font-semibold text-gray-800 leading-tight">{userName}</span>}
          {role && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{role.replace('_', ' ')}</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-black font-semibold">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === '/'} onClick={closeMobile} render={<Link href="/" />}>
                  <BookOpen />
                  <span>Course Catalog</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {role === 'STUDENT' && (
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={pathname === '/dashboard'} onClick={closeMobile} render={<Link href="/dashboard" />}>
                    <LayoutDashboard />
                    <span>My Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {role === 'INSTRUCTOR' && (
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={pathname === '/dashboard'} onClick={closeMobile} render={<Link href="/dashboard" />}>
                    <LayoutDashboard />
                    <span>Instructor Panel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === 'SUPER_ADMIN' && pathname === '/dashboard' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-black font-semibold">Admin Controls</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={view === 'overview'} onClick={closeMobile} render={<Link href="/dashboard?view=overview" />}>
                    <LayoutDashboard />
                    <span>Platform Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={view === 'students'} onClick={closeMobile} render={<Link href="/dashboard?view=students" />}>
                    <Users />
                    <span>Manage Students</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={view === 'instructors'} onClick={closeMobile} render={<Link href="/dashboard?view=instructors" />}>
                    <GraduationCap />
                    <span>Manage Instructors</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={view === 'add_instructor'} onClick={closeMobile} render={<Link href="/dashboard?view=add_instructor" />}>
                    <UserPlus />
                    <span>Provision Instructor</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {role === 'SUPER_ADMIN' && pathname !== '/dashboard' && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={closeMobile} render={<Link href="/dashboard?view=overview" />}>
                    <Settings />
                    <span>Admin Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-100">
        {role ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="bg-black text-white hover:bg-gray-800 hover:text-white mb-2 py-5" onClick={closeMobile} render={<Link href="/login" />}>
                <div className="flex items-center justify-center gap-2 w-full font-bold">
                  <LogIn />
                  <span>Login</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="border border-black hover:bg-gray-100 py-5" onClick={closeMobile} render={<Link href="/register" />}>
                <div className="flex items-center justify-center gap-2 w-full font-bold">
                  <UserPlus />
                  <span>Sign Up</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppSidebar() {
  return (
    <Suspense fallback={<div className="w-64 bg-white border-r min-h-screen"></div>}>
      <AppSidebarContent />
    </Suspense>
  )
}
