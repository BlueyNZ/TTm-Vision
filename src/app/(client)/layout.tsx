
'use client';

import { AppHeader } from "@/components/layout/header";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { LoaderCircle } from "lucide-react";
import { Staff } from "@/lib/data";
import { collection, query, where } from "firebase/firestore";
import { ThemeProvider } from "@/components/theme-provider";
import { useJsApiLoader } from "@react-google-maps/api";
import { DebugPanel } from "@/components/debug-panel";

const googleMapsLibraries = ["geocoding", "maps", "places"] as ("geocoding" | "maps" | "places")[];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: googleMapsLibraries,
  });

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'staff'), where('email', '==', user.email));
  }, [firestore, user?.email]);

  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
  const currentUserStaffProfile = useMemo(() => staffData?.[0], [staffData]);
  const isLoading = isUserLoading || isStaffLoading || !isMapsLoaded;

  // TEMP: Skip auth check for development
  // useEffect(() => {
  //   if (!isLoading && !user) {
  //     router.replace('/login');
  //   }
  // }, [user, isLoading, router]);

  // TEMP: Skip loading screen for development
  // if (isLoading || !user) {
  //   return (
  //     <div className="flex h-screen w-full items-center justify-center bg-background">
  //       <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
  //     </div>
  //   );
  // }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <OfflineIndicator />
      <div className="flex min-h-screen w-full flex-col">
        <AppHeader showSidebar={false} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 bg-background">
          {children}
        </main>
      </div>
      <DebugPanel />
    </ThemeProvider>
  );
}
