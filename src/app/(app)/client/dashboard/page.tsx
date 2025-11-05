
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { Staff, Job } from '@/lib/data';
import { useMemo, useState } from 'react';
import { LoaderCircle, MapPin, Calendar, Circle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";


const getDisplayedStatus = (job: Job) => {
  if (job.status === 'Pending') {
    return 'Pending';
  }
  const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
  if (job.status === 'Upcoming' && isPast(startDate)) {
    return 'In Progress';
  }
  return job.status;
};

const getStatusVariant = (status: Job['status']) => {
  switch (status) {
    case 'Pending':
      return 'warning';
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
      case 'Pending':
        return 'fill-warning';
      default:
        return 'fill-muted-foreground';
    }
};


export default function ClientDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

    const staffQuery = useMemoFirebase(() => {
        if (!firestore || !user?.email) return null;
        return query(collection(firestore, 'staff'), where('email', '==', user.email));
    }, [firestore, user?.email]);

    const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
    const currentUserStaffProfile = useMemo(() => staffData?.[0], [staffData]);
    
    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !currentUserStaffProfile?.name) return null;
        return query(collection(firestore, 'job_packs'), where('clientName', '==', currentUserStaffProfile.name));
    }, [firestore, currentUserStaffProfile?.name]);
    
    const { data: jobData, isLoading: isJobsLoading } = useCollection<Job>(jobsQuery);
    
    const isLoading = isUserLoading || isStaffLoading || isJobsLoading;

    const handleDeleteJob = () => {
        if (!firestore || !jobToDelete) return;
        const jobDocRef = doc(firestore, 'job_packs', jobToDelete.id);
        deleteDocumentNonBlocking(jobDocRef);
        toast({
            title: "Job Request Deleted",
            description: `The request for ${jobToDelete.location} has been removed.`,
            variant: "destructive",
        });
        setJobToDelete(null);
    };

    return (
        <>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome, {currentUserStaffProfile?.name || 'Client'}!</CardTitle>
                    <CardDescription>This is your client portal. Here's an overview of your current and upcoming jobs.</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active Jobs</CardTitle>
                    <CardDescription>All jobs currently associated with your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <LoaderCircle className="h-8 w-8 animate-spin" />
                        </div>
                    ) : jobData && jobData.length > 0 ? (
                        <div className="space-y-4">
                            {jobData.map(job => {
                                const displayedStatus = getDisplayedStatus(job);
                                const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);

                                return (
                                    <div key={job.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <Link href={`/jobs/${job.id}`} className="flex-grow">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2">
                                                        <p className="font-semibold text-base flex items-center gap-2">
                                                            {job.jobNumber}
                                                        </p>
                                                        <p className="text-lg flex items-center gap-2">
                                                            <MapPin className="h-5 w-5 text-primary"/>
                                                            {job.location}
                                                        </p>
                                                    </div>
                                                    <Badge 
                                                        variant={getStatusVariant(displayedStatus)}
                                                        className={cn(
                                                            "flex items-center gap-2 w-fit", 
                                                            displayedStatus === 'In Progress' && 'bg-success/20 text-green-800 border-success',
                                                            displayedStatus === 'Pending' && 'bg-warning/20 text-yellow-800 border-warning'
                                                        )}
                                                    >
                                                        <Circle className={cn("h-2 w-2", getStatusColor(displayedStatus))}/>
                                                        {displayedStatus}
                                                    </Badge>
                                                </div>
                                                <div className="border-t my-3"></div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Calendar className="h-4 w-4"/>
                                                    {format(startDate, 'eeee, dd MMM yyyy')}
                                                </div>
                                            </Link>
                                            {job.status === 'Pending' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => setJobToDelete(job)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">You do not have any active jobs at the moment.</p>
                    )}
                </CardContent>
            </Card>
        </div>
        <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your job request for 
                    <span className="font-semibold"> {jobToDelete?.location}</span>.
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
