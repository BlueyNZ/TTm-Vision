
'use client';
import { useParams, useRouter } from 'next/navigation';
import { Job, Staff, Client } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, Timestamp, getDocs } from 'firebase/firestore';
import { LoaderCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const requestId = params.id as string;
  const firestore = useFirestore();

  const [jobNumber, setJobNumber] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const jobRequestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, 'job_packs', requestId);
  }, [firestore, requestId]);
  const { data: jobRequest, isLoading: isLoadingRequest } = useDoc<Job>(jobRequestRef);

  useEffect(() => {
    // Pre-fill job number when the request data loads
    const generateJobNumber = async () => {
      if (firestore && !jobRequest?.jobNumber) {
        const jobsCollectionRef = collection(firestore, 'job_packs');
        const jobSnapshot = await getDocs(jobsCollectionRef);
        const jobCount = jobSnapshot.size;
        const newJobNumber = `TF-${String(jobCount + 1).padStart(4, '0')}`;
        setJobNumber(newJobNumber);
      } else if (jobRequest?.jobNumber) {
        setJobNumber(jobRequest.jobNumber);
      }
    };
    generateJobNumber();
  }, [firestore, jobRequest]);

  const handleApprove = async () => {
    if (!firestore || !jobRequest || !jobNumber) {
      toast({
        title: 'Missing Information',
        description: 'A job number is required to approve the request.',
        variant: 'destructive',
      });
      return;
    }
    setIsApproving(true);

    const updatedJob = {
      ...jobRequest,
      status: 'Upcoming' as Job['status'], // Explicitly cast the status
      jobNumber: jobNumber,
    };

    const jobDocRef = doc(firestore, 'job_packs', jobRequest.id);
    setDocumentNonBlocking(jobDocRef, updatedJob, { merge: true });

    toast({
      title: 'Job Approved',
      description: `Job ${jobNumber} has been created and moved to the main jobs list.`,
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
        <CardDescription>Review the details below and assign a job number to approve this request.</CardDescription>
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
          <Label htmlFor="jobNumber">Job Number</Label>
          <Input 
            id="jobNumber" 
            value={jobNumber} 
            onChange={(e) => setJobNumber(e.target.value)} 
            placeholder="e.g. TF-0001" 
          />
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
