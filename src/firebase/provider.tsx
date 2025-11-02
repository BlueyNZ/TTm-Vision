// src/firebase/provider.tsx
'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

type FirebaseContextValue = {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
};

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseApp: null,
  firestore: null,
  auth: null,
});

export function FirebaseProvider({
  children,
  ...value
}: {
  children: React.ReactNode;
} & FirebaseContextValue) {
  return (
    <FirebaseContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) {
    throw new Error('Firebase app not initialized');
  }
  return firebaseApp;
}

export function useFirestore() {
  const { firestore } = useFirebase();
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }
  return firestore;
}

export function useAuth() {
  const { auth } = useFirebase();
  if (!auth) {
    throw new Error('Auth not initialized');
  }
  return auth;
}
