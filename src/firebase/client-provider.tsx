
'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { setPersistence, browserLocalPersistence, browserSessionPersistence, Auth } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [servicesReady, setServicesReady] = useState(false);

  // Memoize the core Firebase services so they are initialized only once.
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  // This effect handles setting the correct auth persistence.
  useEffect(() => {
    // This function will run only once when the component mounts.
    const setupPersistence = async (auth: Auth) => {
      try {
        // Check localStorage for the user's preference.
        const keepLoggedIn = localStorage.getItem('keepLoggedIn');
        
        // Determine the desired persistence level. Default to session if not specified.
        const persistence = keepLoggedIn === 'true' 
          ? browserLocalPersistence 
          : browserSessionPersistence;
        
        // Asynchronously set the persistence on the auth object.
        await setPersistence(auth, persistence);
      } catch (error) {
        // Log an error if persistence fails, but don't block the app.
        console.error("FirebaseClientProvider: Failed to set auth persistence:", error);
      } finally {
        // Once persistence is set (or has failed), mark the services as ready.
        // This unblocks the rendering of the rest of the application.
        setServicesReady(true);
      }
    };

    // Only run the setup if the auth service has been initialized.
    if (firebaseServices.auth) {
      setupPersistence(firebaseServices.auth);
    } else {
      // If auth service is not available for some reason, we can't proceed.
      // We'll mark services as ready to not block the app, but auth will likely fail.
      setServicesReady(true);
    }
  }, [firebaseServices.auth]); // This effect depends only on the auth service instance.

  // Render nothing until persistence has been configured.
  // This is the crucial step that prevents race conditions.
  if (!servicesReady) {
    // You could render a global loading spinner here, but returning null is fine.
    return null;
  }

  // Once services are ready, provide them to the rest of the application.
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
