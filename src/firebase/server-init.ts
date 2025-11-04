
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

let firestore: ReturnType<typeof getFirestore> | null = null;

/**
 * Initializes the Firebase app on the server-side if it hasn't been already.
 * This ensures that server-side flows can access Firebase services.
 * It's designed to be safely called multiple times.
 *
 * @returns The initialized Firestore instance.
 */
export function initializeFirebaseOnServer() {
  if (firestore) {
    return firestore;
  }

  let firebaseApp: FirebaseApp;
  if (!getApps().length) {
    // When running locally or in a non-Firebase server environment,
    // we use the explicit config.
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    // In a Firebase environment (like Cloud Functions or App Hosting),
    // getApp() can be used if initialized by the environment.
    firebaseApp = getApp();
  }

  firestore = getFirestore(firebaseApp);
  return firestore;
}
