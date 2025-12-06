'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DiagnosticsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [staffDoc, setStaffDoc] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDatabase = async () => {
      if (!user || !firestore) {
        setLoading(false);
        return;
      }

      try {
        // Check for staff document
        const staffRef = doc(firestore, 'staff', user.uid);
        const staffSnapshot = await getDoc(staffRef);
        
        if (staffSnapshot.exists()) {
          setStaffDoc(staffSnapshot.data());
        }

        // Get all tenants
        const tenantsRef = collection(firestore, 'tenants');
        const tenantsSnapshot = await getDocs(tenantsRef);
        const tenantsData = tenantsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTenants(tenantsData);

      } catch (error) {
        console.error('Error checking database:', error);
      }
      
      setLoading(false);
    };

    if (!isUserLoading) {
      checkDatabase();
    }
  }, [user, firestore, isUserLoading]);

  if (isUserLoading || loading) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading diagnostics...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in to view diagnostics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Account Diagnostics</CardTitle>
          <CardDescription>Checking your database records</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Document Status</CardTitle>
        </CardHeader>
        <CardContent>
          {staffDoc ? (
            <div className="space-y-2">
              <Badge className="bg-green-500">✓ Staff document exists</Badge>
              <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto">
                {JSON.stringify(staffDoc, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <Badge variant="destructive">✗ No staff document found</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                Expected document at: <code>staff/{user.uid}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenants/Companies</CardTitle>
          <CardDescription>{tenants.length} companies found</CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length > 0 ? (
            <div className="space-y-4">
              {tenants.map((tenant, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="font-semibold">{tenant.companyName || 'Unnamed Company'}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Tenant ID: <code>{tenant.id}</code>
                  </div>
                  {staffDoc?.tenantId === tenant.id && (
                    <Badge className="mt-2 bg-blue-500">Your Company</Badge>
                  )}
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(tenant, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <Badge variant="secondary">No companies registered</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Firebase Auth UID</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="p-2 bg-muted rounded">{user.uid}</code>
        </CardContent>
      </Card>
    </div>
  );
}
