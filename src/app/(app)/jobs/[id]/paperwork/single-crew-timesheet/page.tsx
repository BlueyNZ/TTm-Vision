
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, Staff, Timesheet } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Trash, CheckCircle, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useRef, useState, useMemo } from "react";
import { SignaturePad, type SignaturePadRef } from "@/components/ui/signature-pad";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInMinutes, isValid, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { StaffSelector } from "@/components/staff/staff-selector";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*([AP]M)$/i;

const timesheetSchema = z.object({
  jobId: z.string(),
  staffId: z.string().min(1, "Please select a staff member."),
  staffName: z.string(),
  jobDate: z.date(),
  startTime: z.string().regex(timeRegex, "Invalid time format (e.g., 6:30 AM)"),
  finishTime: z.string().regex(timeRegex, "Invalid time format (e.g., 5:00 PM)"),
  breaks: z.coerce.number().min(0, "Breaks cannot be negative."),
  notes: z.string().optional(),
  signatureDataUrl: z.string().min(1, "A signature is required to submit the timesheet."),
  role: z.enum(['STMS', 'TC/TTMW', 'TMO', 'Shadow Driver', 'Other Driver', 'Yard Work', 'Truck'], {
    required_error: "Please select a role.",
  }),
});

// Helper to parse 12-hour time with AM/PM to a 24-hour format
function parse12HourTime(timeStr: string): { hours: number, minutes: number } | null {
    const match = timeStr.match(timeRegex);
    if (!match) return null;

    let [_, hoursStr, minutesStr, ampm] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    ampm = ampm.toUpperCase();

    if (ampm === 'PM' && hours < 12) {
        hours += 12;
    } else if (ampm === 'AM' && hours === 12) { // Midnight case
        hours = 0;
    }

    return { hours, minutes };
}


export default function SingleCrewTimesheetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const editId = searchParams.get('edit');
  const viewId = searchParams.get('view');
  const timesheetId = editId || viewId;
  const isEditMode = !!editId;
  const isViewMode = !!viewId;

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);
  
  const timesheetRef = useMemoFirebase(() => {
    if (!firestore || !jobId || !timesheetId) return null;
    return doc(firestore, 'job_packs', jobId, 'timesheets', timesheetId);
  }, [firestore, jobId, timesheetId]);


  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: timesheetToEdit, isLoading: isTimesheetLoading } = useDoc<Timesheet>(timesheetRef);

  const staffCollection = useMemoFirebase(() => {
    if(!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);
  const { data: staffList, isLoading: isStaffListLoading } = useCollection<Staff>(staffCollection);


  const form = useForm<z.infer<typeof timesheetSchema>>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      jobId: jobId,
      jobDate: new Date(),
      startTime: "",
      finishTime: "",
      breaks: 30,
      notes: "",
      signatureDataUrl: "",
      role: undefined,
      staffId: "",
      staffName: "",
    },
  });
  
  const { watch, setValue } = form;
  const startTime = watch('startTime');
  const finishTime = watch('finishTime');
  const breaks = watch('breaks');
  const jobDate = watch('jobDate');

  const totalHours = useMemo(() => {
    const parsedStart = parse12HourTime(startTime);
    const parsedFinish = parse12HourTime(finishTime);
    
    if (!parsedStart || !parsedFinish) {
      return "0h 0m";
    }

    const startDate = new Date(jobDate);
    startDate.setHours(parsedStart.hours, parsedStart.minutes, 0, 0);

    const finishDate = new Date(jobDate);
    finishDate.setHours(parsedFinish.hours, parsedFinish.minutes, 0, 0);

    if (finishDate <= startDate) {
      finishDate.setDate(finishDate.getDate() + 1); // Handle overnight shifts
    }

    const totalMinutes = differenceInMinutes(finishDate, startDate);
    const netMinutes = totalMinutes - (breaks || 0);

    if (netMinutes < 0) return "0h 0m";
    
    const hours = Math.floor(netMinutes / 60);
    const minutes = netMinutes % 60;

    return `${hours}h ${minutes}m`;
  }, [startTime, finishTime, breaks, jobDate]);


  useEffect(() => {
    if (job && !timesheetId) {
      setValue('jobId', job.id);
      if (job.startDate) {
        const date = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
        if(isValid(date)) {
          setValue('jobDate', date);
        }
      }
    }
  }, [job, setValue, timesheetId]);

  useEffect(() => {
    if (timesheetId && timesheetToEdit && staffList) {
        const staffMember = staffList.find(s => s.id === timesheetToEdit.staffId);
        setSelectedStaff(staffMember || null);
        form.reset({
            jobId: timesheetToEdit.jobId,
            staffId: timesheetToEdit.staffId,
            staffName: timesheetToEdit.staffName,
            jobDate: timesheetToEdit.jobDate instanceof Timestamp ? timesheetToEdit.jobDate.toDate() : new Date(timesheetToEdit.jobDate),
            startTime: timesheetToEdit.startTime,
            finishTime: timesheetToEdit.finishTime,
            breaks: timesheetToEdit.breaks,
            notes: timesheetToEdit.notes,
            signatureDataUrl: timesheetToEdit.signatureDataUrl,
            role: timesheetToEdit.role,
        });
    }
  }, [timesheetId, timesheetToEdit, staffList, form]);
  
  useEffect(() => {
    if (selectedStaff) {
      setValue('staffId', selectedStaff.id, { shouldValidate: true });
      setValue('staffName', selectedStaff.name);
    } else if (!timesheetId) { // Prevent clearing on edit/view load
        setValue('staffId', '', { shouldValidate: true });
        setValue('staffName', '');
    }
  }, [selectedStaff, setValue, timesheetId]);


  const isLoading = isJobLoading || isUserLoading || isStaffListLoading || (!!timesheetId && isTimesheetLoading);

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
    form.setValue("signatureDataUrl", "", { shouldValidate: true });
  };

  const handleConfirmSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        const dataUrl = signaturePadRef.current.toDataURL();
        form.setValue("signatureDataUrl", dataUrl, { shouldValidate: true });
        setIsSignatureDialogOpen(false);
    } else {
        form.setError("signatureDataUrl", { type: "manual", message: "Please provide a signature before confirming." });
    }
  };

  async function onSubmit(data: z.infer<typeof timesheetSchema>) {
    if (!firestore || !jobId) return;

    setIsSubmitting(true);

    try {
        const timesheetPayload: Omit<Timesheet, 'id'> = {
            jobId: data.jobId,
            staffId: data.staffId,
            staffName: data.staffName,
            role: data.role,
            jobDate: Timestamp.fromDate(data.jobDate),
            startTime: data.startTime,
            finishTime: data.finishTime,
            breaks: data.breaks,
            totalHours: totalHours,
            notes: data.notes,
            signatureDataUrl: data.signatureDataUrl,
            createdAt: isEditMode && timesheetToEdit ? timesheetToEdit.createdAt : Timestamp.now(),
        };

        if (isEditMode && timesheetId) {
            const tsDocRef = doc(firestore, 'job_packs', jobId, 'timesheets', timesheetId);
            await setDoc(tsDocRef, timesheetPayload, { merge: true });
            toast({
                title: "Timesheet Updated",
                description: `Timesheet for ${data.staffName} has been successfully updated.`,
            });
        } else {
             const timesheetsCollectionRef = collection(firestore, 'job_packs', jobId, 'timesheets');
            await addDoc(timesheetsCollectionRef, timesheetPayload);
            toast({
                title: "Timesheet Submitted",
                description: `Timesheet for ${data.staffName} has been successfully submitted.`,
            });
        }

        router.push(`/jobs/${jobId}/paperwork`);

    } catch (error) {
        console.error("Error submitting timesheet:", error);
        toast({ title: "Submission Failed", description: "Could not submit timesheet. Please try again.", variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
}

  const signatureDataUrlValue = form.watch("signatureDataUrl");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit' : isViewMode ? 'View' : 'Single Crew'} Timesheet</CardTitle>
        <CardDescription>
          For Job: {job?.jobNumber || '...'} at {job?.location || '...'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">

             {/* Job Details Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Client Name</p>
                        <p className="text-sm">{job?.clientName || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Site Location</p>
                        <p className="text-sm">{job?.location || 'N/A'}</p>
                    </div>
                </div>
                 <FormField
                  control={form.control}
                  name="jobDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Timesheet Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isViewMode}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={isViewMode}/>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role for this timesheet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STMS">STMS</SelectItem>
                      <SelectItem value="TC/TTMW">TC/TTMW</SelectItem>
                      <SelectItem value="TMO">TMO</SelectItem>
                      <SelectItem value="Shadow Driver">Shadow Driver</SelectItem>
                      <SelectItem value="Other Driver">Other Driver</SelectItem>
                      <SelectItem value="Yard Work">Yard Work</SelectItem>
                      <SelectItem value="Truck">Truck</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Timesheet Details Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Timesheet Details</h3>
                <FormField
                    control={form.control}
                    name="staffId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Staff Name</FormLabel>
                             <StaffSelector 
                                staffList={staffList || []}
                                selectedStaff={selectedStaff}
                                onSelectStaff={setSelectedStaff}
                                placeholder="Select staff member..."
                                disabled={isViewMode}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="e.g., 6:30 AM" {...field} disabled={isViewMode}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="finishTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Finish Time</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="e.g., 5:00 PM" {...field} disabled={isViewMode}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="breaks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Breaks (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 30" {...field} disabled={isViewMode}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                        <Label>Total Hours</Label>
                        <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                            {totalHours}
                        </div>
                    </div>
                </div>
            </div>

             <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>STMS Notes</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Add any relevant notes for this timesheet..."
                            className="resize-y"
                            {...field}
                            disabled={isViewMode}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="signatureDataUrl"
                render={({ field }) => (
                    <FormItem>
                         <FormLabel>Sign Off</FormLabel>
                         <FormControl>
                           <div className="space-y-4">
                             <Dialog open={isSignatureDialogOpen} onOpenChange={isViewMode ? undefined : setIsSignatureDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full" disabled={isViewMode}>
                                        {signatureDataUrlValue ? (
                                            <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Timesheet Signed {isViewMode ? '' : '(Click to re-sign)'}</>
                                        ) : (
                                            "Sign Off Timesheet"
                                        )}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Sign Timesheet</DialogTitle>
                                        <DialogDescription>
                                            By signing, you confirm that the hours and allowances claimed are true and correct.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <SignaturePad 
                                            ref={signaturePadRef}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={handleClearSignature}>
                                            <Trash className="mr-2 h-4 w-4" />
                                            Clear
                                        </Button>
                                        <Button type="button" onClick={handleConfirmSignature}>
                                            Confirm Signature
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                             </Dialog>
                              {signatureDataUrlValue && (
                                <div className="p-4 border-dashed border-2 rounded-md flex justify-center items-center bg-muted/50">
                                    <Image src={signatureDataUrlValue} alt="Staff signature" width={200} height={80} style={{ objectFit: 'contain' }} className="bg-white shadow-sm"/>
                                </div>
                              )}
                           </div>
                         </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {isViewMode ? (
                <Button type="button" onClick={() => router.back()}>Back</Button>
            ) : (
                <>
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Save Changes' : 'Submit Timesheet'}
                    </Button>
                </>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
