// src/firebase/firestore/use-doc.tsx
'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';

export function useDoc<T = DocumentData>(
  docRef: DocumentReference<T> | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = {
            ...snapshot.data(),
            id: snapshot.id,
          };
          setData(data as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
