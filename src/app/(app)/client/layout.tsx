'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/layout/client-sidebar";
import { ClientHeader } from "@/components/layout/client-header";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { LoaderCircle } from "lucide-react";
import { Staff } from "@/lib/data";
import { collection, query, where } from "firebase/firestore";
import { ThemeProvider } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'staff'), where('email', '==', user.email));
  }, [firestore, user?.email]);

  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
  const currentUserStaffProfile = useMemo(() => staffData?.[0], [staffData]);
  const accessLevel = currentUserStaffProfile?.accessLevel;
  const isLoading = isUserLoading || isStaffLoading;

  const isAdmin = accessLevel === 'Admin';
  const isAuthorized = isAdmin || accessLevel === 'Client';

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/client-login');
    }
    if (!isLoading && user && accessLevel && !isAuthorized) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You are not authorized to view the client portal.",
      });
      router.replace('/dashboard');
    }
  }, [user, isLoading, router, accessLevel, toast, isAuthorized]);

  if (isLoading || !user || !isAuthorized) {
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
          <ClientSidebar />
          <div className="flex flex-1 flex-col">
            <ClientHeader isAdmin={isAdmin} />
            <main className="flex-1 p-4 sm:p-6 bg-background">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
