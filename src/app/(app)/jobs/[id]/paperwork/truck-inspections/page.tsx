
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
import { Job, TruckInspection, Staff, Truck } from '@/lib/data';
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
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export default function JobTruckInspectionsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [inspectionToDelete, setInspectionToDelete] = useState<TruckInspection | null>(null);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const inspectionsRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return collection(firestore, 'job_packs', jobId, 'truck_inspections');
  }, [firestore, jobId]);
  
  const trucksRef = useMemoFirebase(() => firestore ? collection(firestore, 'trucks') : null, [firestore]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: inspections, isLoading: areInspectionsLoading } = useCollection<TruckInspection>(inspectionsRef);
  const { data: trucks, isLoading: areTrucksLoading } = useCollection<Truck>(trucksRef);

  const isLoading = isJobLoading || areInspectionsLoading || areTrucksLoading;

  const getTruckName = (truckId: string) => {
    return trucks?.find(t => t.id === truckId)?.name || truckId;
  }

  const handleDelete = () => {
    if (!firestore || !inspectionToDelete) return;

    deleteDocumentNonBlocking(doc(firestore, 'job_packs', jobId, 'truck_inspections', inspectionToDelete.id));

    toast({
        variant: "destructive",
        title: "Truck Inspection Deleted",
        description: `The inspection has been deleted.`,
    });
    setInspectionToDelete(null);
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Truck Inspections</CardTitle>
            <CardDescription>
              All submitted inspections for job {job?.jobNumber || '...'}
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/jobs/${jobId}/paperwork/truck-inspection`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Inspection
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : inspections && inspections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Truck</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((inspection) => {
                  const inspectionDate =
                    inspection.inspectionDate instanceof Timestamp
                      ? inspection.inspectionDate.toDate()
                      : new Date(inspection.inspectionDate);
                  return (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-medium">{getTruckName(inspection.truckId)}</TableCell>
                      <TableCell>{format(inspectionDate, 'PPP')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/truck-inspection?view=${inspection.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/truck-inspection?edit=${inspection.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setInspectionToDelete(inspection)}
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
              <p className="mt-4 font-semibold">No Inspections Submitted</p>
              <p>
                Click "New Inspection" to submit the first one for this job.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!inspectionToDelete} onOpenChange={(open) => !open && setInspectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this truck inspection record.
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
