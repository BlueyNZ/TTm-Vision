
import { initializeApp, getApps, getApp, FirebaseApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import * as admin from 'firebase-admin';

let app: App | null = null;

/**
 * Initializes the Firebase app on the server-side if it hasn't been already.
 * This ensures that server-side flows can access Firebase services.
 * It's designed to be safely called multiple times.
 *
 * @returns The initialized Firebase Admin App instance.
 */
export function initializeFirebaseOnServer(): App {
  if (app) {
    return app;
  }

  if (admin.apps.length > 0) {
      app = admin.app();
      return app;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    // Production / Deployed environment with explicit service account
     app = initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId
    });
  } else {
    // Local development - using default application credentials
    console.log("Initializing Firebase Admin SDK with default credentials for local development.");
    app = initializeApp({
      projectId: firebaseConfig.projectId
    });
  }

  return app;
}
