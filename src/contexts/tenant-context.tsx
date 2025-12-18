'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Staff, Tenant } from '@/lib/data';

interface TenantMembership {
  tenantId: string;
  tenantName: string;
  staffId: string;
  role: string;
}

interface TenantContextType {
  tenantId: string | null;
  isLoading: boolean;
  availableTenants: TenantMembership[];
  switchTenant: (tenantId: string) => void;
  currentTenantName: string | null;
  isImpersonating: boolean;
  impersonateTenant: (tenantId: string, tenantName: string) => void;
  stopImpersonating: () => void;
  impersonatedTenantName: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  isLoading: true,
  availableTenants: [],
  switchTenant: () => {},
  currentTenantName: null,
  isImpersonating: false,
  impersonateTenant: () => {},
  stopImpersonating: () => {},
  impersonatedTenantName: null,
});

export function useTenant() {
  return useContext(TenantContext);
}

const SELECTED_TENANT_KEY = 'selectedTenantId';
const IMPERSONATION_KEY = 'superAdminImpersonation';

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonatedTenantName, setImpersonatedTenantName] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      setTenantId(null);
      setAvailableTenants([]);
      return;
    }

    const fetchTenantMemberships = async () => {
      try {
        // Check for super admin impersonation first
        const impersonationData = localStorage.getItem(IMPERSONATION_KEY);
        if (impersonationData) {
          try {
            const { tenantId: impTenantId, tenantName: impTenantName } = JSON.parse(impersonationData);
            const idTokenResult = await user.getIdTokenResult();
            if (idTokenResult.claims.superAdmin === true) {
              setTenantId(impTenantId);
              setImpersonatedTenantName(impTenantName);
              setIsImpersonating(true);
              setIsLoading(false);
              return;
            } else {
              // Not a super admin anymore, clear impersonation
              localStorage.removeItem(IMPERSONATION_KEY);
            }
          } catch (e) {
            localStorage.removeItem(IMPERSONATION_KEY);
          }
        }

        // Query all staff records for this user's email
        const staffQuery = query(
          collection(firestore, 'staff'),
          where('email', '==', user.email)
        );
        const staffSnapshot = await getDocs(staffQuery);
        
        const memberships: TenantMembership[] = [];
        
        // Fetch tenant names for each staff record
        for (const staffDoc of staffSnapshot.docs) {
          const staffData = staffDoc.data() as Staff;
          if (staffData.tenantId) {
            // Fetch the actual tenant document to get the company name
            const tenantDoc = await getDoc(doc(firestore, 'tenants', staffData.tenantId));
            const tenantName = tenantDoc.exists() 
              ? (tenantDoc.data() as Tenant).name 
              : staffData.tenantId; // Fallback to ID if tenant doc doesn't exist
            
            memberships.push({
              tenantId: staffData.tenantId,
              tenantName: tenantName,
              staffId: staffDoc.id,
              role: staffData.role || 'Staff Member',
            });
          }
        }

        setAvailableTenants(memberships);

        // Determine which tenant to use
        if (memberships.length === 0) {
          console.warn('No tenant memberships found for user:', user.email);
          setTenantId(null);
        } else if (memberships.length === 1) {
          // Only one tenant - auto-select it
          setTenantId(memberships[0].tenantId);
          localStorage.setItem(SELECTED_TENANT_KEY, memberships[0].tenantId);
        } else {
          // Multiple tenants - check localStorage for last selected
          const savedTenantId = localStorage.getItem(SELECTED_TENANT_KEY);
          const validSavedTenant = memberships.find(m => m.tenantId === savedTenantId);
          
          if (validSavedTenant) {
            setTenantId(validSavedTenant.tenantId);
          } else {
            // No valid saved tenant - use first one
            setTenantId(memberships[0].tenantId);
            localStorage.setItem(SELECTED_TENANT_KEY, memberships[0].tenantId);
          }
        }
      } catch (error) {
        console.error('Error fetching tenant memberships:', error);
        setTenantId(null);
        setAvailableTenants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantMemberships();
  }, [user, firestore]);

  const switchTenant = (newTenantId: string) => {
    const validTenant = availableTenants.find(t => t.tenantId === newTenantId);
    if (validTenant) {
      setTenantId(newTenantId);
      localStorage.setItem(SELECTED_TENANT_KEY, newTenantId);
      // Reload the page to refresh all data with new tenant context
      window.location.reload();
    }
  };

  const impersonateTenant = async (targetTenantId: string, targetTenantName: string) => {
    // Verify user is super admin
    if (!user) return;
    
    try {
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.superAdmin !== true) {
        console.error('Only super admins can impersonate tenants');
        return;
      }

      localStorage.setItem(IMPERSONATION_KEY, JSON.stringify({
        tenantId: targetTenantId,
        tenantName: targetTenantName,
      }));
      
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error starting impersonation:', error);
    }
  };

  const stopImpersonating = () => {
    localStorage.removeItem(IMPERSONATION_KEY);
    setIsImpersonating(false);
    setImpersonatedTenantName(null);
    window.location.href = '/dev';
  };

  const currentTenantName = isImpersonating 
    ? impersonatedTenantName 
    : availableTenants.find(t => t.tenantId === tenantId)?.tenantName || null;

  return (
    <TenantContext.Provider value={{ 
      tenantId, 
      isLoading, 
      availableTenants, 
      switchTenant, 
      currentTenantName,
      isImpersonating,
      impersonateTenant,
      stopImpersonating,
      impersonatedTenantName,
    }}>
      {children}
    </TenantContext.Provider>
  );
}
