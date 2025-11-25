
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
import { Job, HazardId } from '@/lib/data';
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


export default function JobHazardIdsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [itemToDelete, setItemToDelete] = useState<HazardId | null>(null);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const hazardIdsRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return collection(firestore, 'job_packs', jobId, 'hazard_ids');
  }, [firestore, jobId]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: hazardIds, isLoading: areHazardIdsLoading } = useCollection<HazardId>(hazardIdsRef);

  const isLoading = isJobLoading || areHazardIdsLoading;

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;

    deleteDocumentNonBlocking(doc(firestore, 'job_packs', jobId, 'hazard_ids', itemToDelete.id));

    toast({
        variant: "destructive",
        title: "Hazard ID Deleted",
        description: `The hazard ID form ${itemToDelete.hazardIdNo} has been deleted.`,
    });
    setItemToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hazard ID Submissions</CardTitle>
            <CardDescription>
              All submitted Hazard ID forms for job {job?.jobNumber || '...'}.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/jobs/${jobId}/paperwork/hazard-id/create`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Hazard ID
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : hazardIds && hazardIds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hazardIds.map((item) => {
                  const performedAt = item.performedAt instanceof Timestamp ? item.performedAt.toDate() : new Date(item.performedAt);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.hazardIdNo}</TableCell>
                      <TableCell>{format(performedAt, 'PPP')}</TableCell>
                      <TableCell>{/* Need to fetch/display staff name */}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/hazard-id/create?view=${item.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/hazard-id/create?edit=${item.id}`)}>
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
              <p className="mt-4 font-semibold">No Hazard IDs Submitted</p>
              <p>
                Click "New Hazard ID" to submit the first one for this job.
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
              This action cannot be undone. This will permanently delete the Hazard ID form <span className="font-semibold">{itemToDelete?.hazardIdNo}</span>.
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
