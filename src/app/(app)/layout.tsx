
'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Staff } from "@/lib/data";
import { collection, query, where } from "firebase/firestore";
import { ThemeProvider } from "@/components/theme-provider";
import { useJsApiLoader } from "@react-google-maps/api";
import { DebugPanel } from "@/components/debug-panel";
import { TenantProvider } from "@/contexts/tenant-context";

const googleMapsLibraries = ["geocoding", "maps", "places"] as ("geocoding" | "maps" | "places")[];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: googleMapsLibraries,
  });

  // Check user's role from custom claims
  useEffect(() => {
    if (auth?.currentUser) {
      auth.currentUser.getIdTokenResult().then((idTokenResult) => {
        const role = idTokenResult.claims.role as string || null;
        setUserRole(role);
        setRoleChecked(true);
      });
    } else {
      setRoleChecked(true);
    }
  }, [auth?.currentUser]);

  // Redirect clients trying to access staff views
  useEffect(() => {
    if (roleChecked && userRole === 'client' && pathname && !pathname.startsWith('/client')) {
      router.replace('/client/dashboard');
    }
  }, [userRole, pathname, router, roleChecked]);

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'staff'), where('email', '==', user.email));
  }, [firestore, user?.email]);

  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
  const currentUserStaffProfile = useMemo(() => staffData?.[0], [staffData]);
  const accessLevel = currentUserStaffProfile?.accessLevel;
  const isAdmin = accessLevel === 'Admin' || accessLevel === 5 || accessLevel >= 4;
  const isLoading = isUserLoading || isStaffLoading || !isMapsLoaded || !roleChecked;

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
      <TenantProvider>
        <OfflineIndicator />
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar isAdmin={isAdmin} />
            <div className="flex flex-1 flex-col">
              <AppHeader isAdmin={isAdmin} />
              <main className="flex-1 p-3 sm:p-4 md:p-6 bg-background">
                  {children}
              </main>
            </div>
          </div>
          <DebugPanel />
        </SidebarProvider>
      </TenantProvider>
    </ThemeProvider>
  );
}
