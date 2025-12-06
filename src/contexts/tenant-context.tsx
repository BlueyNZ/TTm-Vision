'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Staff } from '@/lib/data';

interface TenantContextType {
  tenantId: string | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  isLoading: true,
});

export function useTenant() {
  return useContext(TenantContext);
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      setTenantId(null);
      return;
    }

    const fetchTenantId = async () => {
      try {
        // First, try to get tenantId from custom claims (fastest)
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims.tenantId) {
          setTenantId(tokenResult.claims.tenantId as string);
          setIsLoading(false);
          return;
        }

        // Fallback: Get staff document using UID as document ID
        const { doc, getDoc } = await import('firebase/firestore');
        const staffDoc = await getDoc(doc(firestore, 'staff', user.uid));
        
        if (staffDoc.exists()) {
          const staffData = staffDoc.data() as Staff;
          setTenantId(staffData.tenantId || null);
        } else {
          console.warn('No staff document found for user:', user.uid);
          setTenantId(null);
        }
      } catch (error) {
        console.error('Error fetching tenant ID:', error);
        setTenantId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantId();
  }, [user, firestore]);

  return (
    <TenantContext.Provider value={{ tenantId, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}
