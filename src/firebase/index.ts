
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  let firebaseApp;
  if (!getApps().length) {
    try {
      // In a Firebase Hosting environment, this will be automatically configured.
      firebaseApp = initializeApp();
    } catch (e) {
      // In a local environment, it will fall back to using the explicit config object.
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    // If apps are already initialized, get the default app.
    firebaseApp = getApp();
  }

  const auth = getAuth(firebaseApp);
  
  // This function now ONLY initializes and returns the services.
  // Persistence is handled in the FirebaseClientProvider.
  return {
    firebaseApp,
    auth,
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
