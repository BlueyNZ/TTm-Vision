// src/firebase/firestore/use-collection.tsx
'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  startAt,
  endAt,
  type DocumentData,
  type CollectionReference,
  type Query,
} from 'firebase/firestore';

import { useFirestore } from '@/firebase';

export function useCollection<T = DocumentData>(
  collectionRef: CollectionReference<T> | Query<T> | null
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!collectionRef) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(data as T[]);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionRef]);

  return { data, loading, error };
}
