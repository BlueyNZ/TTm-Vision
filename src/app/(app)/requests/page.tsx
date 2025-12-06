
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Job } from "@/lib/data";
import { collection, query, where, Timestamp, doc } from "firebase/firestore";
import { LoaderCircle, FileText, Calendar, MapPin, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTenant } from "@/contexts/tenant-context";

export default function RequestsPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { tenantId } = useTenant();
    const [jobToReject, setJobToReject] = useState<Job | null>(null);

    const jobRequestsQuery = useMemoFirebase(() => {
        if (!firestore || !tenantId) return null;
        return query(collection(firestore, 'job_packs'), where('tenantId', '==', tenantId), where('status', '==', 'Pending'));
    }, [firestore, tenantId]);

    const { data: jobRequests, isLoading } = useCollection<Job>(jobRequestsQuery);

    const handleRejectJob = () => {
        if (!firestore || !jobToReject) return;
        deleteDocumentNonBlocking(doc(firestore, 'job_packs', jobToReject.id));
        toast({
            title: "Job Request Rejected",
            description: `The request from ${jobToReject.clientName} has been removed.`,
            variant: "destructive",
            duration: 5000,
        });
        setJobToReject(null);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Job Requests</CardTitle>
                    <CardDescription>Review and approve new job requests submitted by clients.</CardDescription>
                </CardHeader>
                <CardContent>
                    {jobRequests && jobRequests.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Requested Date</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobRequests.map(job => {
                                    const requestedDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
                                    return (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.clientName}</TableCell>
                                            <TableCell>{job.location}</TableCell>
                                            <TableCell>{format(requestedDate, "PPP")}</TableCell>
                                            <TableCell className="text-right">
                                                <Button onClick={() => router.push(`/requests/${job.id}`)} size="sm">
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Review
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12" />
                            <p className="mt-4">No pending job requests.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!jobToReject} onOpenChange={(open) => !open && setJobToReject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to reject this request?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the job request from <span className="font-semibold">{jobToReject?.clientName}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRejectJob}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Reject
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
