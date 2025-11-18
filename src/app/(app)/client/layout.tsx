
'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/layout/client-sidebar";
import { ClientHeader } from "@/components/layout/client-header";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Staff, Client } from "@/lib/data";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ThemeProvider } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [accessLevel, setAccessLevel] = useState<string | null>(null);
  const [isAuthCheckLoading, setIsAuthCheckLoading] = useState(true);
  
  useEffect(() => {
    if (isUserLoading || !firestore) return;
    if (!user) {
      router.replace('/client-login');
      return;
    }
    
    const checkUserAccess = async () => {
        setIsAuthCheckLoading(true);
        const staffQuery = query(collection(firestore, 'staff'), where('email', '==', user.email));
        const staffSnapshot = await getDocs(staffQuery);

        if (!staffSnapshot.empty) {
          const userProfile = staffSnapshot.docs[0].data() as Staff;
          const userAccessLevel = userProfile.accessLevel;
          setAccessLevel(userAccessLevel);

          const isAuthorized = userAccessLevel === 'Admin' || userAccessLevel === 'Client' || userAccessLevel === 'Client Staff';

          if (!isAuthorized) {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You are not authorized to view the client portal.",
            });
            router.replace('/dashboard');
          }
        } else {
            // No staff profile found, deny access
            toast({ variant: "destructive", title: "Access Denied", description: "No profile found for your account." });
            router.replace('/dashboard');
        }
        setIsAuthCheckLoading(false);
    };

    checkUserAccess();

  }, [user, isUserLoading, firestore, router, toast]);

  const isLoading = isUserLoading || isAuthCheckLoading;
  const isAuthorized = accessLevel === 'Admin' || accessLevel === 'Client' || accessLevel === 'Client Staff';

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ClientSidebar />
        <div className="flex flex-1 flex-col">
          <ClientHeader isAdmin={accessLevel === 'Admin'} />
          <main className="flex-1 p-4 sm:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The ThemeProvider should wrap everything, including the loading state.
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppContent>{children}</AppContent>
    </ThemeProvider>
  );
}

    