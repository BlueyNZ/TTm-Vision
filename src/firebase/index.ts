
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

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
  const firestore = getFirestore(firebaseApp);
  
  // Enable offline persistence for Firestore
  if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(firestore).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore: Multiple tabs open, persistence only enabled in one tab.');
      } else if (err.code === 'unimplemented') {
        // The current browser doesn't support persistence.
        console.warn('Firestore: Persistence not supported in this browser.');
      }
    });
  }
  
  // This function now ONLY initializes and returns the services.
  // Persistence is handled in the FirebaseClientProvider.
  return {
    firebaseApp,
    auth,
    firestore
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
