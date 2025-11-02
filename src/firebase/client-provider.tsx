// src/firebase/client-provider.tsx
'use client';

import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseApp, firestore, auth } = initializeFirebase();

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
