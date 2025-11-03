// src/firebase/auth/use-user.tsx
'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { useAuth } from '@/firebase/provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the auth service isn't ready yet (e.g., while persistence is being set),
    // we remain in a loading state. This effect will re-run once `auth` is available.
    if (!auth) {
       setLoading(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]); // This effect now correctly depends on the availability of the auth service.

  return { user, isUserLoading: loading, error };
}
