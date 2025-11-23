
'use client';
import { useRouter } from 'next/navigation';
import { Job, Staff, Client } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState }from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, setDoc } from 'firebase/firestore';
import { collection, Timestamp, getDocs, doc } from 'firebase/firestore';
import { StaffSelector } from '@/components/staff/staff-selector';
import { X, Calendar as CalendarIcon, LoaderCircle, Upload, File as FileIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ClientSelector } from '@/components/clients/client-selector';
import { LocationAutocompleteInput } from '@/components/jobs/location-autocomplete-input';
import { uploadFile } from '@/firebase/storage';

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

export default function JobCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [location, setLocation] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [name, setName] = useState('Start Time:\nOn Site:\nSite Setup Time:\n\nJob Description:');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [siteSetupTime, setSiteSetupTime] = useState('');
  const [selectedStms, setSelectedStms] = useState<Staff | null>(null);
  const [selectedTcs, setSelectedTcs] = useState<Staff[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [tmpFile, setTmpFile] = useState<File | null>(null);
  const [wapFile, setWapFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);


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

  const handleAddTc = (staff: Staff | null) => {
    if (staff && !selectedTcs.find(tc => tc.id === staff.id) && selectedStms?.id !== staff.id) {
        setSelectedTcs([...selectedTcs, staff]);
    }
  };

  const handleRemoveTc = (staffId: string) => {
    setSelectedTcs(selectedTcs.filter(tc => tc.id !== staffId));
  }

  const handleSelectStms = (staff: Staff | null) => {
    if (staff) {
      setSelectedStms(staff);
      if (selectedTcs.some(tc => tc.id === staff.id)) {
        handleRemoveTc(staff.id);
      }
    }
  }

  const handleRemoveStms = () => {
    setSelectedStms(null);
  }

  const handleFileUpload = async (file: File, type: 'tmp' | 'wap', jobId: string) => {
    setIsUploading(true);
    try {
      const downloadUrl = await uploadFile(file, `jobs/${jobId}/${type}/${file.name}`);
      toast({ title: 'Upload Successful', description: `${file.name} has been uploaded.` });
      return downloadUrl;
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload file.' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !startDate) {
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

    const jobsCollectionRef = collection(firestore, 'job_packs');
    
    const jobSnapshot = await getDocs(jobsCollectionRef);
    const jobCount = jobSnapshot.size;
    const newJobNumber = `TF-${String(jobCount + 1).padStart(4, '0')}`;

    const coordinates = await getCoordinates(location);

    const newJob: Partial<Job> = {
        jobNumber: newJobNumber,
        name,
        location,
        coordinates,
        clientName: selectedClient?.name || '',
        clientId: selectedClient?.id || '',
        startDate: Timestamp.fromDate(startDate),
        startTime,
        siteSetupTime,
        status: 'Upcoming',
        stms: selectedStms?.name || null,
        stmsId: selectedStms?.id || null,
        tcs: selectedTcs.map(tc => ({id: tc.id, name: tc.name })),
    };
    
    if (endDate) {
        newJob.endDate = Timestamp.fromDate(endDate);
    }
    
    try {
        // Create the document first to get an ID
        const docRef = doc(jobsCollectionRef);

        // Upload files using the new ID
        if (tmpFile) {
            const uploadedUrl = await handleFileUpload(tmpFile, 'tmp', docRef.id);
            if(uploadedUrl) newJob.tmpUrl = uploadedUrl;
        }
        if (wapFile) {
            const uploadedUrl = await handleFileUpload(wapFile, 'wap', docRef.id);
            if(uploadedUrl) newJob.wapUrl = uploadedUrl;
        }
        
        // Now set the document with all the data
        await setDoc(docRef, newJob);

        toast({
        title: 'Job Created',
        description: `Job ${newJobNumber} at ${location} has been created.`,
        });
        router.push(`/jobs`);

    } catch (error) {
        console.error("Error creating job:", error)
        toast({ variant: 'destructive', title: 'Creation Failed', description: 'Could not create job document.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create New Job Pack</CardTitle>
          <CardDescription>Enter the details for the new job.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <LocationAutocompleteInput
              onPlaceSelected={(place) => {
                setLocation(place.formatted_address || '');
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
          <div className="space-y-2">
            <Label htmlFor="name">Job Description</Label>
            <Textarea id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Northbound lane closure for barrier repairs" />
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
                <Input id="siteSetupTime" type="text" value={siteSetupTime} onChange={e => setSiteSetupTime(e.target.value)} placeholder="e.g. 19:00"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="startTime">Job Start Time</Label>
                <Input id="startTime" type="text" value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="e.g. 20:00"/>
            </div>
          </div>
          <div className="space-y-4">
            <Label>TMP / WAP Files</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tmp-upload" className="text-sm font-medium">TMP Paperwork</Label>
                    <Input id="tmp-upload" type="file" onChange={(e) => setTmpFile(e.target.files?.[0] || null)} className="file:text-primary file:font-semibold"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="wap-upload" className="text-sm font-medium">WAP Paperwork</Label>
                    <Input id="wap-upload" type="file" onChange={(e) => setWapFile(e.target.files?.[0] || null)} className="file:text-primary file:font-semibold"/>
                </div>
            </div>
           </div>
           <div className="space-y-2">
            <Label>STMS</Label>
             <StaffSelector 
                staffList={staffList || []}
                onSelectStaff={handleSelectStms}
                placeholder="Select STMS"
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
        </CardContent>
        <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting || isUploading}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
