
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Staff, Job } from '@/lib/data';
import { useMemo } from 'react';
import { LoaderCircle, MapPin, Calendar, Circle } from 'lucide-react';
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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


export default function ClientDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const staffQuery = useMemoFirebase(() => {
        if (!firestore || !user?.email) return null;
        return query(collection(firestore, 'staff'), where('email', '==', user.email));
    }, [firestore, user?.email]);

    const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
    const currentUserStaffProfile = useMemo(() => staffData?.[0], [staffData]);
    
    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !currentUserStaffProfile?.name) return null;
        // This assumes the client's name in the staff profile matches the clientName in job_packs
        return query(collection(firestore, 'job_packs'), where('clientName', '==', currentUserStaffProfile.name));
    }, [firestore, currentUserStaffProfile?.name]);
    
    const { data: jobData, isLoading: isJobsLoading } = useCollection<Job>(jobsQuery);
    
    const isLoading = isUserLoading || isStaffLoading || isJobsLoading;

    return (
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
                                        <Link href={`/jobs/${job.id}`}>
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
                                                        displayedStatus === 'In Progress' && 'bg-success/20 text-green-800 border-success'
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
    );
}
