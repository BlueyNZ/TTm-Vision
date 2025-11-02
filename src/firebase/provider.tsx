
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, getDocs, limit, query, addDoc, Timestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { jobData } from '@/lib/data';
import type { Job, Staff, Truck } from '@/lib/data';

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

    // Don't reset loading state here to avoid flicker on re-renders
    // setUserAuthState({ user: null, isUserLoading: true, userError: null });

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
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
      
      const seedCollection = async (collectionName: string, initialData: any[], dateFields: string[] = []) => {
        const collectionRef = collection(firestore, collectionName);
        const snapshot = await getDocs(query(collectionRef, limit(1)));
        if (snapshot.empty) {
          console.log(`Seeding ${collectionName}...`);
          for (const item of initialData) {
            const docToAdd = { ...item };
            dateFields.forEach(field => {
              if (docToAdd[field]) {
                // This handles nested date fields like 'certifications.expiryDate'
                const fieldParts = field.split('.');
                if (fieldParts.length === 2 && Array.isArray(docToAdd[fieldParts[0]])) {
                    docToAdd[fieldParts[0]].forEach((subItem: any) => {
                        if(subItem[fieldParts[1]]) {
                            subItem[fieldParts[1]] = Timestamp.fromDate(new Date(subItem[fieldParts[1]]));
                        }
                    });
                } else {
                    docToAdd[field] = Timestamp.fromDate(new Date(docToAdd[field]));
                }
              }
            });
            await addDoc(collectionRef, docToAdd);
          }
          return true; // Indicates seeding happened
        }
        return false; // Indicates seeding was skipped
      };

      // Seed Staff
      const initialStaff: Omit<Staff, 'id'>[] = [
        { name: 'Harrison Price', role: 'STMS', accessLevel: 'Admin', emergencyContact: { name: 'Jane Price', phone: '021-987-6543' }, certifications: [{ name: 'STMS (CAT A)', expiryDate: new Date('2025-08-15T00:00:00Z') }, { name: 'TMO', expiryDate: new Date('2026-01-20T00:00:00Z') }] },
        { name: 'Ben Carter', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Sarah Carter', phone: '022-111-2222' }, certifications: [{ name: 'TMO-NP', expiryDate: new Date('2025-11-30T00:00:00Z') }] },
        { name: 'Chloe Williams', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Mike Williams', phone: '027-333-4444' }, certifications: [{ name: 'TTMW', expiryDate: new Date('2099-01-01T00:00:00Z') }] },
        { name: 'Jack Taylor', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Emily Taylor', phone: '021-555-6666' }, certifications: [{ name: 'TMO', expiryDate: new Date('2024-09-05T00:00:00Z') }, { name: 'TTMW', expiryDate: new Date('2099-01-01T00:00:00Z') }] },
        { name: 'Liam Wilson', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Grace Wilson', phone: '021-123-1234' }, certifications: [{ name: 'TMO', expiryDate: new Date('2026-05-20T00:00:00Z') }] },
        { name: 'Olivia Brown', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'David Brown', phone: '021-456-4567' }, certifications: [{ name: 'TMO', expiryDate: new Date('2024-07-15T00:00:00Z') }] },
        { name: 'Noah Jones', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Sophie Jones', phone: '021-789-7890' }, certifications: [{ name: 'TMO', expiryDate: new Date('2026-08-01T00:00:00Z') }] },
        { name: 'Ava Smith', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Peter Smith', phone: '021-111-2222' }, certifications: [{ name: 'TMO', expiryDate: new Date('2026-03-10T00:00:00Z') }] },
        { name: 'Lucas Miller', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Mia Miller', phone: '021-222-3333' }, certifications: [{ name: 'TMO', expiryDate: new Date('2025-10-25T00:00:00Z') }] },
        { name: 'Isla Garcia', role: 'TC', accessLevel: 'Staff Member', emergencyContact: { name: 'Leo Garcia', phone: '021-333-4444' }, certifications: [{ name: 'TMO', expiryDate: new Date('2026-07-18T00:00:00Z') }] },
      ];
      await seedCollection('staff', initialStaff, ['certifications.expiryDate']);

      // Seed Trucks
      const initialTrucks: Omit<Truck, 'id'>[] = [
        { name: 'Big Bertha', plate: 'TRUCK1', status: 'Operational', service: { lastServiceDate: '2024-05-10T00:00:00Z', nextServiceDate: '2024-11-10T00:00:00Z', nextServiceKms: 150000 }, currentKms: 145000, fuelLog: [{ date: '2024-07-02T00:00:00Z', volumeLiters: 120, cost: 240.50 }] },
        { name: 'The Workhorse', plate: 'TRUCK2', status: 'Check Required', service: { lastServiceDate: '2024-06-20T00:00:00Z', nextServiceDate: '2024-12-20T00:00:00Z', nextServiceKms: 160000 }, currentKms: 158500, fuelLog: [] },
        { name: 'Old Reliable', plate: 'TRUCK3', status: 'In Service', service: { lastServiceDate: '2024-01-01T00:00:00Z', nextServiceDate: '2024-07-25T00:00:00Z', nextServiceKms: 120000 }, currentKms: 119800, fuelLog: [] },
      ];
      await seedCollection('trucks', initialTrucks, ['service.lastServiceDate', 'service.nextServiceDate']);
      
      // Seed Jobs
      const jobsCollectionRef = collection(firestore, 'job_packs');
      const jobsSnapshot = await getDocs(query(jobsCollectionRef, limit(1)));
      if (jobsSnapshot.empty) {
        console.log('Seeding jobs...');
        const staffSnapshot = await getDocs(collection(firestore, 'staff'));
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
