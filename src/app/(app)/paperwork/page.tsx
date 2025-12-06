
'use client';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "@/components/ui/card";
import { Job } from "@/lib/data";
import { LoaderCircle, FileText } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/tenant-context";

export default function PaperworkPage() {
    const firestore = useFirestore();
    const { tenantId } = useTenant();

    const jobsCollection = useMemoFirebase(() => {
        if (!firestore || !tenantId) return null;
        return query(collection(firestore, 'job_packs'), where('tenantId', '==', tenantId), where('status', '!=', 'Pending'));
    }, [firestore, tenantId]);

    const { data: jobData, isLoading } = useCollection<Job>(jobsCollection);

    const sortedJobs = useMemo(() => {
        return jobData?.sort((a, b) => {
            const dateA = a.startDate instanceof Timestamp ? a.startDate.toDate() : new Date(a.startDate);
            const dateB = b.startDate instanceof Timestamp ? b.startDate.toDate() : new Date(b.startDate);
            return dateB.getTime() - dateA.getTime();
        });
    }, [jobData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paperwork Hub</CardTitle>
        <CardDescription>
          Select a job below to view and complete its associated paperwork.
        </CardDescription>
      </CardHeader>
      <CardContent>
         {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
            ) : sortedJobs && sortedJobs.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job No.</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="hidden lg:table-cell">Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedJobs.map((job) => {
                            const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
                            return (
                            <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.jobNumber}</TableCell>
                                <TableCell>{job.location}</TableCell>
                                <TableCell>{job.clientName}</TableCell>
                                <TableCell className="hidden lg:table-cell text-muted-foreground">
                                    {format(startDate, 'dd MMM yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild size="sm">
                                        <Link href={`/paperwork/${job.id}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            View Paperwork
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            ) : (
                 <div className="text-center py-10 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="mt-4">No active or completed jobs found.</p>
                </div>
            )}
      </CardContent>
    </Card>
  );
}
