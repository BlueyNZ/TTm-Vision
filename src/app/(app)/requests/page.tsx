
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Job } from "@/lib/data";
import { collection, query, where, Timestamp } from "firebase/firestore";
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

export default function RequestsPage() {
    const firestore = useFirestore();
    const router = useRouter();

    const jobRequestsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // This query specifically targets documents where status is 'Pending'
        return query(collection(firestore, 'job_packs'), where('status', '==', 'Pending'));
    }, [firestore]);

    const { data: jobRequests, isLoading } = useCollection<Job>(jobRequestsQuery);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
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
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}/edit`)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Review
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Reject
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
    );
}
