
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
  Edit,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Job, OnSiteRecord } from '@/lib/data';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export default function JobOnSiteRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [itemToDelete, setItemToDelete] = useState<OnSiteRecord | null>(null);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const onSiteRecordsRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return collection(firestore, 'job_packs', jobId, 'on_site_records');
  }, [firestore, jobId]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: onSiteRecords, isLoading: areItemsLoading } = useCollection<OnSiteRecord>(onSiteRecordsRef);

  const isLoading = isJobLoading || areItemsLoading;

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;

    deleteDocumentNonBlocking(doc(firestore, 'job_packs', jobId, 'on_site_records', itemToDelete.id));

    toast({
        variant: "destructive",
        title: "On-Site Record Deleted",
        description: `The on-site record has been deleted.`,
    });
    setItemToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>On-Site Record Submissions</CardTitle>
            <CardDescription>
              All submitted On-Site Record forms for job {job?.jobNumber || '...'}.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/jobs/${jobId}/paperwork/on-site-record/create`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New On-Site Record
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : onSiteRecords && onSiteRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TMP Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>STMS</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onSiteRecords.map((item) => {
                  const jobDate = item.jobDate instanceof Timestamp ? item.jobDate.toDate() : new Date(item.jobDate);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.tmpNumber}</TableCell>
                      <TableCell>{format(jobDate, 'PPP')}</TableCell>
                      <TableCell>{/* Need to fetch/display staff name */}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/on-site-record/create?view=${item.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/on-site-record/create?edit=${item.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setItemToDelete(item)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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
              <p className="mt-4 font-semibold">No On-Site Records Submitted</p>
              <p>
                Click "New On-Site Record" to submit the first one for this job.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this On-Site Record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
