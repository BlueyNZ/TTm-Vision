
'use client';
import { useParams } from 'next/navigation';
import { Job, Staff } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Info, MapPin, FileText, Edit, Users, UserSquare, LoaderCircle, Clock, ChevronDown } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [formattedDate, setFormattedDate] = useState('');
  const firestore = useFirestore();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const { data: job, isLoading } = useDoc<Job>(jobRef);

  useEffect(() => {
    if (job?.startDate) {
        let date: Date;
        if (job.startDate instanceof Timestamp) {
            date = job.startDate.toDate();
        } else {
            date = new Date(job.startDate);
        }
        setFormattedDate(format(date, 'eeee, dd MMMM yyyy'));
    }
  }, [job]);


  if (isLoading || !job) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const displayedStatus = getDisplayedStatus(job);

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{job.location}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/jobs/${job.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Job
              </Link>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Paperwork
                        <ChevronDown className="h-5 w-5 ml-2" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Overview of the job assignment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Date</p>
                    <p className="text-muted-foreground">{formattedDate || 'Loading...'}</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Times</p>
                    <div className="text-muted-foreground">
                        <p>Site Setup: {job.siteSetupTime || 'Not Set'}</p>
                        <p>Job Start: {job.startTime || 'Not Set'}</p>
                    </div>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Info className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Status</p>
                    <Badge 
                      variant={getStatusVariant(displayedStatus)}
                      className={cn(
                        displayedStatus === 'In Progress' && 'bg-success/20 text-green-800 border-success'
                      )}
                    >
                      {displayedStatus}
                    </Badge>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Assigned Personnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-start gap-4">
                <UserSquare className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Site Traffic Management Supervisor (STMS)</p>
                    {job.stms ? (
                      <div className="flex items-center gap-3 mt-2">
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://picsum.photos/seed/${job.stmsId}/200/200`} />
                              <AvatarFallback>{job.stms.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-medium text-sm">{job.stms}</p>
                              <p className="text-xs text-muted-foreground">STMS</p>
                          </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-1">Not Assigned</p>
                    )}
                </div>
            </div>
            <div className="flex items-start gap-4">
                <Users className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Traffic Controllers (TCs)</p>
                    {job.tcs && job.tcs.length > 0 ? (
                      <div className="mt-2 space-y-3">
                        {job.tcs.map(tc => (
                          <div key={tc.id} className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                  <AvatarImage src={`https://picsum.photos/seed/${tc.id}/200/200`} />
                                  <AvatarFallback>{tc.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="font-medium text-sm">{tc.name}</p>
                                  <p className="text-xs text-muted-foreground">TC</p>
                              </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-1">No traffic controllers assigned.</p>
                    )}
                </div>
            </div>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
                <FileText className="h-6 w-6 text-primary" />
                <p className="text-muted-foreground whitespace-pre-wrap">{job.name}</p>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
