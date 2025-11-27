
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { Job, Staff, MobileOpsRecord } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Trash, CheckCircle, Signature as SignatureIcon, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useRef, useState, useMemo } from "react";
import { SignaturePad, type SignaturePadRef } from "@/components/ui/signature-pad";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInMinutes, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { StaffSelector } from "@/components/staff/staff-selector";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const mobileOpsSchema = z.object({
  jobId: z.string(),
  date: z.date(),
  stmsId: z.string().min(1, "STMS is required."),
  stmsName: z.string(),
  vehicleRego: z.string().min(1, "Vehicle registration is required."),
  startTime: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i, "Invalid time format (e.g., 8:00 AM)"),
  finishTime: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i, "Invalid time format (e.g., 5:00 PM)"),
  vehicleChecks: z.object({
    lights: z.boolean().default(false),
    arrowBoard: z.boolean().default(false),
    beacon: z.boolean().default(false),
    ppe: z.boolean().default(false),
    firstAid: z.boolean().default(false),
  }).refine(data => Object.values(data).every(Boolean), { message: "All vehicle checks must be completed."}),
  siteChecks: z.object({
    allStaffInducted: z.boolean().default(false),
    toolboxTalk: z.boolean().default(false),
    emergencyProcedures: z.boolean().default(false),
  }).refine(data => Object.values(data).every(Boolean), { message: "All site checks must be confirmed."}),
  operatorSignatures: z.array(z.object({
    staffId: z.string(),
    staffName: z.string(),
    signatureDataUrl: z.string(),
  })).min(1, "At least one operator must sign."),
  stmsSignatureDataUrl: z.string().min(1, "STMS signature is required."),
});

const vehicleCheckItems = [
  { id: 'lights', label: 'Lights checked' },
  { id: 'arrowBoard', label: 'Arrow board checked' },
  { id: 'beacon', label: 'Beacon checked' },
  { id: 'ppe', label: 'PPE checked' },
  { id: 'firstAid', label: 'First aid kit checked' },
];

const siteCheckItems = [
  { id: 'allStaffInducted', label: 'All staff inducted onto site' },
  { id: 'toolboxTalk', label: 'Toolbox talk completed' },
  { id: 'emergencyProcedures', label: 'Emergency procedures communicated' },
]

function parse12HourTime(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s([AP]M)$/i);
  if (!match) return null;
  let [, hoursStr, minutesStr, ampm] = match;
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

export default function CreateMobileOpsRecordPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const editId = searchParams.get('edit');
  const viewId = searchParams.get('view');
  const formId = editId || viewId;
  const isEditMode = !!editId;
  const isViewMode = !!viewId;
  
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStms, setSelectedStms] = useState<Staff | null>(null);

  const jobRef = useMemoFirebase(() => (firestore && jobId) ? doc(firestore, 'job_packs', jobId) : null, [firestore, jobId]);
  const formRef = useMemoFirebase(() => (firestore && jobId && formId) ? doc(firestore, 'job_packs', jobId, 'mobile_ops_records', formId) : null, [firestore, jobId, formId]);
  
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: formToEdit, isLoading: isFormLoading } = useDoc<MobileOpsRecord>(formRef);
  
  const staffCollection = useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staffList, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  const form = useForm<z.infer<typeof mobileOpsSchema>>({
    resolver: zodResolver(mobileOpsSchema),
    defaultValues: {
      jobId: jobId,
      date: new Date(),
      stmsId: "",
      stmsName: "",
      vehicleRego: "",
      startTime: "",
      finishTime: "",
      vehicleChecks: { lights: false, arrowBoard: false, beacon: false, ppe: false, firstAid: false },
      siteChecks: { allStaffInducted: false, toolboxTalk: false, emergencyProcedures: false },
      operatorSignatures: [],
      stmsSignatureDataUrl: "",
    },
  });

  const { watch, setValue, control } = form;
  const { fields: operatorFields, append: appendOperator, remove: removeOperator } = useFieldArray({ control, name: "operatorSignatures" });
  
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [signatureTarget, setSignatureTarget] = useState<'stms' | { type: 'operator', staff: Staff } | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);

  const startTime = watch('startTime');
  const finishTime = watch('finishTime');
  const date = watch('date');

  const totalTime = useMemo(() => {
    const parsedStart = parse12HourTime(startTime);
    const parsedFinish = parse12HourTime(finishTime);
    if (!parsedStart || !parsedFinish || !date || !isValid(date)) return "0h 0m";

    const startDate = new Date(date);
    startDate.setHours(parsedStart.hours, parsedStart.minutes, 0, 0);

    const finishDate = new Date(date);
    finishDate.setHours(parsedFinish.hours, parsedFinish.minutes, 0, 0);

    if (finishDate <= startDate) finishDate.setDate(finishDate.getDate() + 1);

    const netMinutes = differenceInMinutes(finishDate, startDate);
    if (netMinutes < 0) return "0h 0m";
    const hours = Math.floor(netMinutes / 60);
    const minutes = netMinutes % 60;
    return `${hours}h ${minutes}m`;
  }, [startTime, finishTime, date]);

  useEffect(() => {
    if (formToEdit && staffList) {
      const stms = staffList.find(s => s.id === formToEdit.stmsId);
      setSelectedStms(stms || null);
      form.reset({
        ...formToEdit,
        date: formToEdit.date.toDate(),
      });
    }
  }, [formToEdit, staffList, form]);

  useEffect(() => {
    if (selectedStms) {
      setValue('stmsId', selectedStms.id);
      setValue('stmsName', selectedStms.name);
    }
  }, [selectedStms, setValue]);

  const handleOpenSignatureDialog = (target: 'stms' | { type: 'operator', staff: Staff }) => {
    setSignatureTarget(target);
    setIsSignatureDialogOpen(true);
  };

  const handleConfirmSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty() && signatureTarget) {
      const signatureDataUrl = signaturePadRef.current.toDataURL();
      if (signatureTarget === 'stms') {
        setValue('stmsSignatureDataUrl', signatureDataUrl, { shouldValidate: true });
      } else if (signatureTarget.type === 'operator') {
        const { staff } = signatureTarget;
        // Check if already signed
        const existingSignatureIndex = operatorFields.findIndex(op => op.staffId === staff.id);
        if (existingSignatureIndex === -1) {
          appendOperator({ staffId: staff.id, staffName: staff.name, signatureDataUrl });
        }
      }
      setIsSignatureDialogOpen(false);
      setSignatureTarget(null);
      signaturePadRef.current.clear();
    } else {
      toast({ title: "Signature Required", description: "Please provide a signature.", variant: "destructive" });
    }
  };

  async function onSubmit(data: z.infer<typeof mobileOpsSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      const payload: Omit<MobileOpsRecord, 'id' | 'createdAt'> = {
        ...data,
        date: Timestamp.fromDate(data.date),
        totalTime,
        stmsId: selectedStms!.id,
        stmsName: selectedStms!.name,
      };

      if (isEditMode && formId) {
        await setDoc(doc(firestore, 'job_packs', jobId, 'mobile_ops_records', formId), { ...payload, createdAt: formToEdit?.createdAt || serverTimestamp() }, { merge: true });
        toast({ title: "Record Updated" });
      } else {
        await addDoc(collection(firestore, 'job_packs', jobId, 'mobile_ops_records'), { ...payload, createdAt: serverTimestamp() });
        toast({ title: "Record Submitted" });
      }
      router.push(`/paperwork/${jobId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({ variant: 'destructive', title: "Submission Failed" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isJobLoading || isStaffLoading || isFormLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Mobile Ops On-Site Record</CardTitle>
          <CardDescription>For Job: {job?.jobNumber} at {job?.location}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Record Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isViewMode}>
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
                  <FormField control={control} name="stmsId" render={() => (
                    <FormItem>
                      <FormLabel>STMS</FormLabel>
                      <StaffSelector staffList={staffList?.filter(s => s.role === 'STMS') || []} selectedStaff={selectedStms} onSelectStaff={setSelectedStms} placeholder="Select STMS..." disabled={isViewMode} />
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={control} name="vehicleRego" render={({ field }) => (<FormItem><FormLabel>Vehicle Rego</FormLabel><FormControl><Input {...field} disabled={isViewMode}/></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={control} name="startTime" render={({ field }) => (<FormItem><FormLabel>Start Time</FormLabel><FormControl><Input placeholder="e.g. 8:00 AM" {...field} disabled={isViewMode}/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="finishTime" render={({ field }) => (<FormItem><FormLabel>Finish Time</FormLabel><FormControl><Input placeholder="e.g. 5:00 PM" {...field} disabled={isViewMode}/></FormControl><FormMessage /></FormItem>)} />
                    <FormItem><FormLabel>Total Time</FormLabel><div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">{totalTime}</div></FormItem>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Vehicle Checks</h3>
                 <FormField control={control} name="vehicleChecks" render={() => (
                    <FormItem>
                      {vehicleCheckItems.map(item => (
                        <FormField key={item.id} control={control} name={`vehicleChecks.${item.id as keyof typeof mobileOpsSchema.shape.vehicleChecks.shape}`} render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isViewMode}/></FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                      <FormMessage />
                    </FormItem>
                 )} />
              </div>
              
              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Site Checks</h3>
                 <FormField control={control} name="siteChecks" render={() => (
                    <FormItem>
                      {siteCheckItems.map(item => (
                        <FormField key={item.id} control={control} name={`siteChecks.${item.id as keyof typeof mobileOpsSchema.shape.siteChecks.shape}`} render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isViewMode}/></FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                      <FormMessage />
                    </FormItem>
                 )} />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Operator Signatures</h3>
                <div className="space-y-2">
                    {operatorFields.map((field, index) => (
                        <div key={field.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div className="flex items-center gap-3">
                                <Image src={field.signatureDataUrl} alt="Signature" width={100} height={40} className="bg-white rounded-sm" style={{ objectFit: 'contain' }}/>
                                <p className="font-medium">{field.staffName}</p>
                            </div>
                            {!isViewMode && <Button variant="ghost" size="icon" onClick={() => removeOperator(index)}><Trash className="h-4 w-4 text-destructive" /></Button>}
                        </div>
                    ))}
                </div>
                {!isViewMode && (
                    <>
                        <FormLabel>Add Operator Signature</FormLabel>
                        <StaffSelector 
                            staffList={staffList || []}
                            onSelectStaff={(staff) => staff && handleOpenSignatureDialog({ type: 'operator', staff })}
                            placeholder="Select operator to sign..."
                            disabledIds={operatorFields.map(f => f.staffId)}
                        />
                    </>
                )}
                <FormMessage>{form.formState.errors.operatorSignatures?.message || form.formState.errors.operatorSignatures?.root?.message}</FormMessage>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">STMS Sign Off</h3>
                <FormField control={control} name="stmsSignatureDataUrl" render={({ field }) => (
                    <FormItem>
                        <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenSignatureDialog('stms')} disabled={isViewMode}>
                            <SignatureIcon className="mr-2 h-4 w-4" />
                            {field.value ? "Update STMS Signature" : "Sign as STMS"}
                        </Button>
                        {field.value && <div className="p-2 border rounded-md bg-muted/50 flex justify-center"><Image src={field.value} alt="STMS Signature" width={200} height={80} style={{ objectFit: 'contain' }} className="bg-white" /></div>}
                        <FormMessage />
                    </FormItem>
                )} />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Back</Button>
              {!isViewMode && 
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? "Save Changes" : "Submit Record"}
                </Button>
              }
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Signature</DialogTitle>
            <DialogDescription>
                Sign in the box below to confirm your check.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4"><SignaturePad ref={signaturePadRef} /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => signaturePadRef.current?.clear()}>Clear</Button>
            <Button type="button" onClick={handleConfirmSignature}>Confirm Signature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
