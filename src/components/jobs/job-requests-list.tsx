
'use client';
import { Job } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Circle, Eye, Edit, LoaderCircle, Trash2 } from "lucide-react";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, Timestamp, orderBy, query, where, QueryConstraint } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const ClientFormattedDate = ({ date }: { date: Date | Timestamp | string }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    let d: Date;
    if (date instanceof Timestamp) {
      d = date.toDate();
    } else {
      d = new Date(date);
    }
    setFormattedDate(format(d, 'dd MMM yyyy'));
  }, [date]);

  return <>{formattedDate || '...'}</>;
}


export function JobRequestsList() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const constraints: QueryConstraint[] = [
        where('status', '==', 'Pending'),
        orderBy('startDate', 'asc')
    ];
    return query(collection(firestore, 'job_packs'), ...constraints);
  }, [firestore]);

  const { data: jobData, isLoading } = useCollection<Job>(jobsQuery);

  const handleDeleteJob = () => {
    if (!firestore || !jobToDelete) return;

    const jobDocRef = doc(firestore, 'job_packs', jobToDelete.id);
    deleteDocumentNonBlocking(jobDocRef);
    
    toast({
      title: "Job Request Deleted",
      description: `The request for ${jobToDelete.location} has been removed.`,
      variant: "destructive",
      duration: 5000,
    });

    setJobToDelete(null); // Close the dialog
  };
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!jobData || jobData.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>There are no pending job requests.</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job No.</TableHead>
            <TableHead>Location / Client</TableHead>
            <TableHead className="hidden lg:table-cell">Date Requested</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobData?.map((job) => {
            return (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.jobNumber}</TableCell>
              <TableCell>
                <div className="font-medium">{job.location}</div>
                <div className="text-sm text-muted-foreground">{job.clientName}</div>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                <ClientFormattedDate date={job.startDate} />
              </TableCell>
              <TableCell>
                <Badge 
                  variant="warning"
                  className={cn("flex items-center gap-2 w-fit bg-warning/20 text-yellow-800 border-warning")}
                >
                  <Circle className={cn("h-2 w-2 fill-warning")}/>
                  Pending
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Review & Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setJobToDelete(job)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
      
      <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job request
              for <span className="font-semibold">{jobToDelete?.location}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
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
