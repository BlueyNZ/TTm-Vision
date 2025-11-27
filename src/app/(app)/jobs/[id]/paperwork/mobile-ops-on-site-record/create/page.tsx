
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { Job, Staff, OnSiteRecordMobileOps } from "@/lib/data";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { StaffSelector } from "@/components/staff/staff-selector";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { JobSelector } from "@/components/jobs/job-selector";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const checkStatusSchema = z.enum(['OK', 'Not OK', 'N/A']);

const mobileOpsSchema = z.object({
  jobId: z.string(),
  tmpReference: z.string().min(1, 'TMP reference is required.'),
  date: z.date(),
  stmsId: z.string().min(1, "STMS is required."),
  stmsName: z.string(),
  stmsWarrantType: z.string().optional(),
  stmsTtmId: z.string().optional(),
  stmsWarrantExpiry: z.date().optional(),
  stmsSignature: z.string().min(1, 'STMS signature is required.'),
  stmsSignatureTime: z.string().min(1, 'Time is required.'),
  preStartCheckTime: z.string().min(1, 'Time is required.'),
  preStartSignature: z.string().min(1, 'Pre-start signature is required.'),
  checks: z.object({
    highVis: checkStatusSchema,
    beacons: checkStatusSchema,
    boards: checkStatusSchema,
    tma: checkStatusSchema,
    radios: checkStatusSchema,
    signs: checkStatusSchema,
  }),
  siteChecks: z.array(z.object({
    time: z.string().min(1, "Time is required"),
    distancesMaintained: z.boolean().default(false),
    positioningMaintained: z.boolean().default(false),
    boardsMaintained: z.boolean().default(false),
    roadClear: z.boolean().default(false),
    staticMaintained: z.boolean().default(false),
    safetyZonesMaintained: z.boolean().default(false),
    workingSpaceMaintained: z.boolean().default(false),
  })).optional()
});


const CheckItem = ({ form, name, label }: { form: any, name: string, label: string }) => (
    <div className="flex items-center justify-between rounded-md border p-4">
        <p className="font-medium text-sm">{label}</p>
        <FormField
            control={form.control}
            name={`checks.${name}`}
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4">
                            <FormItem className="flex items-center space-x-1.5"><FormControl><RadioGroupItem value="OK" /></FormControl><FormLabel className="text-xs font-normal">OK</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-1.5"><FormControl><RadioGroupItem value="Not OK" /></FormControl><FormLabel className="text-xs font-normal">Not OK</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-1.5"><FormControl><RadioGroupItem value="N/A" /></FormControl><FormLabel className="text-xs font-normal">N/A</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )}
        />
    </div>
);


export default function CreateMobileOpsRecordPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedStms, setSelectedStms] = useState<Staff | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signatureTarget, setSignatureTarget] = useState<'stms' | 'preStart' | null>(null);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const { data: allJobs, isLoading: areJobsLoading } = useCollection<Job>(useMemoFirebase(() => firestore ? collection(firestore, 'job_packs') : null, [firestore]));
  const { data: staffList, isLoading: areStaffLoading } = useCollection<Staff>(useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]));
  
  const form = useForm<z.infer<typeof mobileOpsSchema>>({
    resolver: zodResolver(mobileOpsSchema),
    defaultValues: {
      jobId: jobId,
      date: new Date(),
      tmpReference: "",
      stmsSignature: "",
      stmsSignatureTime: "",
      preStartCheckTime: "",
      preStartSignature: "",
      checks: {
        highVis: 'OK',
        beacons: 'OK',
        boards: 'OK',
        tma: 'OK',
        radios: 'OK',
        signs: 'OK',
      },
      siteChecks: []
    },
  });

  const { watch, setValue, control } = form;

  const { fields: siteCheckFields, append: appendSiteCheck, remove: removeSiteCheck } = useFieldArray({
    control,
    name: "siteChecks",
  });
  
  useEffect(() => {
    if (allJobs && jobId) {
      const job = allJobs.find(j => j.id === jobId);
      if(job) setSelectedJob(job);
    }
  }, [allJobs, jobId]);

  useEffect(() => {
    if (selectedStms) {
      setValue('stmsId', selectedStms.id);
      setValue('stmsName', selectedStms.name);
      // Logic to find and set warrant details
      const stmsCert = selectedStms.certifications.find(c => c.name.startsWith('STMS'));
      if (stmsCert) {
        setValue('stmsWarrantType', stmsCert.name);
        const expiry = stmsCert.expiryDate instanceof Timestamp ? stmsCert.expiryDate.toDate() : new Date(stmsCert.expiryDate);
        setValue('stmsWarrantExpiry', expiry);
      }
      setValue('stmsTtmId', selectedStms.nztaId || '');
    }
  }, [selectedStms, setValue]);

  const handleOpenSignatureDialog = (target: 'stms' | 'preStart') => {
    setSignatureTarget(target);
    setIsSignatureDialogOpen(true);
  };

  const handleConfirmSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signature = signaturePadRef.current.toDataURL();
      if (signatureTarget === 'stms') {
        setValue('stmsSignature', signature, { shouldValidate: true });
        setValue('stmsSignatureTime', format(new Date(), 'h:mm a'));
      } else if (signatureTarget === 'preStart') {
        setValue('preStartSignature', signature, { shouldValidate: true });
        setValue('preStartCheckTime', format(new Date(), 'h:mm a'));
      }
      setIsSignatureDialogOpen(false);
    } else {
      toast({ title: 'Signature Required', variant: 'destructive' });
    }
  };


  async function onSubmit(data: z.infer<typeof mobileOpsSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        date: Timestamp.fromDate(data.date),
        stmsWarrantExpiry: data.stmsWarrantExpiry ? Timestamp.fromDate(data.stmsWarrantExpiry) : null,
        operationRecords: [], // Placeholder for future
        comments: [], // Placeholder for future
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(firestore, 'job_packs', jobId, 'on_site_records_mobile_ops'), payload);
      toast({ title: "Record Submitted Successfully" });
      router.push(`/paperwork/${jobId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({ variant: 'destructive', title: "Submission Failed" });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const isLoading = areJobsLoading || areStaffLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>New On Site Record Mobile Operations</CardTitle>
          <CardDescription>On-site record must be completed and retained with the applied TMP for 12 months.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Job Details</h3>
                  <JobSelector jobs={allJobs || []} selectedJob={selectedJob} onSelectJob={(job) => {
                      setSelectedJob(job);
                      setValue('jobId', job?.id || '');
                  }} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
                      <div>
                          <p className="text-sm font-medium text-muted-foreground">Client Name</p>
                          <p className="text-sm">{selectedJob?.clientName || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-muted-foreground">Job Site Location</p>
                          <p className="text-sm">{selectedJob?.location || 'N/A'}</p>
                      </div>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="tmpReference" render={({ field }) => (<FormItem><FormLabel>TMP or generic plan reference</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Today's Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">STMS in Charge of Worksite</h3>
                <StaffSelector staffList={staffList?.filter(s => s.role === 'STMS') || []} selectedStaff={selectedStms} onSelectStaff={setSelectedStms} placeholder="Select STMS..." />
                {selectedStms && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormItem><Label>NZTA warrant</Label><Input value={watch('stmsWarrantType') || ''} disabled /></FormItem>
                    <FormItem><Label>TTM ID Number</Label><Input value={watch('stmsTtmId') || ''} disabled /></FormItem>
                    <FormItem><Label>NZTA warrant expiry date</Label><Input value={watch('stmsWarrantExpiry') ? format(watch('stmsWarrantExpiry')!, 'dd/MM/yyyy') : ''} disabled /></FormItem>
                  </div>
                )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <FormField control={form.control} name="stmsSignature" render={() => (
                      <FormItem>
                        <FormLabel>STMS Signature</FormLabel>
                        <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenSignatureDialog('stms')}>{watch('stmsSignature') ? "Update Signature" : "Sign Off"}</Button>
                         {watch('stmsSignature') && <div className="p-2 border rounded-md bg-muted/50 flex justify-center"><Image src={watch('stmsSignature')} alt="STMS Signature" width={200} height={80} style={{ objectFit: 'contain' }} className="bg-white" /></div>}
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormItem><Label>Time</Label><Input value={watch('stmsSignatureTime')} disabled /></FormItem>
                 </div>
              </div>
              
              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">In Charge STMS Pre-start Check</h3>
                <CheckItem form={form} name="highVis" label="High-visibility garments are fit for purpose, in an acceptable condition and worn correctly?" />
                <CheckItem form={form} name="beacons" label="Vehicle Xenon (or LED)/Beacons are fit for purpose?" />
                <CheckItem form={form} name="boards" label="LAS/RD6/AWVMS/VMS/Horizontal arrow boards are fit for purpose?" />
                <CheckItem form={form} name="tma" label="TMAs are fit for purpose" />
                <CheckItem form={form} name="radios" label="Two-way radios available, operating OK and batteries are fully charged" />
                <CheckItem form={form} name="signs" label="Correct signs for work operation are fitted to all vehicles and are fit for purpose" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-4">
                    <FormItem><Label>Time the check was completed</Label><Input value={watch('preStartCheckTime')} disabled /></FormItem>
                    <FormField control={form.control} name="preStartSignature" render={() => (
                      <FormItem>
                        <FormLabel>In charge STMS signature</FormLabel>
                        <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenSignatureDialog('preStart')}>{watch('preStartSignature') ? "Update Signature" : "Sign Off"}</Button>
                         {watch('preStartSignature') && <div className="p-2 border rounded-md bg-muted/50 flex justify-center"><Image src={watch('preStartSignature')} alt="Pre-start Signature" width={200} height={80} style={{ objectFit: 'contain' }} className="bg-white" /></div>}
                        <FormMessage />
                      </FormItem>
                    )} />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Operation Records</h3>
                  <p className="text-sm text-muted-foreground">This section will be automatically populated with data when you add them using the "Add Ops Record" button under "Quick Links".</p>
              </div>

              <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-semibold text-lg">Checks</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendSiteCheck({ time: format(new Date(), 'h:mm a'), distancesMaintained: true, positioningMaintained: true, boardsMaintained: true, roadClear: true, staticMaintained: true, safetyZonesMaintained: true, workingSpaceMaintained: true })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Check
                        </Button>
                    </div>
                    {siteCheckFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                             <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeSiteCheck(index)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                             <FormField
                                control={control}
                                name={`siteChecks.${index}.time`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time</FormLabel>
                                        <FormControl><Input placeholder="eg 10:30 AM" {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="space-y-2">
                                <FormField control={control} name={`siteChecks.${index}.distancesMaintained`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Distances between vehicles maintained</FormLabel></FormItem>)} />
                                <FormField control={control} name={`siteChecks.${index}.positioningMaintained`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Lateral positioning of vehicles maintained</FormLabel></FormItem>)} />
                                <FormField control={control} name={`siteChecks.${index}.boardsMaintained`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">LAS/RD6/AWVMS/VMS/Horizontal arrowboards continue to operate correctly</FormLabel></FormItem>)} />
                                <FormField control={control} name={`siteChecks.${index}.roadClear`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Road clear and available for planned work?</FormLabel></FormItem>)} />
                                <FormField control={control} name={`siteChecks.${index}.staticMaintained`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Static equipment maintained?</FormLabel></FormItem>)} />
                                <FormField control={control} name={`siteChecks.${index}.safetyZonesMaintained`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Safety zones maintained?</FormLabel></FormItem>)} />
                                <FormField control={control} name={`siteChecks.${index}.workingSpaceMaintained`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Working space adequate and maintained?</FormLabel></FormItem>)} />
                            </div>
                        </div>
                    ))}
                     {siteCheckFields.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No site checks added.</p>}
                </div>


              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Comments</h3>
                  <p className="text-sm text-muted-foreground">This section will be automatically populated with data when you add them using the "Add Comment" button under "Quick Links".</p>
              </div>


            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
       <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Signature</DialogTitle>
          </DialogHeader>
          <div className="py-4"><SignaturePad ref={signaturePadRef} /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => signaturePadRef.current?.clear()}>Clear</Button>
            <Button type="button" onClick={handleConfirmSignature}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
