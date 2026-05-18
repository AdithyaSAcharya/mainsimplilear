"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from 'react';

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === '/') return null;

  const paths = pathname.split('/').filter((path) => path);

  return (
    <div className="px-6 py-4 border-b bg-gray-50/50">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          </BreadcrumbItem>
          {paths.length > 0 && <BreadcrumbSeparator />}
          {paths.map((path, index) => {
            let href = `/${paths.slice(0, index + 1).join('/')}`;
            if (href === '/courses') href = '/dashboard';
            
            const isLast = index === paths.length - 1;
            // Decode URI component and format nice titles
            let title = decodeURIComponent(path).replace(/-/g, ' ');
            title = title.charAt(0).toUpperCase() + title.slice(1);

            return (
              <React.Fragment key={path}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-semibold text-gray-900">{title}</BreadcrumbPage>
                  ) : (
                    <Link href={href} className="transition-colors hover:text-foreground">{title}</Link>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
