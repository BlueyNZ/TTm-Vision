
'use client';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Job } from "@/lib/data";
import { MoreHorizontal, Circle, Eye, Edit, LoaderCircle, Trash2, Briefcase } from "lucide-react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, Timestamp, query, where } from "firebase/firestore";
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
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";


const getDisplayedStatus = (job: Job) => {
  const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
  if (job.status === 'Upcoming' && isPast(startDate)) {
    return 'In Progress';
  }
  return job.status;
};

const getStatusVariant = (status: Job['status']) => {
  switch (status) {
    case 'Upcoming':
      return 'secondary';
    case 'In Progress':
      return 'default';
    case 'Cancelled':
      return 'destructive';
    case 'Completed':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'In Progress':
        return 'fill-success';
      case 'Cancelled':
        return 'fill-destructive';
      default:
        return 'fill-muted-foreground';
    }
};

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


export default function PastJobsPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

    const pastJobsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        // Query for past jobs only
        return query(collection(firestore, 'job_packs'), where('status', 'in', ['Completed', 'Cancelled']));
    }, [firestore]);

    const { data: jobData, isLoading } = useCollection<Job>(pastJobsCollection);

    const handleDeleteJob = () => {
        if (!firestore || !jobToDelete) return;

        const jobDocRef = doc(firestore, 'job_packs', jobToDelete.id);
        deleteDocumentNonBlocking(jobDocRef);
        
        toast({
        title: "Job Deleted",
        description: `The job at ${jobToDelete.location} has been deleted.`,
        variant: "destructive",
        });

        setJobToDelete(null);
    };
    
  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Past Jobs</CardTitle>
            <CardDescription>
                An archive of all completed and cancelled jobs.
            </CardDescription>
        </div>
        <Button asChild variant="outline">
            <Link href="/jobs">
                <Briefcase className="mr-2 h-4 w-4" />
                View Active Jobs
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
         {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
            ) : jobData && jobData.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job No.</TableHead>
                            <TableHead>Location / Client</TableHead>
                            <TableHead className="hidden lg:table-cell">Date</TableHead>
                            <TableHead>STMS</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>
                            <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobData.map((job) => {
                            const displayedStatus = getDisplayedStatus(job);
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
                            <TableCell>{job.stms || 'N/A'}</TableCell>
                            <TableCell>
                                <Badge 
                                variant={getStatusVariant(displayedStatus)} 
                                className={cn("flex items-center gap-2 w-fit")}
                                >
                                <Circle className={cn("h-2 w-2", getStatusColor(displayedStatus))}/>
                                {displayedStatus}
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
                                    <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
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
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <Briefcase className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">No Past Jobs Found</p>
                    <p>Completed and cancelled jobs will appear here.</p>
                </div>
            )}
      </CardContent>
    </Card>

    <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job pack
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
