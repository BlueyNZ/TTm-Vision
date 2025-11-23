
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
import { collection, doc, Timestamp } from 'firebase/firestore';
import { StaffSelector } from '@/components/staff/staff-selector';
import { X, LoaderCircle, Calendar as CalendarIcon, Upload, File as FileIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ClientSelector } from '@/components/clients/client-selector';
import { LocationAutocompleteInput } from '@/components/jobs/location-autocomplete-input';
import { uploadFile } from '@/ai/flows/upload-file-flow';

async function getCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
  if (typeof window === 'undefined' || !window.google) return null;
  
  const geocoder = new window.google.maps.Geocoder();
  try {
    const results = await geocoder.geocode({ address });
    if (results.results[0]) {
      const { lat, lng } = results.results[0].geometry.location;
      return { lat: lat(), lng: lng() };
    }
  } catch (error) {
    console.error(`Geocode was not successful for the following reason: ${error}`);
  }
  return null;
}

// Helper to convert file to base64 data URL
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });


export default function JobEditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const firestore = useFirestore();

  const [jobName, setJobName] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [siteSetupTime, setSiteSetupTime] = useState('');
  const [jobStatus, setJobStatus] = useState<Job['status'] | undefined>();
  const [selectedStms, setSelectedStms] = useState<Staff | null>(null);
  const [selectedTcs, setSelectedTcs] = useState<Staff[]>([]);
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [tmpFile, setTmpFile] = useState<File | null>(null);
  const [wapFile, setWapFile] = useState<File | null>(null);
  const [tmpUrl, setTmpUrl] = useState<string | null>(null);
  const [wapUrl, setWapUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);


  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);
  const { data: job, isLoading: isLoadingJob } = useDoc<Job>(jobRef);

  const staffCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);
  const { data: staffList } = useCollection<Staff>(staffCollection);

  const clientsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'clients');
  }, [firestore]);
  const { data: clientList } = useCollection<Client>(clientsCollection);

  useEffect(() => {
    if (job) {
      setJobName(job.name);
      setJobLocation(job.location);
      if (job.clientId && clientList) {
        setSelectedClient(clientList.find(c => c.id === job.clientId) || null);
      } else if (job.clientName) {
        // Fallback for older data
        setSelectedClient({ id: '', name: job.clientName, status: 'Active' });
      }
      if (job.startDate) {
        setStartDate(job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate));
      }
      if (job.endDate) {
        setEndDate(job.endDate instanceof Timestamp ? job.endDate.toDate() : new Date(job.endDate));
      }
      setStartTime(job.startTime || '');
      setSiteSetupTime(job.siteSetupTime || '');
      setJobStatus(job.status);
      setContactPerson(job.contactPerson || '');
      setContactNumber(job.contactNumber || '');
      setTmpUrl(job.tmpUrl || null);
      setWapUrl(job.wapUrl || null);

      if (staffList) {
        const stms = staffList.find(s => s.id === job.stmsId);
        setSelectedStms(stms || null);
        const tcs = job.tcs.map(tc => staffList.find(s => s.id === tc.id)).filter((s): s is Staff => !!s);
        setSelectedTcs(tcs);
      }
    }
  }, [job, staffList, clientList]);

  
  const handleStatusChange = (value: Job['status']) => {
    setJobStatus(value);
  };

 const handleAddTc = (staff: Staff | null) => {
    if (staff && !selectedTcs.find(tc => tc.id === staff.id) && selectedStms?.id !== staff.id) {
        setSelectedTcs(prevTcs => [...prevTcs, staff]);
    }
  };

  const handleRemoveTc = (staffId: string) => {
    setSelectedTcs(selectedTcs.filter(tc => tc.id !== staffId));
  }

  const handleSelectStms = (staff: Staff | null) => {
    if (staff) {
        setSelectedStms(staff);
        // Remove from TCs if they are also selected there
        handleRemoveTc(staff.id);
    }
  }

  const handleRemoveStms = () => {
    setSelectedStms(null);
  }

  const handleFileUpload = async (file: File, type: 'tmp' | 'wap') => {
    if (!jobId) return;
    setIsUploading(true);
    try {
      const fileData = await toBase64(file);
      const result = await uploadFile({
          filePath: `jobs/${jobId}/${type}/${file.name}`,
          fileData,
          fileName: file.name,
          fileType: file.type,
      });

      if (type === 'tmp') {
        setTmpUrl(result.downloadUrl);
        setTmpFile(null);
      } else {
        setWapUrl(result.downloadUrl);
        setWapFile(null);
      }
      toast({ title: 'Upload Successful', description: `${file.name} has been uploaded.` });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload file.' });
    } finally {
      setIsUploading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !job || !startDate) {
        toast({
            title: 'Missing Information',
            description: 'Please select a start date for the job.',
            variant: 'destructive',
        });
        return;
    }
    if (typeof window === 'undefined' || !window.google?.maps?.places) {
      toast({
        title: 'Map service not ready',
        description: 'Please wait a moment for the map service to load and try again.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);

    const coordinates = await getCoordinates(jobLocation);

    const updatedJob: Partial<Job> = {
        name: jobName,
        location: jobLocation,
        coordinates,
        clientName: selectedClient?.name || '',
        clientId: selectedClient?.id || '',
        startDate: Timestamp.fromDate(startDate),
        startTime,
        siteSetupTime,
        status: jobStatus,
        stms: selectedStms?.name || null,
        stmsId: selectedStms?.id || null,
        tcs: selectedTcs.map(tc => ({ id: tc.id, name: tc.name })),
        contactPerson: contactPerson,
        contactNumber: contactNumber,
    };

    if (endDate) {
      updatedJob.endDate = Timestamp.fromDate(endDate);
    } else {
      updatedJob.endDate = undefined;
    }
    
    if (tmpUrl) updatedJob.tmpUrl = tmpUrl;
    if (wapUrl) updatedJob.wapUrl = wapUrl;

    const jobDocRef = doc(firestore, 'job_packs', job.id);
    setDocumentNonBlocking(jobDocRef, updatedJob, { merge: true });

    toast({
      title: 'Job Updated',
      description: `The details for ${jobLocation} have been saved.`,
    });
    router.push(`/jobs/${jobId}`);
    setIsSubmitting(false);
  };

  if (isLoadingJob || !job) {
    return (
        <div className="flex justify-center items-center h-64">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Job Pack</CardTitle>
          <CardDescription>Update the details for the job at {job.location}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <LocationAutocompleteInput
              initialValue={jobLocation}
              onPlaceSelected={(place) => {
                setJobLocation(place.formatted_address || '');
              }}
            />
            <p className="text-sm text-muted-foreground px-1">Please select an address from the dropdown to ensure correct map placement.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientName">Client / Company Name</Label>
            <ClientSelector
              clientList={clientList || []}
              selectedClient={selectedClient}
              onSelectClient={setSelectedClient}
              placeholder="Search or select a client..."
            />
            <p className="text-sm text-muted-foreground px-1">Type to search and press Enter to select a client.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="contactPerson">On-Site Contact Person</Label>
                <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="John Smith" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="contactNumber">On-Site Contact Number</Label>
                <Input id="contactNumber" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="021 123 4567" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Job Description</Label>
            <Textarea id="name" name="name" value={jobName} onChange={(e) => setJobName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="siteSetupTime">On Site</Label>
                <Input id="siteSetupTime" type="text" value={siteSetupTime} onChange={e => setSiteSetupTime(e.target.value)} placeholder="e.g. 19:00" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="startTime">Job Start Time</Label>
                <Input id="startTime" type="text" value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="e.g. 20:00" />
            </div>
          </div>
          <div className="space-y-4">
            <Label>TMP / WAP Files</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tmp-upload" className="text-sm font-medium">TMP Paperwork</Label>
                    <Input id="tmp-upload" type="file" onChange={(e) => setTmpFile(e.target.files?.[0] || null)} className="file:text-primary file:font-semibold"/>
                    {tmpFile && <Button type="button" size="sm" onClick={() => handleFileUpload(tmpFile, 'tmp')} disabled={isUploading}>{isUploading ? <LoaderCircle className="animate-spin" /> : <Upload />} Upload TMP</Button>}
                    {tmpUrl && <div className="text-sm text-green-600 flex items-center gap-2"><FileIcon className="h-4 w-4" /> <a href={tmpUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">View Uploaded TMP</a></div>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="wap-upload" className="text-sm font-medium">WAP Paperwork</Label>
                    <Input id="wap-upload" type="file" onChange={(e) => setWapFile(e.target.files?.[0] || null)} className="file:text-primary file:font-semibold"/>
                    {wapFile && <Button type="button" size="sm" onClick={() => handleFileUpload(wapFile, 'wap')} disabled={isUploading}>{isUploading ? <LoaderCircle className="animate-spin" /> : <Upload />} Upload WAP</Button>}
                    {wapUrl && <div className="text-sm text-green-600 flex items-center gap-2"><FileIcon className="h-4 w-4" /> <a href={wapUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">View Uploaded WAP</a></div>}
                </div>
            </div>
           </div>
           <div className="space-y-2">
            <Label>STMS</Label>
             <StaffSelector 
                staffList={staffList || []}
                onSelectStaff={handleSelectStms}
                placeholder="Select STMS"
                selectedStaff={selectedStms}
                disabledIds={[...selectedTcs.map(tc => tc.id), selectedStms?.id].filter(id => !!id) as string[]}
            />
            {selectedStms && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md mt-2">
                    <div className='flex items-center gap-3'>
                        <div>
                            <p className="font-medium text-sm">{selectedStms.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedStms.role}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRemoveStms}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
             )}
          </div>
          <div className="space-y-2">
            <Label>Traffic Controllers (TCs)</Label>
             <StaffSelector 
                staffList={staffList || []}
                onSelectStaff={handleAddTc}
                placeholder="Add a TC to the job"
                disabledIds={[selectedStms?.id, ...selectedTcs.map(tc => tc.id)].filter((id): id is string => !!id)}
             />
             <div className="space-y-2 pt-2">
                {selectedTcs.map(tc => (
                    <div key={tc.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className='flex items-center gap-3'>
                            <div>
                                <p className="font-medium text-sm">{tc.name}</p>
                                <p className="text-xs text-muted-foreground">{tc.role}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveTc(tc.id)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {selectedTcs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No traffic controllers assigned.</p>
                )}
             </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={handleStatusChange} value={jobStatus}>
                <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
