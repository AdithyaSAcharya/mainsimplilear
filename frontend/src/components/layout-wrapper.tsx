"use client";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";

export function LayoutWrapper({ children, modal }: { children: React.ReactNode, modal: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem('role'));
    setMounted(true);
  }, [pathname]);

  if (!mounted) {
    return (
      <div className="flex-1 w-full min-h-screen">
        {children}
        {modal}
      </div>
    );
  }

  const hideSidebar = !role && pathname === '/';

  if (hideSidebar) {
    return (
      <main className="flex-1 w-full min-h-screen">
        {children}
        {modal}
      </main>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full min-w-0">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-white px-4 md:hidden">
            <SidebarTrigger className="text-black" />
            <span className="font-bold text-black tracking-tight">LearnStack</span>
          </header>
          <main className="flex-1 w-full overflow-y-auto relative">
            <DynamicBreadcrumbs />
            {children}
            {modal}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
