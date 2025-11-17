
'use client';
import { useRouter } from 'next/navigation';
import { Job, Staff, Client } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, LoaderCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientSelector } from '@/components/clients/client-selector';
import { LocationAutocompleteInput } from '@/components/jobs/location-autocomplete-input';

const newJobDescriptionTemplate = `Job Name / Client Ref: 
Location (Full Address): 
On-Site Time (Site Setup):
Site Setup Time:

Traffic Control Plan Ref: 
Required TTM Type:

Required Staff: Key Risk: `;

export default function RequestJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [location, setLocation] = useState('');
  const [description, setDescription] = useState(newJobDescriptionTemplate);
  const [requestedDate, setRequestedDate] = useState<Date | undefined>();
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [setupType, setSetupType] = useState<Job['setupType']>();
  const [otherSetupType, setOtherSetupType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const clientQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'clients'), where('userId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: clientData, isLoading: isClientLoading } = useCollection<Client>(clientQuery);

  const allClientsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'clients');
  }, [firestore]);

  const { data: allClients, isLoading: isAllClientsLoading } = useCollection<Client>(allClientsCollection);

  const associatedClient = useMemo(() => clientData?.[0], [clientData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const clientForJob = associatedClient || selectedClient;
    
    const missingFields = [];
    if (!clientForJob) missingFields.push('Client');
    if (!location) missingFields.push('Job Location');
    if (!requestedDate) missingFields.push('Requested Start Date');
    if (!setupType) missingFields.push('Setup Type');
    if (setupType === 'Other' && !otherSetupType) missingFields.push('Specify Setup');
    if (!contactPerson) missingFields.push('On-Site Contact Person');
    if (!contactNumber) missingFields.push('On-Site Contact Number');

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Information',
        description: `Please fill out the following required fields: ${missingFields.join(', ')}.`,
        variant: 'destructive',
      });
      return;
    }

    if (!firestore || !clientForJob) {
        toast({
            title: 'Error',
            description: 'Could not submit request. Client data not found.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSubmitting(true);

    const jobsCollectionRef = collection(firestore, 'job_packs');
    
    const newJobRequest: Omit<Job, 'id'> = {
      name: `Job request from ${clientForJob.name}`,
      location,
      description,
      clientName: clientForJob.name,
      clientId: clientForJob.id,
      startDate: Timestamp.fromDate(requestedDate!),
      startTime: '', 
      siteSetupTime: '',
      status: 'Pending',
      stms: null,
      stmsId: null,
      tcs: [],
      setupType: setupType,
      otherSetupType: setupType === 'Other' ? otherSetupType : '',
      jobNumber: '', 
      contactPerson: contactPerson,
      contactNumber: contactNumber,
    };

    addDocumentNonBlocking(jobsCollectionRef, newJobRequest);

    toast({
      title: 'Job Request Submitted',
      description: `Your request for ${location} has been sent for approval.`,
    });
    router.push('/client/dashboard');
    setIsSubmitting(false);
  };

  const isLoading = isUserLoading || isClientLoading || isAllClientsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Request New Job</CardTitle>
          <CardDescription>Fill out the form below to submit a new work request. We will review it and get back to you shortly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!associatedClient && (
            <div className="space-y-2">
              <Label htmlFor="clientName">Client / Company Name</Label>
              <ClientSelector
                clientList={allClients || []}
                selectedClient={selectedClient}
                onSelectClient={setSelectedClient}
                placeholder="Search or select a client..."
              />
              <p className="text-sm text-muted-foreground px-1">You are submitting as an admin. Please select the client for this job.</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="location">Job Location</Label>
            <LocationAutocompleteInput
              initialValue={location}
              onPlaceSelected={(place) => {
                setLocation(place.formatted_address || '');
              }}
            />
            <p className="text-sm text-muted-foreground px-1">Please select an address from the dropdown to ensure correct map placement.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the work required, including any specific requirements." required  className="min-h-[250px]"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="requestedDate">Requested Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !requestedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {requestedDate ? format(requestedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={requestedDate}
                    onSelect={setRequestedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Setup Type</Label>
              <Select onValueChange={(value: Job['setupType']) => setSetupType(value)} value={setupType}>
                  <SelectTrigger>
                      <SelectValue placeholder="Select setup type" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Stop-Go">Stop-Go</SelectItem>
                      <SelectItem value="Lane Shift">Lane Shift</SelectItem>
                      <SelectItem value="Shoulder">Shoulder Work</SelectItem>
                      <SelectItem value="Mobiles">Mobiles</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
              </Select>
            </div>
          </div>
          {setupType === 'Other' && (
             <div className="space-y-2">
                <Label htmlFor="otherSetupType">Please Specify Setup</Label>
                <Input id="otherSetupType" value={otherSetupType} onChange={(e) => setOtherSetupType(e.target.value)} placeholder="e.g., Full road closure" required />
              </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">On-Site Contact Person</Label>
              <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="John Smith" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">On-Site Contact Number</Label>
              <Input id="contactNumber" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="021 123 4567" required />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
