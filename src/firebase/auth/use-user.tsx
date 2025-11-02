// src/firebase/auth/use-user.tsx
'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { useAuth } from '@/firebase';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      () => {
        // setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
