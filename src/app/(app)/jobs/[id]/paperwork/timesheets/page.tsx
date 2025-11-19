
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LoaderCircle,
  PlusCircle,
  FileText,
  MoreHorizontal,
  Eye,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Job, Timesheet } from '@/lib/data';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function JobTimesheetsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const firestore = useFirestore();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const timesheetsRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return collection(firestore, 'job_packs', jobId, 'timesheets');
  }, [firestore, jobId]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: timesheets, isLoading: areTimesheetsLoading } =
    useCollection<Timesheet>(timesheetsRef);

  const isLoading = isJobLoading || areTimesheetsLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Job Timesheets</CardTitle>
          <CardDescription>
            All submitted timesheets for job {job?.jobNumber || '...'} at{' '}
            {job?.location || '...'}.
          </CardDescription>
        </div>
        <Button asChild>
          <Link href={`/jobs/${jobId}/paperwork/single-crew-timesheet`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Timesheet
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
        ) : timesheets && timesheets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.map((ts) => {
                const jobDate =
                  ts.jobDate instanceof Timestamp
                    ? ts.jobDate.toDate()
                    : new Date(ts.jobDate);
                return (
                  <TableRow key={ts.id}>
                    <TableCell className="font-medium">{ts.staffName}</TableCell>
                    <TableCell>{format(jobDate, 'PPP')}</TableCell>
                    <TableCell>{ts.totalHours}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
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
            <p className="mt-4 font-semibold">No Timesheets Submitted</p>
            <p>
              Click "New Timesheet" to submit the first one for this job.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
