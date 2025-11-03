
'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { LoaderCircle } from "lucide-react";
import { Staff } from "@/lib/data";
import { collection, query, where } from "firebase/firestore";
import { ThemeProvider } from "@/components/theme-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // Find the staff profile for the current user
  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.displayName) return null;
    return query(collection(firestore, 'staff'), where('name', '==', user.displayName));
  }, [firestore, user?.displayName]);

  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);

  const currentUserStaffProfile = useMemo(() => staffData?.[0], [staffData]);
  const accessLevel = currentUserStaffProfile?.accessLevel;
  
  const isAdmin = accessLevel === 'Admin';


  const isLoading = isUserLoading || isStaffLoading;

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // This is the error recovery logic.
    const handleChunkError = (event: Event) => {
      // The event for a chunk loading error is not a standard 'error' event
      // but we can listen for any error and check the message.
      if (event.type === 'error') {
        const error = (event as ErrorEvent).error;
        // This is a common pattern for chunk load errors.
        if (error && (error.name === 'ChunkLoadError' || /Loading chunk .* failed/i.test(error.message))) {
          console.warn('Chunk loading failed. Forcing a page refresh to get the latest version.');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);

    // This is a Next.js specific way to catch navigation-related errors
    const originalPush = router.push;
    const originalReplace = router.replace;

    const handleError = (err: any, url: string) => {
      if (err.name === 'ChunkLoadError' || /Loading chunk .* failed/i.test(err.message)) {
        console.warn(`Chunk load failed for route: ${url}. Refreshing...`);
        window.location.href = url; // Force a full navigation
        return false; // Prevent Next.js from continuing
      }
      return true;
    }

    router.push = (href: string, options?: any) => {
      // @ts-ignore
      return originalPush(href, options).catch((err: any) => {
        if (!handleError(err, href)) throw err;
      });
    }

     router.replace = (href: string, options?: any) => {
      // @ts-ignore
      return originalReplace(href, options).catch((err: any) => {
        if (!handleError(err, href)) throw err;
      });
    }


    return () => {
      window.removeEventListener('error', handleChunkError);
       // Restore original router methods
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
    >
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar isAdmin={isAdmin} />
          <div className="flex flex-1 flex-col">
            <AppHeader isAdmin={isAdmin} />
            <main className="flex-1 p-4 sm:p-6 bg-background">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
