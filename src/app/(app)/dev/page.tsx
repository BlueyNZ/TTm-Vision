'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useTenant } from '@/contexts/tenant-context';
import { collection, query, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Tenant } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Building2, Users, CheckCircle, XCircle, Trash2, Edit, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DevPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { impersonateTenant } = useTenant();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const idTokenResult = await user.getIdTokenResult();
        const isSuperAdmin = idTokenResult.claims.superAdmin === true;
        setIsSuperAdmin(isSuperAdmin);
        
        if (!isSuperAdmin) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this area.',
            variant: 'destructive',
          });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        router.push('/dashboard');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    if (!isUserLoading) {
      checkSuperAdmin();
    }
  }, [user, isUserLoading, router, toast]);

  const tenantsCollection = useMemoFirebase(() => {
    if (!firestore || !isSuperAdmin) return null;
    return query(collection(firestore, 'tenants'), orderBy('createdAt', 'desc'));
  }, [firestore, isSuperAdmin]);

  const { data: tenants, isLoading: isLoadingTenants } = useCollection<Tenant>(tenantsCollection);

  const handleStatusChange = async (tenantId: string, newStatus: 'Active' | 'Suspended' | 'Inactive') => {
    if (!firestore) return;

    try {
      await updateDoc(doc(firestore, 'tenants', tenantId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'Status Updated',
        description: `Tenant status changed to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTenant = async () => {
    if (!firestore || !tenantToDelete) return;

    try {
      await deleteDoc(doc(firestore, 'tenants', tenantToDelete.id));
      
      toast({
        title: 'Tenant Deleted',
        description: `${tenantToDelete.name} has been permanently deleted.`,
        variant: 'destructive',
      });
      
      setTenantToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isUserLoading || isCheckingAuth) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Dashboard</h1>
          <p className="text-muted-foreground">Manage all companies using TTM Vision</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Management</CardTitle>
          <CardDescription>
            View and manage all registered companies on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTenants ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : tenants && tenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Tenant ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {tenant.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {tenant.id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tenant.status}
                        onValueChange={(value) => handleStatusChange(tenant.id, value as any)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="Suspended">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-3 w-3 text-orange-500" />
                              Suspended
                            </div>
                          </SelectItem>
                          <SelectItem value="Inactive">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-3 w-3 text-gray-500" />
                              Inactive
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {tenant.createdAt instanceof Timestamp
                        ? format(tenant.createdAt.toDate(), 'dd MMM yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {tenant.settings?.contactEmail && (
                          <div className="text-muted-foreground">{tenant.settings.contactEmail}</div>
                        )}
                        {tenant.settings?.contactPhone && (
                          <div className="text-muted-foreground">{tenant.settings.contactPhone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => impersonateTenant(tenant.id, tenant.name)}
                          title="View as this company"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTenantToDelete(tenant)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No companies registered yet
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!tenantToDelete} onOpenChange={() => setTenantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{tenantToDelete?.name}</strong>?
              This will not delete the company's data (staff, jobs, etc.) but will prevent them from being managed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTenant} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
