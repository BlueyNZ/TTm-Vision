
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
import { PlusCircle, MoreHorizontal, Circle, Eye, Edit, LoaderCircle, Trash2, History, CheckCircle } from "lucide-react";
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
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { JobChatButton } from "@/components/jobs/job-chat-button";
import { useTenant } from "@/contexts/tenant-context";


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


export default function JobsPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { tenantId } = useTenant();
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
    const [jobToComplete, setJobToComplete] = useState<Job | null>(null);

    const jobsCollection = useMemoFirebase(() => {
        if (!firestore || !tenantId) return null;
        // Query for active jobs only, filtered by tenant
        return query(collection(firestore, 'job_packs'), where('tenantId', '==', tenantId), where('status', 'in', ['Upcoming', 'In Progress']));
    }, [firestore, tenantId]);

    const { data: jobData, isLoading } = useCollection<Job>(jobsCollection);

    const sortedJobs = useMemo(() => {
      if (!jobData) return [];
      return [...jobData].sort((a, b) => {
        const dateA = a.startDate instanceof Timestamp ? a.startDate.toDate() : new Date(a.startDate);
        const dateB = b.startDate instanceof Timestamp ? b.startDate.toDate() : new Date(b.startDate);
        return dateB.getTime() - dateA.getTime();
      });
    }, [jobData]);

    const handleDeleteJob = () => {
        if (!firestore || !jobToDelete) return;

        const jobDocRef = doc(firestore, 'job_packs', jobToDelete.id);
        deleteDocumentNonBlocking(jobDocRef);
        
        toast({
        title: "Job Deleted",
        description: `The job at ${jobToDelete.location} has been deleted.`,
        variant: "destructive",
        });

        setJobToDelete(null); // Close the dialog
    };

    const handleCompleteJob = () => {
        if (!firestore || !jobToComplete) return;

        const jobDocRef = doc(firestore, 'job_packs', jobToComplete.id);
        setDocumentNonBlocking(jobDocRef, { status: 'Completed' }, { merge: true });

        toast({
            title: "Job Completed",
            description: `Job ${jobToComplete.jobNumber} has been marked as completed.`,
        });

        setJobToComplete(null);
    }
    
  return (
    <>
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
            <CardTitle className="text-lg sm:text-xl">Job Management</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
            View, create, and manage all active jobs.
            </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link href="/jobs/past">
                    <History className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">View Past Jobs</span>
                    <span className="sm:hidden">Past Jobs</span>
                </Link>
            </Button>
            <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href="/jobs/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Job
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
         {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs sm:text-sm">Job No.</TableHead>
                            <TableHead className="text-xs sm:text-sm">Location / Client</TableHead>
                            <TableHead className="hidden lg:table-cell text-xs sm:text-sm">Start Date</TableHead>
                            <TableHead className="hidden md:table-cell text-xs sm:text-sm">STMS</TableHead>
                            <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="text-xs sm:text-sm">
                            <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedJobs?.map((job) => {
                            const displayedStatus = getDisplayedStatus(job);
                            return (
                            <TableRow key={job.id}>
                            <TableCell className="font-medium text-xs sm:text-sm">{job.jobNumber}</TableCell>
                            <TableCell>
                                <div className="font-medium text-xs sm:text-sm line-clamp-2">{job.location}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground truncate">{job.clientName}</div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-xs sm:text-sm">
                                <ClientFormattedDate date={job.startDate} />
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs sm:text-sm">{job.stms || 'N/A'}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge 
                                variant={getStatusVariant(displayedStatus)} 
                                className={cn(
                                    "flex items-center gap-1 w-fit text-xs", 
                                    displayedStatus === 'In Progress' && 'bg-success/20 text-green-800 border-success'
                                )}
                                >
                                <Circle className={cn("h-2 w-2", getStatusColor(displayedStatus))}/>
                                {displayedStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <JobChatButton 
                                        jobId={job.id} 
                                        jobLocation={job.location}
                                    />
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
                                    <DropdownMenuItem onClick={() => setJobToComplete(job)}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Completed
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
                                </div>
                            </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
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
      
      <AlertDialog open={!!jobToComplete} onOpenChange={(open) => !open && setJobToComplete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Complete Job?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to mark the job <span className="font-semibold">{jobToComplete?.jobNumber}</span> as completed? This will move it to the past jobs list.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCompleteJob}>
                    Complete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
