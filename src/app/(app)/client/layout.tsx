
'use client';
import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Staff } from "@/lib/data";
import { collection, query, where } from "firebase/firestore";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
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

  const isAuthorized = accessLevel === 'Client' || accessLevel === 'Admin';

  const handleLogout = async () => {
      if (!auth) return;
      try {
          await signOut(auth);
          toast({
              title: "Logged Out",
              description: "You have been successfully logged out.",
          });
          router.push('/client-login');
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Logout Failed",
              description: "Something went wrong. Please try again.",
          });
      }
  };

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
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
                <h1 className="text-lg font-semibold md:text-2xl">Client Portal</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 bg-muted/40">
              {children}
            </main>
        </div>
    </ThemeProvider>
  );
}
