
'use client';
import { useParams, useRouter } from 'next/navigation';
import { Job } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, Timestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { LoaderCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const requestId = params.id as string;
  const firestore = useFirestore();

  const [isApproving, setIsApproving] = useState(false);

  const jobRequestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, 'job_packs', requestId);
  }, [firestore, requestId]);
  const { data: jobRequest, isLoading: isLoadingRequest } = useDoc<Job>(jobRequestRef);

  const handleApprove = async () => {
    if (!firestore || !jobRequest) {
      toast({
        title: 'Error',
        description: 'Job request data is not available.',
        variant: 'destructive',
      });
      return;
    }
    setIsApproving(true);

    const jobsCollectionRef = collection(firestore, 'job_packs');
    
    // Query for the latest job number to prevent race conditions
    const latestJobQuery = query(jobsCollectionRef, orderBy('jobNumber', 'desc'), limit(1));
    const jobSnapshot = await getDocs(latestJobQuery);

    let newJobNumber;
    if (jobSnapshot.empty) {
        // If there are no jobs, start with the first number
        newJobNumber = 'TF-0001';
    } else {
        // Get the latest job number and increment it
        const latestJob = jobSnapshot.docs[0].data() as Job;
        const latestJobNumStr = latestJob.jobNumber.replace('TF-', '');
        const latestJobNum = parseInt(latestJobNumStr, 10);
        newJobNumber = `TF-${String(latestJobNum + 1).padStart(4, '0')}`;
    }

    const updatedJob = {
      ...jobRequest,
      status: 'Upcoming' as Job['status'],
      jobNumber: newJobNumber,
    };

    const jobDocRef = doc(firestore, 'job_packs', jobRequest.id);
    setDocumentNonBlocking(jobDocRef, updatedJob, { merge: true });

    toast({
      title: 'Job Approved',
      description: `Job ${newJobNumber} has been created and moved to the main jobs list.`,
    });
    router.push('/jobs');
  };

  if (isLoadingRequest || !jobRequest) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const startDate = jobRequest.startDate instanceof Timestamp ? jobRequest.startDate.toDate() : new Date(jobRequest.startDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Job Request</CardTitle>
        <CardDescription>Review the details below and approve this request to convert it into a job.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <h3 className="font-semibold text-lg">Client Submitted Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Client</p>
              <p>{jobRequest.clientName}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Location</p>
              <p>{jobRequest.location}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Requested Start Date</p>
              <p>{format(startDate, 'PPP')}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Setup Type</p>
              <p>{jobRequest.setupType === 'Other' ? jobRequest.otherSetupType : jobRequest.setupType}</p>
            </div>
            <div className="col-span-full">
              <p className="font-medium text-muted-foreground">Job Description</p>
              <p className="whitespace-pre-wrap">{jobRequest.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Job Number</Label>
          <div className="flex h-10 w-full items-center rounded-md border border-dashed bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Will be automatically generated upon approval...
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/requests')}>Cancel</Button>
        <Button onClick={handleApprove} disabled={isApproving}>
          {isApproving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Approve and Create Job
        </Button>
      </CardFooter>
    </Card>
  );
}
