
'use server';

import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

/**
 * Initializes and returns the Firebase Admin App instance for server-side operations.
 * It ensures the app is initialized only once (singleton pattern).
 *
 * @returns The initialized Firebase Admin App instance.
 */
export function initializeFirebaseOnServer(): App {
  // If the app is already initialized, return the existing instance.
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  // Parse the service account from environment variables.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  // Initialize the app with the appropriate credentials.
  const app = initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined, // Use service account if available
    projectId: firebaseConfig.projectId,
    // The storage bucket needs to be explicitly provided for the Admin SDK.
    storageBucket: firebaseConfig.storageBucket,
  });

  return app;
}
