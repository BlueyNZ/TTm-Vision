
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Job, Staff } from "@/lib/data";
import { collection, Timestamp } from "firebase/firestore";
import { LoaderCircle, Circle, MapPin, Calendar, Users, UserSquare, ChevronDown } from "lucide-react";
import Link from "next/link";
import { format, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo } from "react";

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


  const assignedJobs = useMemo(() => {
    if (!user || !jobData || !staffData) return [];

    const currentStaffMember = staffData.find(staff => staff.name === user.displayName);
    if (!currentStaffMember) return [];

    return jobData.filter(job => {
        const isStms = job.stmsId === currentStaffMember.id;
        const isTc = job.tcs.some(tc => tc.id === currentStaffMember.id);
        return isStms || isTc;
    })
    .sort((a, b) => {
        const dateA = a.startDate instanceof Timestamp ? a.startDate.toDate() : new Date(a.startDate);
        const dateB = b.startDate instanceof Timestamp ? b.startDate.toDate() : new Date(b.startDate);
        return dateA.getTime() - dateB.getTime();
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
                                <div key={job.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex justify-between items-start">
                                    <Link href={`/jobs/${job.id}`} className="flex-grow">
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
                                        <div className="flex items-center gap-6 text-sm">
                                            {job.stms && (
                                                <div className="flex items-center gap-2">
                                                    <UserSquare className="h-4 w-4 text-muted-foreground" />
                                                    <p className="font-medium">STMS:</p>
                                                    <span className="text-muted-foreground">{job.stms}</span>
                                                </div>
                                            )}
                                            {job.tcs && job.tcs.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <p className="font-medium">TCs:</p>
                                                    <span className="text-muted-foreground">{job.tcs.length} assigned</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                     <div className="pl-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" onClick={(e) => e.stopPropagation()}>
                                                    Paperwork
                                                    <ChevronDown className="h-5 w-5 ml-2" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem className="border my-1">CREATE a Single Crew Timesheet</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Truck Inspection</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE ESTOP Inspection</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Stop/Go Briefing</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE TSL Decision Matrix</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Hazard ID (NZGTTM)</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Hazard ID</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Site Induction Signatures</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Pre-Installation Process</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE NEW On-Site Record</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Mobile Ops On-Site Record</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Job Note</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Incident or Event Report</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Site Audit (COPTTM SCR)</DropdownMenuItem>
                                                <DropdownMenuItem className="border my-1">CREATE Client Feedback</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
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
