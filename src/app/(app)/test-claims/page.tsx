'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestClaimsPage() {
  const { user, isUserLoading } = useUser();
  const [claims, setClaims] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getClaims = async () => {
      if (user) {
        try {
          // Force token refresh
          const tokenResult = await user.getIdTokenResult(true);
          console.log('Full token result:', tokenResult);
          setClaims(tokenResult.claims);
        } catch (error) {
          console.error('Error getting claims:', error);
        }
      }
      setLoading(false);
    };

    if (!isUserLoading) {
      getClaims();
    }
  }, [user, isUserLoading]);

  if (isUserLoading || loading) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
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
            <CardDescription>Please log in to view your custom claims</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Your Firebase Auth user details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>UID:</strong> {user.uid}</div>
          <div><strong>Display Name:</strong> {user.displayName || 'Not set'}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Claims</CardTitle>
          <CardDescription>Your JWT custom claims</CardDescription>
        </CardHeader>
        <CardContent>
          {claims ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Tenant ID:</strong>
                  <div className="mt-1">
                    {claims.tenantId ? (
                      <Badge variant="outline">{claims.tenantId}</Badge>
                    ) : (
                      <Badge variant="destructive">Not Set</Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <strong>Staff ID:</strong>
                  <div className="mt-1">
                    {claims.staffId ? (
                      <Badge variant="outline">{claims.staffId}</Badge>
                    ) : (
                      <Badge variant="destructive">Not Set</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <strong>Role:</strong>
                  <div className="mt-1">
                    {claims.role ? (
                      <Badge variant="outline">{claims.role}</Badge>
                    ) : (
                      <Badge variant="destructive">Not Set</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <strong>Access Level:</strong>
                  <div className="mt-1">
                    {claims.accessLevel ? (
                      <Badge variant="outline">{claims.accessLevel}</Badge>
                    ) : (
                      <Badge variant="destructive">Not Set</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <strong>Super Admin:</strong>
                  <div className="mt-1">
                    {claims.superAdmin === true ? (
                      <Badge className="bg-green-500">✓ YES</Badge>
                    ) : (
                      <Badge variant="secondary">✗ NO</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <strong>All Claims (Raw JSON):</strong>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                  {JSON.stringify(claims, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p>No custom claims found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
