'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Client } from "@/lib/data";
import { collection, query, where, doc, getDocs, writeBatch } from "firebase/firestore";
import { LoaderCircle, Building, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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

export default function CompanyApprovalPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [approvingClient, setApprovingClient] = useState<Client | null>(null);
    const [decliningClient, setDecliningClient] = useState<Client | null>(null);

    const pendingClientsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'clients'), where('status', '==', 'Pending'));
    }, [firestore]);

    const { data: pendingClients, isLoading } = useCollection<Client>(pendingClientsQuery);

    const handleApproveClient = () => {
        if (!firestore || !approvingClient) return;

        const clientDocRef = doc(firestore, 'clients', approvingClient.id);
        setDocumentNonBlocking(clientDocRef, { status: 'Active' }, { merge: true });

        toast({
            title: "Company Approved",
            description: `${approvingClient.name} is now an active client.`,
        });
        setApprovingClient(null);
    };
    
    const handleDeclineClient = async () => {
        if (!firestore || !decliningClient) return;

        try {
            const batch = writeBatch(firestore);

            // 1. Delete the client document
            const clientDocRef = doc(firestore, 'clients', decliningClient.id);
            batch.delete(clientDocRef);

            // 2. Find and delete the associated staff document
            if (decliningClient.userId) {
                const staffQuery = query(collection(firestore, 'staff'), where('email', '==', decliningClient.userId)); // Assuming client's userId is their email used in staff collection
                const staffSnapshot = await getDocs(staffQuery);
                staffSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }

            await batch.commit();

            toast({
                variant: "destructive",
                title: "Company Declined",
                description: `The registration for ${decliningClient.name} has been declined and removed.`,
            });
        } catch (error) {
            console.error("Error declining client:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not decline the company. Please try again.",
            });
        } finally {
            setDecliningClient(null);
        }
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Company Approval</CardTitle>
                    <CardDescription>Review and approve new client companies that have registered.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <LoaderCircle className="h-8 w-8 animate-spin" />
                        </div>
                    ) : pendingClients && pendingClients.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingClients.map(client => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button onClick={() => setDecliningClient(client)} size="sm" variant="destructive">
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Decline
                                            </Button>
                                            <Button onClick={() => setApprovingClient(client)} size="sm">
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Approve
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <Building className="mx-auto h-12 w-12" />
                            <p className="mt-4">No companies are currently pending approval.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!approvingClient} onOpenChange={(open) => !open && setApprovingClient(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Company?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will activate the company <span className="font-semibold">{approvingClient?.name}</span> and allow them full access to the client portal.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApproveClient}>
                            Approve
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!decliningClient} onOpenChange={(open) => !open && setDecliningClient(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Decline Company?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the registration for <span className="font-semibold">{decliningClient?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeclineClient} className="bg-destructive hover:bg-destructive/90">
                            Decline
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
