
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Building, MoreHorizontal, PlusCircle, Trash2, Edit, LoaderCircle, Eye, ArrowLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { AddClientDialog } from '@/components/clients/add-client-dialog';

export default function ClientsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const clientsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'clients');
  }, [firestore]);
  
  const { data: clientData, isLoading } = useCollection<Client>(clientsCollection);

  const handleDeleteClient = () => {
    if (!firestore || !deletingClient) return;
    const clientDocRef = doc(firestore, 'clients', deletingClient.id);
    deleteDocumentNonBlocking(clientDocRef);
    toast({
      title: "Client Removed",
      description: `${deletingClient.name} has been removed.`,
      variant: "destructive",
    });
    setDeletingClient(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
         <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-semibold">Client Management</h1>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Client List</CardTitle>
            <CardDescription>
              Add, edit, or remove client companies.
            </CardDescription>
          </div>
           <AddClientDialog onDialogClose={() => {}}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </AddClientDialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
              </div>
          ) : clientData && clientData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientData.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingClient(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                         <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingClient(client)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
                <Building className="mx-auto h-12 w-12" />
                <p className="mt-4">No clients on record. Add your first client to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {editingClient && (
        <AddClientDialog
          clientToEdit={editingClient}
          onDialogClose={() => setEditingClient(null)}
          open={!!editingClient}
          onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}
        >
          <></>
        </AddClientDialog>
      )}

      <AlertDialog open={!!deletingClient} onOpenChange={(open) => !open && setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client:
               <span className="font-semibold"> {deletingClient?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
