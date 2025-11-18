
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, LoaderCircle, Users, Mail, Trash2, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Staff, Client } from '@/lib/data';
import { collection, query, where, doc, getDocs } from 'firebase/firestore';
import { AddClientStaffDialog } from '@/components/clients/add-client-staff-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';

export default function ClientStaffPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [isClientLoading, setIsClientLoading] = useState(true);

  // Effect to determine the current client
  useEffect(() => {
    if (isUserLoading || !user || !firestore) return;
    
    const findClient = async () => {
      setIsClientLoading(true);
      // First, find the staff profile of the logged-in user
      const staffQuery = query(collection(firestore, 'staff'), where('email', '==', user.email));
      const staffSnapshot = await getDocs(staffQuery);
      
      if (!staffSnapshot.empty) {
        const staffProfile = staffSnapshot.docs[0].data() as Staff;
        
        let foundClientId: string | undefined;
        // If the user is a primary client, find their client doc via userId
        if (staffProfile.accessLevel === 'Client') {
           const clientQueryByUserId = query(collection(firestore, 'clients'), where('userId', '==', user.uid));
           const clientSnapshot = await getDocs(clientQueryByUserId);
           if (!clientSnapshot.empty) {
             foundClientId = clientSnapshot.docs[0].id;
           }
        } 
        // If they are client staff, the ID is directly on their profile
        else if (staffProfile.accessLevel === 'Client Staff') {
          foundClientId = staffProfile.clientId;
        }

        if (foundClientId) {
           const clientQueryById = query(collection(firestore, 'clients'), where('__name__', '==', foundClientId));
           const clientDocSnapshot = await getDocs(clientQueryById);
           if (!clientDocSnapshot.empty) {
             setCurrentClient({ id: clientDocSnapshot.docs[0].id, ...clientDocSnapshot.docs[0].data() } as Client);
           }
        }
      }
      setIsClientLoading(false);
    };
    
    findClient();

  }, [user, isUserLoading, firestore]);

  const clientStaffQuery = useMemoFirebase(() => {
    if (!firestore || !currentClient?.id) return null;
    return query(
      collection(firestore, 'staff'),
      where('accessLevel', '==', 'Client Staff'),
      where('clientId', '==', currentClient.id)
    );
  }, [firestore, currentClient?.id]);

  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(clientStaffQuery);
  
  const handleDeleteStaff = () => {
    if (!firestore || !staffToDelete) return;

    deleteDocumentNonBlocking(doc(firestore, 'staff', staffToDelete.id));

    toast({
        title: "Staff Member Removed",
        description: `The profile for ${staffToDelete.name} has been deleted.`,
        variant: "destructive"
    });
    setStaffToDelete(null);
  };

  const handleDialogClose = () => {
    setEditingStaff(null);
    setIsAddStaffDialogOpen(false);
  };

  const isLoading = isUserLoading || isClientLoading || isStaffLoading;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>Add and manage your company's staff members.</CardDescription>
          </div>
          <Button onClick={() => setIsAddStaffDialogOpen(true)} disabled={!currentClient}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : staffData && staffData.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {staffData.map(staff => (
                        <TableRow key={staff.id}>
                            <TableCell>
                                <span className="font-medium">{staff.name}</span>
                            </TableCell>
                            <TableCell>{staff.email}</TableCell>
                            <TableCell>
                                <Badge variant={staff.clientRole === 'Admin' ? 'default' : 'secondary'}>
                                    {staff.clientRole || 'Staff'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => setEditingStaff(staff)}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit Role</span>
                                </Button>
                                <Button variant="ghost" size="icon" disabled>
                                    <Mail className="h-4 w-4" />
                                    <span className="sr-only">Resend Invite</span>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setStaffToDelete(staff)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="mx-auto h-12 w-12" />
              <p className="mt-4 font-semibold">No Staff Members Added</p>
              <p>Click "Add Staff" to invite your first team member.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {currentClient && (
        <AddClientStaffDialog 
            clientId={currentClient.id}
            clientName={currentClient.name}
            open={isAddStaffDialogOpen || !!editingStaff}
            onOpenChange={(open) => {
                if (!open) {
                    setIsAddStaffDialogOpen(false);
                    setEditingStaff(null);
                }
            }}
            staffToEdit={editingStaff}
            onDialogClose={handleDialogClose}
        />
      )}

      <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the staff profile for <span className="font-semibold">{staffToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStaff}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
