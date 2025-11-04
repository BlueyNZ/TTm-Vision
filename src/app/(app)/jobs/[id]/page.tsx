
'use client';
import { useParams } from 'next/navigation';
import { Job } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Info, MapPin, FileText, Edit, Users, UserSquare, LoaderCircle, Clock, ChevronDown, MessageSquare, Building } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sendJobSms } from '@/ai/flows/send-job-sms-flow';
import { useToast } from '@/hooks/use-toast';


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

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [formattedDate, setFormattedDate] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

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

  const handleSendSms = async () => {
    setIsSendingSms(true);
    try {
      const result = await sendJobSms({ jobId });
      if (result.success) {
        toast({
          title: "SMS Notifications Sent",
          description: `Successfully sent job details to ${result.messagesSent} crew member(s).`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Some SMS Notifications Failed",
          description: (
            <div>
              <p>Sent: {result.messagesSent}. Failed: {result.errors.length}.</p>
              <ul className="mt-2 list-disc list-inside">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          ),
          duration: 9000,
        });
      }
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Send SMS",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSendingSms(false);
    }
  };


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
                <p className="text-muted-foreground font-semibold">{job.jobNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/jobs/${job.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Job
              </Link>
            </Button>
            <Button onClick={handleSendSms} disabled={isSendingSms}>
              {isSendingSms ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="mr-2 h-4 w-4" />
              )}
              Send SMS to Crew
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Paperwork
                        <ChevronDown className="h-5 w-5 ml-2" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/single-crew-timesheet`}>Single Crew Timesheet</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/truck-inspection`}>Truck Inspection</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/estop-inspection`}>ESTOP Inspection</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/stop-go-briefing`}>Stop/Go Briefing</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/tsl-decision-matrix`}>TSL Decision Matrix</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/hazard-id-nzgttm`}>Hazard ID (NZGTTM)</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/hazard-id`}>Hazard ID</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/site-induction-signatures`}>Site Induction Signatures</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/pre-installation-process`}>Pre-Installation Process</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/new-on-site-record`}>NEW On-Site Record</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/mobile-ops-on-site-record`}>Mobile Ops On-Site Record</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/job-note`}>Job Note</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/incident-or-event-report`}>Incident or Event Report</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/site-audit-copttm-scr`}>Site Audit (COPTTM SCR)</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="border my-1"><Link href={`/jobs/${job.id}/paperwork/client-feedback`}>Client Feedback</Link></DropdownMenuItem>
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
                <Building className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Client</p>
                    <p className="text-muted-foreground">{job.clientName || 'N/A'}</p>
                </div>
            </div>
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
