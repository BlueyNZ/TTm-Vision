'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, where, Timestamp, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { UserPlus, CheckCircle, XCircle, Mail, Phone, Building2, LoaderCircle, Calendar } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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

type ClientRegistration = {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: Timestamp;
  approvedAt?: Timestamp | null;
  approvedBy?: string | null;
};

export default function ClientRegistrationsPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<ClientRegistration | null>(null);

  // Get pending registrations
  const pendingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'client_registrations'),
      where('status', '==', 'Pending')
    );
  }, [firestore]);
  const { data: pendingRegistrations } = useCollection<ClientRegistration>(pendingQuery);

  // Get all registrations for history
  const allQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'client_registrations'));
  }, [firestore]);
  const { data: allRegistrations } = useCollection<ClientRegistration>(allQuery);

  const handleApprove = async (registration: ClientRegistration) => {
    if (!firestore || !auth?.currentUser) return;
    
    setProcessingId(registration.id);

    try {
      // 1. Create client record using setDoc (creates new document)
      await setDoc(doc(firestore, 'clients', registration.userId), {
        name: registration.companyName,
        email: registration.email,
        phone: registration.phone,
        userId: registration.userId,
        status: 'Active',
        createdAt: Timestamp.now(),
      });

      // 2. Set custom claims via API route
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/set-client-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: registration.userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to set client role');
      }

      // 3. Update registration status
      await updateDoc(doc(firestore, 'client_registrations', registration.id), {
        status: 'Approved',
        approvedAt: Timestamp.now(),
        approvedBy: 'Admin', // TODO: Get current admin user
      });

      toast({
        title: 'Registration Approved',
        description: `${registration.companyName} has been approved and can now access the client portal.`,
      });
    } catch (error) {
      console.error('Error approving registration:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve registration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!firestore || !selectedRegistration) return;
    
    setProcessingId(selectedRegistration.id);

    try {
      // Update registration status to rejected
      await updateDoc(doc(firestore, 'client_registrations', selectedRegistration.id), {
        status: 'Rejected',
        approvedAt: Timestamp.now(),
        approvedBy: 'Admin', // TODO: Get current admin user
      });

      toast({
        title: 'Registration Rejected',
        description: `${selectedRegistration.companyName}'s registration has been rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject registration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
      setRejectDialogOpen(false);
      setSelectedRegistration(null);
    }
  };

  const openRejectDialog = (registration: ClientRegistration) => {
    setSelectedRegistration(registration);
    setRejectDialogOpen(true);
  };

  const approvedCount = allRegistrations?.filter(r => r.status === 'Approved').length || 0;
  const rejectedCount = allRegistrations?.filter(r => r.status === 'Rejected').length || 0;

  return (
    <div className="flex flex-col gap-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold">Client Registrations</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve client account requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {pendingRegistrations?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {approvedCount}
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {rejectedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Registrations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pending Requests</h2>
        
        {!pendingRegistrations || pendingRegistrations.length === 0 ? (
          <Card className="card-modern">
            <CardContent className="p-12 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Pending Requests</h3>
              <p className="text-muted-foreground mt-2">
                All client registration requests have been reviewed.
              </p>
            </CardContent>
          </Card>
        ) : (
          pendingRegistrations.map((registration) => (
            <Card key={registration.id} className="card-modern border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{registration.companyName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Contact: {registration.contactName}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        Pending
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${registration.email}`} className="hover:text-primary">
                          {registration.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${registration.phone}`} className="hover:text-primary">
                          {registration.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Requested {format(registration.requestedAt.toDate(), 'PPP')}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => handleApprove(registration)}
                        disabled={processingId === registration.id}
                        className="gap-2"
                      >
                        {processingId === registration.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => openRejectDialog(registration)}
                        disabled={processingId === registration.id}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the registration from{' '}
              <strong>{selectedRegistration?.companyName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
