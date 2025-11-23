
import { initializeApp, getApps, App } from 'firebase-admin/app';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

/**
 * Initializes and returns the Firebase Admin App instance for server-side operations.
 * It ensures the app is initialized only once (singleton pattern).
 *
 * In a secure server environment (like Google Cloud), initializing without explicit
 * credentials allows the SDK to use Application Default Credentials.
 *
 * @returns The initialized Firebase Admin App instance.
 */
export async function initializeFirebaseOnServer(): Promise<App> {
  // If the app is already initialized, return the existing instance.
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  // Initialize the app without explicit credentials.
  // This allows it to automatically use the environment's Application Default Credentials.
  const app = initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });

  return app;
}
