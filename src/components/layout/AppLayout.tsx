'use client';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useUser } from '../providers/user-provider';
import { Loader2 } from 'lucide-react';

function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isInitialized } = useUser();

  const isAuthPage = useMemo(() => {
    return pathname === '/login' || pathname === '/signup' || pathname === '/new-login';
  }, [pathname]);

  useEffect(() => {
    // Wait until the user's auth state is initialized.
    if (!isInitialized) return;

    // If there is no user and the current page is not a public auth page, redirect to login.
    if (!user && !isAuthPage) {
      router.replace('/new-login');
    }
  }, [user, isInitialized, pathname, router, isAuthPage]);


  if (isAuthPage) {
    return <main>{children}</main>;
  }

  // If we are still initializing or the user is not available on a protected route, show a loading screen.
  if (!isInitialized || !user) {
    return (
       <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <div className="flex flex-col flex-1">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8 no-scrollbar">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
