'use client';

import { AppShell } from '@/components/layout/app-shell';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  // While loading, show a simplified skeleton layout
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full">
        <aside className="hidden md:flex flex-col w-64 border-r bg-card p-6">
          <Skeleton className="h-8 w-3/4 mb-10" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Skeleton className="h-full w-full" />
        </main>
      </div>
    );
  }
  
  // Only render the full shell and children if a user is present
  if (user) {
    return <AppShell>{children}</AppShell>;
  }

  // Render nothing while redirecting
  return null;
}
