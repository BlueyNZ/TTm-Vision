
'use client';
import { useRouter } from 'next/navigation';
import { Job, Staff, Client } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, setDoc } from 'firebase/firestore';
import { collection, Timestamp, getDocs, doc, query, where } from 'firebase/firestore';
import { StaffSelector } from '@/components/staff/staff-selector';
import { useTenant } from '@/contexts/tenant-context';
import { X, Calendar as CalendarIcon, LoaderCircle, Upload, File as FileIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ClientSelector } from '@/components/clients/client-selector';
import { LocationAutocompleteInput } from '@/components/jobs/location-autocomplete-input';
import { uploadFile } from '@/ai/flows/upload-file-flow';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { FileUploadInput } from '@/components/jobs/file-upload-input';

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

export default function JobCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { tenantId } = useTenant();
  
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
  const [uploadProgress, setUploadProgress] = useState<{ tmp?: number; wap?: number }>({});
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);


  const staffCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'staff'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  const { data: staffList } = useCollection<Staff>(staffCollection);

  const clientsCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'clients'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CRITICAL: Validate tenantId first
    if (!tenantId) {
        toast({
            title: 'Organization Error',
            description: 'Unable to determine your organization. Please refresh and try again.',
            variant: 'destructive',
        });
        return;
    }
    
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
    
    // Validate file sizes (max 50MB each)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (tmpFile && tmpFile.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'TMP file must be smaller than 50MB.',
        variant: 'destructive',
      });
      return;
    }
    if (wapFile && wapFile.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'WAP file must be smaller than 50MB.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    setUploadErrors([]);

    const jobsCollectionRef = collection(firestore, 'job_packs');
    
    // Job number prefix - change this to customize your job numbers
    const JOB_PREFIX = 'TMV';
    
    // Get all existing job numbers to find the highest number
    const jobSnapshot = await getDocs(jobsCollectionRef);
    const existingJobNumbers = jobSnapshot.docs
      .map(doc => doc.data().jobNumber as string)
      .filter(num => num && num.startsWith(`${JOB_PREFIX}-`))
      .map(num => parseInt(num.replace(`${JOB_PREFIX}-`, ''), 10))
      .filter(num => !isNaN(num));
    
    // Find the highest job number and add 1, or start at 1 if no jobs exist
    const maxJobNumber = existingJobNumbers.length > 0 ? Math.max(...existingJobNumbers) : 0;
    const newJobNumber = `${JOB_PREFIX}-${String(maxJobNumber + 1).padStart(4, '0')}`;

    const coordinates = await getCoordinates(location);

    const docRef = doc(jobsCollectionRef);

    const newJob: Omit<Job, 'id'> = {
        tenantId: tenantId!,
        jobNumber: newJobNumber,
        name,
        location,
        coordinates: coordinates || undefined,
        clientName: selectedClient?.name || '',
        clientId: selectedClient?.id || '',
        startDate: Timestamp.fromDate(startDate),
        ...(endDate && { endDate: Timestamp.fromDate(endDate) }),
        startTime,
        siteSetupTime,
        status: 'Upcoming',
        stms: selectedStms?.name || null,
        stmsId: selectedStms?.id || null,
        tcs: selectedTcs.map(tc => ({id: tc.id, name: tc.name })),
    };
    
    try {
        // Create job document first
        await setDoc(docRef, newJob);
        toast({
          title: 'Job Created',
          description: `Job ${newJobNumber} has been created. Uploading files...`,
        });

        // Upload files in parallel with progress tracking
        const uploadPromises: Promise<{type: 'tmp' | 'wap', url?: string}[]>[] = [];
        const errors: string[] = [];

        if (tmpFile) {
            uploadPromises.push(
              (async () => {
                try {
                  setUploadProgress(prev => ({...prev, tmp: 10}));
                  const fileData = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(tmpFile);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                  });
                  setUploadProgress(prev => ({...prev, tmp: 50}));
                  
                  const result = await uploadFile({
                      filePath: `jobs/${docRef.id}/tmp/${tmpFile.name}`,
                      fileData,
                      fileName: tmpFile.name,
                      fileType: tmpFile.type,
                  });
                  setUploadProgress(prev => ({...prev, tmp: 100}));
                  return [{type: 'tmp' as const, url: result.downloadUrl}];
                } catch (err) {
                  errors.push(`Failed to upload TMP file: ${err instanceof Error ? err.message : 'Unknown error'}`);
                  return [{type: 'tmp' as const}];
                }
              })()
            );
        }
        
        if (wapFile) {
            uploadPromises.push(
              (async () => {
                try {
                  setUploadProgress(prev => ({...prev, wap: 10}));
                  const fileData = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(wapFile);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                  });
                  setUploadProgress(prev => ({...prev, wap: 50}));
                  
                  const result = await uploadFile({
                      filePath: `jobs/${docRef.id}/wap/${wapFile.name}`,
                      fileData,
                      fileName: wapFile.name,
                      fileType: wapFile.type,
                  });
                  setUploadProgress(prev => ({...prev, wap: 100}));
                  return [{type: 'wap' as const, url: result.downloadUrl}];
                } catch (err) {
                  errors.push(`Failed to upload WAP file: ${err instanceof Error ? err.message : 'Unknown error'}`);
                  return [{type: 'wap' as const}];
                }
              })()
            );
        }

        if (uploadPromises.length > 0) {
          const results = await Promise.all(uploadPromises);
          const updatePayload: Partial<Job> = {};
          
          results.forEach(resultArray => {
            resultArray.forEach(result => {
              if (result.type === 'tmp' && result.url) updatePayload.tmpUrl = result.url;
              if (result.type === 'wap' && result.url) updatePayload.wapUrl = result.url;
            });
          });

          if (Object.keys(updatePayload).length > 0) {
              setDocumentNonBlocking(docRef, updatePayload, { merge: true });
          }
        }

        if (errors.length > 0) {
          setUploadErrors(errors);
          toast({
            title: 'Job Created with Warnings',
            description: `Job ${newJobNumber} was created but some files failed to upload. You can upload them later from the job details page.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: `Job ${newJobNumber} created and files uploaded successfully.`,
          });
        }
        
        setTimeout(() => router.push(`/jobs`), 1500);

    } catch (error) {
        console.error("Error creating job:", error)
        toast({ 
          variant: 'destructive', 
          title: 'Creation Failed', 
          description: error instanceof Error ? error.message : 'Could not create job document.' 
        });
    } finally {
        setIsSubmitting(false);
        setUploadProgress({});
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
            <div>
              <Label className="text-base font-semibold">Paperwork Files</Label>
              <p className="text-sm text-muted-foreground mt-1">Upload TMP (Traffic Management Plan) and WAP (Work At Height Plan) documents for this job.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUploadInput
                id="tmp-upload"
                label="TMP Paperwork"
                onFileSelected={setTmpFile}
                selectedFile={tmpFile}
                disabled={isSubmitting}
              />
              <FileUploadInput
                id="wap-upload"
                label="WAP Paperwork"
                onFileSelected={setWapFile}
                selectedFile={wapFile}
                disabled={isSubmitting}
              />
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
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Saving and uploading...' : 'Create Job'}
            </Button>
            {uploadErrors.length > 0 && (
              <div className="absolute bottom-20 right-4 bg-destructive/10 border border-destructive rounded-md p-3 max-w-xs">
                <p className="text-sm font-medium text-destructive">Upload Errors:</p>
                {uploadErrors.map((error, i) => (
                  <p key={i} className="text-xs text-destructive/80">{error}</p>
                ))}
              </div>
            )}
        </CardFooter>
      </Card>
    </form>
  );
}
