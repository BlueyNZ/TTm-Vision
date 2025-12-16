
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Job, Staff } from "@/lib/data";
import { collection, Timestamp, query, where } from "firebase/firestore";
import { LoaderCircle, Circle, MapPin, Calendar, Users, UserSquare, ChevronDown, MessageSquare } from "lucide-react";
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
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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

const allPaperworkLinks = [
    { title: 'Timesheets', href: 'timesheets' },
    { title: 'Truck Inspections', href: 'truck-inspections' },
    { title: 'Hazard ID', href: 'hazard-id' },
    { title: 'Hazard ID (NZGTTM)', href: 'hazard-id-nzgttm' },
    { title: 'TMP Checking Process', href: 'pre-installation-process' },
    { title: 'On-Site Record (CoPTTM)', href: 'on-site-record' },
    { title: 'Mobile Ops On-Site Record', href: 'mobile-ops-on-site-record' },
    { title: 'Job Note', href: 'job-note' },
    { title: 'Take Site Photos', href: '#' }, // Assuming this is not a page yet
    { title: 'Incident or Event Report', href: 'incident-or-event-report' },
    { title: 'Site Audit (CoPTTM SCR)', href: 'site-audit-copttm-scr' },
];

const tcPaperworkLinks = allPaperworkLinks.filter(link => 
    ['Timesheets', 'Truck Inspections', 'Incident or Event Report'].includes(link.title)
);

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [persistedJobs, setPersistedJobs] = useState<Job[] | undefined>(undefined);
  const [persistedStaff, setPersistedStaff] = useState<Staff | undefined>(undefined);

  const jobsCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'job_packs'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  const { data: jobData, isLoading: isJobsLoading } = useCollection<Job>(jobsCollection);

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email || !tenantId) return null;
    return query(
      collection(firestore, 'staff'), 
      where('email', '==', user.email),
      where('tenantId', '==', tenantId)
    );
  }, [firestore, user?.email, tenantId]);
  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
  const currentStaffMember = useMemo(() => staffData?.[0], [staffData]);

  // Persist jobs and staff during Fast Refresh
  useEffect(() => {
    if (jobData && jobData.length > 0) {
      setPersistedJobs(jobData);
    }
  }, [jobData]);

  useEffect(() => {
    if (currentStaffMember) {
      setPersistedStaff(currentStaffMember);
    }
  }, [currentStaffMember]);

  // Use persisted data if current data is undefined
  const displayJobs = jobData || persistedJobs;
  const displayStaff = currentStaffMember || persistedStaff;

  const assignedJobs = useMemo(() => {
    if (!user || !displayJobs || !displayStaff) return [];

    console.log('🔍 Dashboard Debug:', {
      userEmail: user.email,
      staffId: displayStaff.id,
      staffName: displayStaff.name,
      totalJobs: displayJobs.length,
      jobs: displayJobs.map(j => ({
        jobNumber: j.jobNumber,
        location: j.location,
        stmsId: j.stmsId,
        stms: j.stms,
        tcs: j.tcs,
        tcIds: j.tcs?.map(tc => tc.id)
      }))
    });

    return displayJobs.filter(job => {
        const isStms = job.stmsId === displayStaff.id;
        const isTc = job.tcs.some(tc => tc.id === displayStaff.id);
        
        console.log(`Job ${job.jobNumber}:`, {
          isStms,
          isTc,
          jobStmsId: job.stmsId,
          staffId: displayStaff.id,
          matched: isStms || isTc
        });
        
        return isStms || isTc;
    })
    .sort((a, b) => {
        const dateA = a.startDate instanceof Timestamp ? a.startDate.toDate() : new Date(a.startDate);
        const dateB = b.startDate instanceof Timestamp ? b.startDate.toDate() : new Date(b.startDate);
        return dateB.getTime() - dateA.getTime();
    });
  }, [user, displayJobs, displayStaff]);

  const isLoading = isUserLoading || (isJobsLoading && !persistedJobs) || (isStaffLoading && !persistedStaff);
  
  const userRole = displayStaff?.role;
  const paperworkForUser = userRole === 'STMS' ? allPaperworkLinks : tcPaperworkLinks;


  return (
    <div className="flex flex-col gap-6 animate-in">
      <Card className="card-modern overflow-hidden">
        <div className="h-1 w-full gradient-primary"></div>
        <CardHeader className="text-center pb-8 pt-8">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome back, {displayStaff ? displayStaff.name : (user?.displayName || 'User')}!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Here's a quick look at what's happening today.
          </CardDescription>
        </CardHeader>
         <CardContent>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-sm">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-900 dark:text-blue-100">
              <span className="font-semibold">Found a bug or have a feature request?</span><br />
              <span className="text-xs text-blue-700 dark:text-blue-300">Please report it to help us improve TTM Vision!</span>
            </p>
          </div>
        </CardContent>
      </Card>

        <Card className="card-modern">
            <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">My Jobs</CardTitle>
                    <CardDescription>Your assigned jobs</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : assignedJobs.length > 0 ? (
                    <div className="space-y-3">
                        {assignedJobs.map(job => {
                            const displayedStatus = getDisplayedStatus(job);
                            const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);

                            return (
                                <div key={job.id} className="group p-4 border border-border/50 rounded-xl hover:border-primary/50 transition-all hover:shadow-md bg-card/50">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                                        <div className="flex-1 space-y-2">
                                          <Link href={`/jobs/${job.id}`} className="group-hover:text-primary transition-colors">
                                            <p className="font-semibold text-base sm:text-lg flex items-center gap-2">
                                                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0"/>
                                                <span className="line-clamp-2">{job.location}</span>
                                            </p>
                                          </Link>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                Job #{job.jobNumber}
                                            </p>
                                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                                                <span className="truncate">{format(startDate, 'eeee, dd MMM yyyy')}</span>
                                            </p>
                                        </div>
                                        <Badge 
                                            variant={getStatusVariant(displayedStatus)}
                                            className={cn(
                                                "flex items-center gap-2 w-fit h-fit text-xs sm:text-sm", 
                                                displayedStatus === 'In Progress' && 'bg-success/20 text-green-800 border-success'
                                            )}
                                        >
                                            <Circle className={cn("h-2 w-2", getStatusColor(displayedStatus))}/>
                                            {displayedStatus}
                                        </Badge>
                                    </div>
                                    <div className="border-t my-3 sm:my-4"></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                                            {job.stms && (
                                                <div className="flex items-center gap-2">
                                                    <UserSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                    <p className="font-medium">STMS:</p>
                                                    <span className="text-muted-foreground">{job.stms}</span>
                                                </div>
                                            )}
                                            {job.tcs && job.tcs.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                    <p className="font-medium">TCs:</p>
                                                    <span className="text-muted-foreground">{job.tcs.length} assigned</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <JobChatButton 
                                                jobId={job.id} 
                                                jobLocation={job.location}
                                                variant="outline"
                                                size="sm"
                                                showLabel={false}
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                                        <span className="hidden sm:inline">Paperwork</span>
                                                        <span className="sm:hidden">Forms</span>
                                                        <ChevronDown className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {paperworkForUser.map((link) => (
                                                        <DropdownMenuItem key={link.href} asChild>
                                                            <Link href={`/jobs/${job.id}/paperwork/${link.href}`}>
                                                                {link.title}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-10">You are not currently assigned to any jobs.</p>
                )}
            </CardContent>
        </Card>

      </div>
  );
}
