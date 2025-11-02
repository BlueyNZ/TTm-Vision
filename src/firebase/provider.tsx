'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, getDocs, limit, query, addDoc, Timestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { jobData } from '@/lib/data';
import type { Job, Staff } from '@/lib/data';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        if (!firebaseUser) {
          // If no user, sign in anonymously
          signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed:", error);
             setUserAuthState({ user: null, isUserLoading: false, userError: error });
          })
        } else {
          // Here we can set a display name for the mock user
          const userWithDisplayName = {
            ...firebaseUser,
            displayName: "Harrison Price"
          }
          setUserAuthState({ user: userWithDisplayName, isUserLoading: false, userError: null });
        }
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]);

  // Effect to seed initial data
  useEffect(() => {
    const seedInitialData = async () => {
      if (!firestore) return;
      
      // Seed Staff
      const staffCollectionRef = collection(firestore, 'staff');
      const staffQuery = query(staffCollectionRef, limit(1));
      const staffSnapshot = await getDocs(staffQuery);

      if (staffSnapshot.empty) {
        const initialStaff: Omit<Staff, 'id'>[] = [
          { name: 'Harrison Price', role: 'STMS', accessLevel: 'Admin', emergencyContact: { name: 'Jane Price', phone: '021-987-6543' }, certifications: [{ name: 'STMS (CAT A)', expiryDate: new Date('2025-08-15T00:00:00Z') }, { name: 'TMO', expiryDate: new Date('2026-01-20T00:00:00Z') }] },
          { name: 'Ben Carter', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Sarah Carter', phone: '022-111-2222' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2025-11-30T00:00:00Z') }] },
          { name: 'Chloe Williams', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Mike Williams', phone: '027-333-4444' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2026-02-10T00:00:00Z') }] },
          { name: 'Jack Taylor', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Emily Taylor', phone: '021-555-6666' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2025-09-05T00:00:00Z') }] },
          { name: 'Liam Wilson', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Grace Wilson', phone: '021-123-1234' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2026-05-20T00:00:00Z') }] },
          { name: 'Olivia Brown', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'David Brown', phone: '021-456-4567' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2025-12-15T00:00:00Z') }] },
          { name: 'Noah Jones', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Sophie Jones', phone: '021-789-7890' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2026-08-01T00:00:00Z') }] },
          { name: 'Ava Smith', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Peter Smith', phone: '021-111-2222' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2026-03-10T00:00:00Z') }] },
          { name: 'Lucas Miller', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Mia Miller', phone: '021-222-3333' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2025-10-25T00:00:00Z') }] },
          { name: 'Isla Garcia', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Leo Garcia', phone: '021-333-4444' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2026-07-18T00:00:00Z') }] },
        ];
        const addedDocs = [];
        for (const staff of initialStaff) { 
           const docRef = await addDoc(staffCollectionRef, staff);
           addedDocs.push({ ...staff, id: docRef.id });
        }
         // Seed Jobs with correct staff IDs
        const jobsCollectionRef = collection(firestore, 'job_packs');
        for (const job of jobData) {
            const stms = addedDocs.find(s => s.name === job.stms);
            const tcs = job.tcs.map(jobTc => {
                const tc = addedDocs.find(s => s.name === jobTc.name);
                return { id: tc?.id || '', name: jobTc.name };
            }).filter(tc => tc.id);

            const docToAdd: Omit<Job, 'id'> = {
                ...job,
                stmsId: stms?.id || null,
                tcs: tcs,
                startDate: Timestamp.fromDate(new Date(job.startDate)),
            };
            await addDoc(jobsCollectionRef, docToAdd);
        }
      } else {
        // If staff data exists, check if jobs exist
         const jobsCollectionRef = collection(firestore, 'job_packs');
        const jobsQuery = query(jobsCollectionRef, limit(1));
        const jobsSnapshot = await getDocs(jobsQuery);

        if (jobsSnapshot.empty) {
            const staffSnapshot = await getDocs(staffCollectionRef);
            const staffWithIds = staffSnapshot.docs.map(doc => ({ ...doc.data() as Staff, id: doc.id }));
            
            for (const job of jobData) {
                const stms = staffWithIds.find(s => s.name === job.stms);
                const tcs = job.tcs.map(jobTc => {
                    const tc = staffWithIds.find(s => s.name === jobTc.name);
                    return { id: tc?.id || '', name: jobTc.name };
                }).filter(tc => tc.id);

                const docToAdd: Omit<Job, 'id'> = {
                    ...job,
                    stmsId: stms?.id || null,
                    tcs: tcs,
                    startDate: Timestamp.fromDate(new Date(job.startDate)),
                };
                await addDoc(jobsCollectionRef, docToAdd);
            }
        }
      }
    };
    
    if(firestore) {
      seedInitialData();
    }

  }, [firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
