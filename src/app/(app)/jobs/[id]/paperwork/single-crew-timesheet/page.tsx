
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { Job, Staff } from "@/lib/data";
import { doc, query, collection, where, Timestamp } from "firebase/firestore";
import { useParams } from "next/navigation";
import { LoaderCircle, Trash, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMemo, useRef, useState, useEffect } from "react";
import { format, differenceInMinutes, parse } from 'date-fns';
import { SignaturePad, type SignaturePadRef } from "@/components/ui/signature-pad";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

const timesheetSchema = z.object({
  jobDate: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  finishTime: z.string().min(1, "Finish time is required"),
  breaks: z.string(),
  isStms: z.boolean(),
  isNightShift: z.boolean(),
  isMealAllowance: z.boolean(),
  isToolAllowance: z.boolean(),
  signatureDataUrl: z.string().min(1, "A signature is required to submit the timesheet."),
});


export default function SingleCrewTimesheetPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [totalHours, setTotalHours] = useState<string | null>(null);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'staff'), where('email', '==', user.email));
  }, [firestore, user?.email]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
  const currentStaffMember = useMemo(() => staffData?.[0], [staffData]);
  
  const form = useForm<z.infer<typeof timesheetSchema>>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      jobDate: job?.startDate instanceof Timestamp ? format(job.startDate.toDate(), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      startTime: '',
      finishTime: '',
      breaks: '30',
      isStms: false,
      isNightShift: false,
      isMealAllowance: false,
      isToolAllowance: false,
      signatureDataUrl: "",
    },
  });

  const startTime = form.watch("startTime");
  const finishTime = form.watch("finishTime");
  const breaks = form.watch("breaks");

  useEffect(() => {
    if (startTime && finishTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [finishH, finishM] = finishTime.split(':').map(Number);
      
      if (!isNaN(startH) && !isNaN(startM) && !isNaN(finishH) && !isNaN(finishM)) {
        let startDate = new Date();
        startDate.setHours(startH, startM, 0, 0);

        let finishDate = new Date();
        finishDate.setHours(finishH, finishM, 0, 0);

        if (finishDate < startDate) {
          // Handle overnight shift by adding a day to finish date
          finishDate.setDate(finishDate.getDate() + 1);
        }

        const totalMinutes = differenceInMinutes(finishDate, startDate);
        const breakMinutes = parseInt(breaks, 10) || 0;
        const workMinutes = totalMinutes - breakMinutes;

        if (workMinutes >= 0) {
            const hours = Math.floor(workMinutes / 60);
            const minutes = workMinutes % 60;
            setTotalHours(`${hours}h ${minutes}m`);
        } else {
            setTotalHours(null);
        }
      } else {
        setTotalHours(null);
      }
    } else {
      setTotalHours(null);
    }
  }, [startTime, finishTime, breaks]);
  
  const isLoading = isJobLoading || isUserLoading || isStaffLoading;

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

  function onSubmit(data: z.infer<typeof timesheetSchema>) {
    console.log(data);
    // Here you would submit the data to Firestore
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
              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Input value={currentStaffMember?.name} disabled />
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="jobDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
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
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="breaks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Breaks</FormLabel>
                          <FormControl>
                            <Input type="text" inputMode="numeric" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div></div>
                    <div></div>
                    <div className="space-y-2">
                          <Label>Total Hours</Label>
                          <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-medium">
                            {totalHours ? totalHours : '...'}
                          </div>
                    </div>
                </div>
            </div>

            <Separator />
            
            <div>
                <Label>Allowances</Label>
                <div className="space-y-2 mt-2">
                    <FormField
                      control={form.control}
                      name="isStms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>STMS Allowance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isNightShift"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Night Shift Allowance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="isMealAllowance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Meal Allowance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="isToolAllowance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Tool Allowance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                </div>
            </div>

            <Separator />
            
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
            <Button type="submit">Submit Timesheet</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    