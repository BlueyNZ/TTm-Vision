
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, Staff, Timesheet } from "@/lib/data";
import { doc, Timestamp, addDoc, collection } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Label } from "@/components/ui/label";


const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*([AP]M)$/i;

const timesheetSchema = z.object({
  jobId: z.string(),
  staffId: z.string(),
  staffName: z.string(),
  jobDate: z.date(),
  startTime: z.string().regex(timeRegex, "Invalid time format (e.g., 6:30 AM)"),
  finishTime: z.string().regex(timeRegex, "Invalid time format (e.g., 5:00 PM)"),
  breaks: z.coerce.number().min(0, "Breaks cannot be negative."),
  isStms: z.boolean().default(false),
  isNightShift: z.boolean().default(false),
  isMealAllowance: z.boolean().default(false),
  isToolAllowance: z.boolean().default(false),
  notes: z.string().optional(),
  signatureDataUrl: z.string().min(1, "A signature is required to submit the timesheet."),
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
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
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

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);

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
      startTime: "06:30 AM",
      finishTime: "05:00 PM",
      breaks: 30,
      isStms: false,
      isNightShift: false,
      isMealAllowance: false,
      isToolAllowance: false,
      notes: "",
      signatureDataUrl: "",
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
    if (job) {
      setValue('jobId', job.id);
      if (job.startDate) {
        const date = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
        if(isValid(date)) {
          setValue('jobDate', date);
        }
      }
    }
  }, [job, setValue]);
  
  useEffect(() => {
    if (selectedStaff) {
      setValue('staffId', selectedStaff.id);
      setValue('staffName', selectedStaff.name);
    }
  }, [selectedStaff, setValue]);


  const isLoading = isJobLoading || isUserLoading || isStaffListLoading;

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
            jobDate: Timestamp.fromDate(data.jobDate),
            startTime: data.startTime,
            finishTime: data.finishTime,
            breaks: data.breaks,
            totalHours: totalHours,
            isStms: data.isStms,
            isNightShift: data.isNightShift,
            isMealAllowance: data.isMealAllowance,
            isToolAllowance: data.isToolAllowance,
            signatureDataUrl: data.signatureDataUrl,
            createdAt: Timestamp.now(),
        };

        const timesheetsCollectionRef = collection(firestore, 'job_packs', jobId, 'timesheets');
        await addDoc(timesheetsCollectionRef, timesheetPayload);

        toast({
            title: "Timesheet Submitted",
            description: `Timesheet for ${data.staffName} has been successfully submitted.`,
        });

        router.push(`/paperwork/${jobId}`);

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
        <CardTitle>Single Crew Timesheet</CardTitle>
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
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            {/* Timesheet Details Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Timesheet Details</h3>
                <FormItem>
                    <FormLabel>Staff Name</FormLabel>
                    <StaffSelector 
                        staffList={staffList || []}
                        selectedStaff={selectedStaff}
                        onSelectStaff={setSelectedStaff}
                        placeholder="Select staff member..."
                    />
                    <FormMessage>{form.formState.errors.staffId?.message}</FormMessage>
                </FormItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="e.g., 6:30 AM" {...field} />
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
                            <Input type="text" placeholder="e.g., 5:00 PM" {...field} />
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
                            <Input type="number" placeholder="e.g. 30" {...field} />
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

            {/* Allowances Section */}
            <div className="space-y-4">
                 <h3 className="font-semibold text-lg border-b pb-2">Allowances</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                        control={form.control}
                        name="isStms"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>STMS</FormLabel>
                            </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isNightShift"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Night Shift</FormLabel>
                            </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isMealAllowance"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Meal</FormLabel>
                            </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isToolAllowance"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Tool</FormLabel>
                            </div>
                            </FormItem>
                        )}
                    />
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
                             <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        {signatureDataUrlValue ? (
                                            <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Timesheet Signed (Click to re-sign)</>
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
                                    <Image src={signatureDataUrlValue} alt="Staff signature" width={300} height={100} className="bg-white shadow-sm"/>
                                </div>
                              )}
                           </div>
                         </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Submit Timesheet
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
