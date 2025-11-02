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

  const firebaseServices = useMemo(() => {
    // Initialize Firebase services, but don't set persistence here yet.
    return initializeFirebase();
  }, []);

  useEffect(() => {
    const setupPersistence = async (auth: Auth) => {
      try {
        const keepLoggedIn = localStorage.getItem('keepLoggedIn');
        const persistence = keepLoggedIn === 'true' ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
      } catch (error) {
        console.error("Failed to set auth persistence:", error);
      } finally {
        setServicesReady(true);
      }
    };

    if (firebaseServices.auth) {
      setupPersistence(firebaseServices.auth);
    }
  }, [firebaseServices.auth]);

  // Don't render children until persistence has been set.
  if (!servicesReady) {
    // You can render a loading spinner here if desired
    return null;
  }

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
