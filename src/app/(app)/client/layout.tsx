
'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/layout/client-sidebar";
import { ClientHeader } from "@/components/layout/client-header";
import { Footer } from "@/components/layout/footer";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useUser, useFirestore } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Staff } from "@/lib/data";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ThemeProvider } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [accessLevel, setAccessLevel] = useState<Staff['accessLevel'] | null>(null);
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

        // An Admin can see everything, always.
        if (userAccessLevel === 'Admin') {
            setIsAuthCheckLoading(false);
            return;
        }

        const isAuthorizedForPortal = userAccessLevel === 'Client' || userAccessLevel === 'Client Staff';

        if (!isAuthorizedForPortal) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You are not authorized to view the client portal.",
          });
          router.replace('/dashboard');
          return;
        }
        
        // If the user's access level is "Client Staff", they can only access the dashboard.
        if (userAccessLevel === 'Client Staff' && pathname !== '/client/dashboard') {
           toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have permission to view this page.",
          });
          router.replace('/client/dashboard');
          return;
        }

      } else {
        toast({ variant: "destructive", title: "Access Denied", description: "No profile found for your account." });
        router.replace('/dashboard');
      }
      setIsAuthCheckLoading(false);
    };

    checkUserAccess();

  }, [user, isUserLoading, firestore, router, toast, pathname]);

  const isLoading = isUserLoading || isAuthCheckLoading;
  const isAuthorized = accessLevel === 'Admin' || accessLevel === 'Client' || accessLevel === 'Client Staff';
  const isClientAdmin = accessLevel === 'Client' || accessLevel === 'Admin';

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <ClientSidebar isClientAdmin={isClientAdmin} />
        <div className="flex flex-1 flex-col">
          <ClientHeader isAdmin={accessLevel === 'Admin'} />
          <main className="flex-1 p-4 sm:p-6 bg-background">
            {children}
          </main>
          <Footer />
        </div>
      </div>
      </SidebarProvider>
    </>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
