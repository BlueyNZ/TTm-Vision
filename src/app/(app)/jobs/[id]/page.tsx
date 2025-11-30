
'use client';
import { useParams } from 'next/navigation';
import { Job } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Info, MapPin, FileText, Edit, Users, UserSquare, LoaderCircle, Clock, ChevronDown, MessageSquare, Building, Phone, Download } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sendJobSms } from '@/ai/flows/send-job-sms-flow';
import { useToast } from '@/hooks/use-toast';
import { openFileInNewTab } from '@/lib/file-utils';
import { JobChat } from '@/components/jobs/job-chat';


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
        let dateStr = '';
        const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
        dateStr = format(startDate, 'eeee, dd MMMM yyyy');

        if (job.endDate) {
            const endDate = job.endDate instanceof Timestamp ? job.endDate.toDate() : new Date(job.endDate);
            dateStr += ` - ${format(endDate, 'eeee, dd MMMM yyyy')}`;
        }
        setFormattedDate(dateStr);
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
                <UserSquare className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Site Contact</p>
                    <p className="text-muted-foreground">{job.contactPerson || 'Not specified'}</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Site Contact Number</p>
                    <p className="text-muted-foreground">{job.contactNumber || 'Not specified'}</p>
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
      
      {(job.tmpUrl || job.wapUrl) && (
        <Card>
          <CardHeader>
            <CardTitle>Paperwork Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.tmpUrl && (
              <Button 
                variant="default" 
                className="w-full justify-start"
                onClick={() => openFileInNewTab(job.tmpUrl!)}
              >
                <Download className="mr-2 h-4 w-4" />
                View TMP Paperwork
              </Button>
            )}
            {job.wapUrl && (
              <Button 
                variant="default" 
                className="w-full justify-start"
                onClick={() => openFileInNewTab(job.wapUrl!)}
              >
                <Download className="mr-2 h-4 w-4" />
                View WAP Paperwork
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Real-time Job Chat */}
      <JobChat jobId={job.id} jobLocation={job.location} />
    </div>
  );
}
