
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Job, Staff } from "@/lib/data";
import { collection, Timestamp } from "firebase/firestore";
import { LoaderCircle, Circle, MapPin, Calendar, Users, UserSquare } from "lucide-react";
import Link from "next/link";
import { format, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      return 'default';
    case 'In Progress':
      return 'default'; // Use default variant and custom class for color
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

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const jobsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'job_packs');
  }, [firestore]);
  const { data: jobData, isLoading: isJobsLoading } = useCollection<Job>(jobsCollection);

  const staffCollection = useMemoFirebase(() => {
    if(!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);
  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);


  const assignedJobs = useMemoFirebase(() => {
    if (!user || !jobData || !staffData) return [];

    // Find the staff member corresponding to the logged-in user
    const currentStaffMember = staffData.find(staff => staff.name === user.displayName);
    if (!currentStaffMember) return [];

    return jobData.filter(job => {
        const isStms = job.stmsId === currentStaffMember.id;
        const isTc = job.tcs.some(tc => tc.id === currentStaffMember.id);
        return isStms || isTc;
    });
  }, [user, jobData, staffData]);

  const isLoading = isUserLoading || isJobsLoading || isStaffLoading;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {user ? user.displayName || 'User' : 'User'}!</CardTitle>
            <CardDescription>
              Here's a quick look at what's happening.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>My Jobs</CardTitle>
                <CardDescription>Your assigned jobs.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                ) : assignedJobs.length > 0 ? (
                    <div className="space-y-4">
                        {assignedJobs.map(job => {
                            const displayedStatus = getDisplayedStatus(job);
                            const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);

                            return (
                                <Link href={`/jobs/${job.id}`} key={job.id} className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 space-y-2">
                                            <p className="font-semibold text-lg flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-primary"/>
                                                {job.location}
                                            </p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-4 w-4"/>
                                                {format(startDate, 'eeee, dd MMM yyyy')}
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
                                    <div className="border-t my-4"></div>
                                    <div className="space-y-3">
                                        {job.stms && (
                                            <div className="flex items-center gap-2">
                                                <UserSquare className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm font-medium">STMS:</p>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={`https://picsum.photos/seed/${job.stmsId}/200/200`} />
                                                        <AvatarFallback>{job.stms.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-muted-foreground">{job.stms}</span>
                                                </div>
                                            </div>
                                        )}
                                        {job.tcs && job.tcs.length > 0 && (
                                            <div className="flex items-start gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground mt-1" />
                                                <p className="text-sm font-medium">TCs:</p>
                                                <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                    {job.tcs.map(tc => (
                                                        <div key={tc.id} className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={`https://picsum.photos/seed/${tc.id}/200/200`} />
                                                                <AvatarFallback>{tc.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm text-muted-foreground">{tc.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-10">You are not currently assigned to any jobs.</p>
                )}
            </CardContent>
        </Card>

      </div>
    </TooltipProvider>
  );
}
