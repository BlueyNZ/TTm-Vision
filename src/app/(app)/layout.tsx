
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
