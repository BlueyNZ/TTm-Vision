
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
import { Job, OnSiteRecordMobileOps } from '@/lib/data';
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


export default function JobMobileOpsRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [itemToDelete, setItemToDelete] = useState<OnSiteRecordMobileOps | null>(null);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const mobileOpsRecordsRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return collection(firestore, 'job_packs', jobId, 'on_site_records_mobile_ops');
  }, [firestore, jobId]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: mobileOpsRecords, isLoading: areItemsLoading } = useCollection<OnSiteRecordMobileOps>(mobileOpsRecordsRef);

  const isLoading = isJobLoading || areItemsLoading;

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;

    deleteDocumentNonBlocking(doc(firestore, 'job_packs', jobId, 'on_site_records_mobile_ops', itemToDelete.id));

    toast({
        variant: "destructive",
        title: "On-Site Record (Mobile) Deleted",
        description: `The record from ${format(itemToDelete.date.toDate(), 'PPP')} has been deleted.`,
    });
    setItemToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>On-Site Record (Mobile) Submissions</CardTitle>
            <CardDescription>
              All submitted mobile ops records for job {job?.jobNumber || '...'}.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/jobs/${jobId}/paperwork/mobile-ops-on-site-record/create`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Record
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : mobileOpsRecords && mobileOpsRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>STMS</TableHead>
                  <TableHead>TMP Ref</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mobileOpsRecords.map((item) => {
                  const recordDate = item.date instanceof Timestamp ? item.date.toDate() : new Date(item.date);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{format(recordDate, 'PPP')}</TableCell>
                      <TableCell className="font-medium">{item.stmsName}</TableCell>
                      <TableCell>{item.tmpReference}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/mobile-ops-on-site-record/create?view=${item.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/mobile-ops-on-site-record/create?edit=${item.id}`)}>
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
              <p className="mt-4 font-semibold">No Records Submitted</p>
              <p>
                Click "New Record" to submit the first one for this job.
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
              This action cannot be undone. This will permanently delete this record.
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
