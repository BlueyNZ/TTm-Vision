
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, Staff, OnSiteRecord, TtmHandover, TtmDelegation, WorksiteMonitoring, TemporarySpeedLimit } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, query, orderBy, limit, getDocs, setDoc } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, PlusCircle, Trash, CheckCircle, Signature, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useCollection } from "@/firebase/firestore/use-collection";
import { StaffSelector } from "@/components/staff/staff-selector";
import { SignaturePad, SignaturePadRef } from "@/components/ui/signature-pad";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { format, isValid } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";


const handoverSchema = z.object({
  id: z.string().optional(),
  isExternal: z.boolean().default(false),
  receivingStmsId: z.string().optional(),
  receivingStmsName: z.string().min(1, "Receiving person's name is required."),
  receivingStmsNztaId: z.string().optional(),
  receivingStmsSignatureDataUrl: z.string().min(1, "Signature is required."),
  briefingCompleted: z.boolean().default(false).refine(val => val === true, {
    message: "Briefing must be confirmed."
  }),
});

const delegationSchema = z.object({
  id: z.string().optional(),
  isExternal: z.boolean().default(false),
  delegatedPersonId: z.string().min(1, "A staff member must be selected."),
  delegatedPersonName: z.string(),
  delegatedPersonNztaId: z.string().optional(),
  delegatedPersonSignatureDataUrl: z.string().min(1, "Signature is required."),
  briefingCompleted: z.boolean().default(false).refine(val => val === true, {
    message: "Briefing must be confirmed."
  }),
});

const worksiteMonitoringSchema = z.object({
  checkType: z.enum(['Site Set-Up', 'Site Check', 'Unattended/Removal']),
  dateTime: z.date(),
  signatureDataUrl: z.string().min(1, 'Signature is required.'),
  comments: z.string().min(1, 'Comments are required.'),
  isNextCheckRequired: z.enum(['Yes', 'No']).optional(),
});

const temporarySpeedLimitSchema = z.object({
  streetName: z.string().min(1, 'Street name is required.'),
  dateTimeInstalled: z.date(),
  dateTimeTslRemoved: z.date().optional(),
  tslSpeed: z.coerce.number().min(0, 'Speed must be a positive number.'),
  placementFrom: z.string().min(1, "Placement 'from' location is required."),
  placementTo: z.string().min(1, "Placement 'to' location is required."),
  lengthOfTsl: z.coerce.number().min(0, 'Length must be a positive number.'),
  dateTslRemainsInPlace: z.date().optional(),
});


const onSiteRecordSchema = z.object({
  jobId: z.string(),
  jobDate: z.date(),
  tmpNumber: z.string().optional(),
  stmsInChargeId: z.string().min(1, "STMS in charge is required."),
  stmsSignatureDataUrl: z.string().min(1, "STMS signature is required."),
  isStmsInChargeOfWorkingSpace: z.boolean().default(false),
  workingSpacePerson: z.string().optional(),
  workingSpaceContact: z.string().optional(),
  workingSpaceSignatureDataUrl: z.string().optional(),
  handovers: z.array(handoverSchema).optional(),
  delegations: z.array(delegationSchema).optional(),
  worksiteMonitoring: z.array(worksiteMonitoringSchema).optional(),
  temporarySpeedLimits: z.array(temporarySpeedLimitSchema).optional(),
}).refine(data => {
    if (data.isStmsInChargeOfWorkingSpace) return true;
    return !!data.workingSpacePerson && !!data.workingSpaceContact && !!data.workingSpaceSignatureDataUrl;
}, {
  message: "If STMS is not in charge, working space person, contact, and signature are required.",
  path: ["workingSpacePerson"], // you can point to any of the fields
});

const DateTimePicker = ({ value, onChange, disabled }: { value?: Date, onChange: (date: Date) => void, disabled?: boolean }) => {
  const [date, setDate] = useState<Date | undefined>(value);
  const [time, setTime] = useState(value && isValid(value) ? format(value, 'HH:mm') : '');

  useEffect(() => {
    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      if(!isNaN(hours) && !isNaN(minutes)) {
        const newDateTime = new Date(date);
        newDateTime.setHours(hours, minutes);
        onChange(newDateTime);
      }
    }
  }, [date, time, onChange]);

  useEffect(() => {
    if (value && isValid(value)) {
      setDate(value);
      setTime(format(value, 'HH:mm'));
    } else {
      setDate(undefined);
      setTime('');
    }
  }, [value]);
  
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !date && "text-muted-foreground")} disabled={disabled}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
        </PopoverContent>
      </Popover>
      <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-[120px]" disabled={disabled} />
    </div>
  );
};


type SignatureTarget =
  | { type: 'stms' }
  | { type: 'workingSpace' }
  | { type: 'handover'; index: number }
  | { type: 'delegation'; index: number }
  | { type: 'worksite'; index: number };


export default function NewOnSiteRecordPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget | null>(null);

  const jobRef = useMemoFirebase(() => (firestore && jobId) ? doc(firestore, 'job_packs', jobId) : null, [firestore, jobId]);
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);

  const staffCollection = useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staffList, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  const [selectedStms, setSelectedStms] = useState<Staff | null>(null);

  const form = useForm<z.infer<typeof onSiteRecordSchema>>({
    resolver: zodResolver(onSiteRecordSchema),
    defaultValues: {
      jobId: jobId,
      jobDate: new Date(),
      tmpNumber: "",
      isStmsInChargeOfWorkingSpace: false,
      stmsInChargeId: "",
      stmsSignatureDataUrl: "",
      workingSpaceSignatureDataUrl: "",
      handovers: [],
      delegations: [],
      worksiteMonitoring: [{ checkType: 'Site Set-Up', dateTime: new Date(), signatureDataUrl: '', comments: '', isNextCheckRequired: 'Yes' }],
      temporarySpeedLimits: [],
    },
  });

  const { watch, setValue, control, trigger, getValues } = form;
  const { fields: handoverFields, append: appendHandover, remove: removeHandover } = useFieldArray({ control, name: "handovers" });
  const { fields: delegationFields, append: appendDelegation, remove: removeDelegation } = useFieldArray({ control, name: "delegations" });
  const { fields: worksiteFields, append: appendWorksite, remove: removeWorksite } = useFieldArray({ control, name: "worksiteMonitoring" });
  const { fields: tslFields, append: appendTsl, remove: removeTsl } = useFieldArray({ control, name: "temporarySpeedLimits" });
  
  const isStmsInChargeOfWorkingSpace = watch('isStmsInChargeOfWorkingSpace');
  const stmsSignature = watch('stmsSignatureDataUrl');
  const workingSpaceSignature = watch('workingSpaceSignatureDataUrl');
  const handovers = watch('handovers');
  const delegations = watch('delegations');
  const worksiteMonitoring = watch('worksiteMonitoring');


  useEffect(() => {
    if (selectedStms) {
      setValue('stmsInChargeId', selectedStms.id);
    }
  }, [selectedStms, setValue]);

  useEffect(() => {
    if(job && getValues('jobDate').toDateString() === new Date().toDateString()) {
        const jobStartDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
        const formDate = getValues('jobDate');
        if (isValid(jobStartDate) && isValid(formDate) && formDate.toDateString() !== jobStartDate.toDateString()) {
          setValue('jobDate', jobStartDate);
        }
    }
  }, [job, setValue, getValues]);

  const handleOpenSignatureDialog = (target: SignatureTarget) => {
    setSignatureTarget(target);
    setIsSignatureDialogOpen(true);
  };

  const handleConfirmSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty() && signatureTarget) {
      const signatureDataUrl = signaturePadRef.current.toDataURL();

      switch (signatureTarget.type) {
        case 'stms':
          setValue('stmsSignatureDataUrl', signatureDataUrl, { shouldValidate: true });
          break;
        case 'workingSpace':
          setValue('workingSpaceSignatureDataUrl', signatureDataUrl, { shouldValidate: true });
          break;
        case 'handover':
          setValue(`handovers.${signatureTarget.index}.receivingStmsSignatureDataUrl`, signatureDataUrl, { shouldValidate: true });
          break;
        case 'delegation':
           setValue(`delegations.${signatureTarget.index}.delegatedPersonSignatureDataUrl`, signatureDataUrl, { shouldValidate: true });
           break;
        case 'worksite':
           setValue(`worksiteMonitoring.${signatureTarget.index}.signatureDataUrl`, signatureDataUrl, { shouldValidate: true });
           break;
      }

      setIsSignatureDialogOpen(false);
      setSignatureTarget(null);
      signaturePadRef.current.clear();
    } else {
        toast({ title: "Signature Required", description: "Please provide a signature.", variant: "destructive"})
    }
  };
  
  const handleAddWorksiteCheck = () => {
    const lastCheckIndex = worksiteFields.length - 1;
    if (lastCheckIndex < 0) { // If there are no checks yet, add a Site Set-Up
        appendWorksite({ checkType: 'Site Set-Up', dateTime: new Date(), signatureDataUrl: '', comments: '', isNextCheckRequired: 'Yes' });
        return;
    };
  
    const lastCheck = getValues(`worksiteMonitoring.${lastCheckIndex}`);
    const nextCheckType = lastCheck.isNextCheckRequired === 'No' ? 'Unattended/Removal' : 'Site Check';
    
    appendWorksite({
      checkType: nextCheckType,
      dateTime: new Date(),
      signatureDataUrl: '',
      comments: '',
      isNextCheckRequired: 'Yes'
    });
  }

  const showAddCheckButton = worksiteFields.length === 0 || worksiteFields[worksiteFields.length - 1]?.checkType !== 'Unattended/Removal';


  async function onSubmit(data: z.infer<typeof onSiteRecordSchema>) {
    console.log("Form data:", data);
    toast({ title: "Form is under construction.", description: "Saving is not yet implemented."});
  }

  const isLoading = isJobLoading || isStaffLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>On Site Record (CoPTTM)</CardTitle>
          <CardDescription>Edition 4, July 2020</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><span className="font-medium">Job No:</span> {job?.jobNumber}</p>
                  <p><span className="font-medium">Job Date:</span> {job?.startDate ? format(job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate), 'dd/MM/yyyy') : ''}</p>
                  <p className="md:col-span-2"><span className="font-medium">Client:</span> {job?.clientName}</p>
                  <p className="md:col-span-2"><span className="font-medium">Location:</span> {job?.location}</p>
                </div>
                <FormField control={form.control} name="tmpNumber" render={({ field }) => (<FormItem><FormLabel>TMP Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">TTM STMS</h3>
                   <FormField
                      control={form.control}
                      name="stmsInChargeId"
                      render={() => (
                          <FormItem>
                              <FormLabel>STMS in Charge</FormLabel>
                              <StaffSelector
                                  staffList={staffList?.filter(s => s.role === 'STMS') || []}
                                  selectedStaff={selectedStms}
                                  onSelectStaff={setSelectedStms}
                                  placeholder="Select STMS..."
                              />
                              {selectedStms && (
                                  <p className="text-sm text-muted-foreground">NZTA ID: {selectedStms.nztaId || 'N/A'}</p>
                              )}
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="stmsSignatureDataUrl"
                      render={() => (
                          <FormItem>
                            <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenSignatureDialog({ type: 'stms'})}>
                              <Signature className="mr-2 h-4 w-4" />
                              {stmsSignature ? "Update Signature" : "Sign as STMS in Charge"}
                            </Button>
                            {stmsSignature && <div className="p-2 border rounded-md bg-muted/50 flex justify-center"><Image src={stmsSignature} alt="STMS Signature" width={200} height={80} style={{ objectFit: 'contain' }} className="bg-white" /></div>}
                            <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>

              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Working Space</h3>
                  <FormField
                      control={control}
                      name="isStmsInChargeOfWorkingSpace"
                      render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                              <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                              <FormLabel>
                                  Tick if STMS is also in charge of Working Space
                              </FormLabel>
                          </div>
                          </FormItem>
                      )}
                  />
                  {!isStmsInChargeOfWorkingSpace && (
                      <div className="space-y-4 p-4 border rounded-md">
                          <FormField control={control} name="workingSpacePerson" render={({ field }) => (<FormItem><FormLabel>Person responsible for working space</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={control} name="workingSpaceContact" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField
                              control={control}
                              name="workingSpaceSignatureDataUrl"
                              render={() => (
                                <FormItem>
                                  <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenSignatureDialog({ type: 'workingSpace'})}>
                                    <Signature className="mr-2 h-4 w-4" />
                                    {workingSpaceSignature ? "Update Signature" : "Sign for Working Space"}
                                  </Button>
                                  {workingSpaceSignature && <div className="p-2 border rounded-md bg-muted/50 flex justify-center"><Image src={workingSpaceSignature} alt="Working Space Signature" width={200} height={80} style={{ objectFit: 'contain' }} className="bg-white" /></div>}
                                  <FormMessage />
                                </FormItem>
                              )}
                          />
                      </div>
                  )}
              </div>

              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">TTM STMS Handover</h3>
                  <div className="space-y-4">
                      {handoverFields.map((field, index) => {
                        const isExternal = watch(`handovers.${index}.isExternal`);
                        return (
                          <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeHandover(index)}>
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>

                              <FormField
                                control={control}
                                name={`handovers.${index}.isExternal`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel>Tick if Handover is to a person outside your company</FormLabel>
                                    </FormItem>
                                )}
                              />

                              {isExternal ? (
                                <FormField
                                  control={control}
                                  name={`handovers.${index}.receivingStmsName`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Name</FormLabel>
                                      <FormControl><Input placeholder="Enter name..." {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ) : (
                                <StaffSelector
                                    staffList={staffList?.filter(s => s.role === 'STMS') || []}
                                    onSelectStaff={(staff) => {
                                        if (staff) {
                                            setValue(`handovers.${index}.receivingStmsId`, staff.id, { shouldValidate: true });
                                            setValue(`handovers.${index}.receivingStmsName`, staff.name);
                                            setValue(`handovers.${index}.receivingStmsNztaId`, staff.nztaId || 'N/A');
                                        }
                                    }}
                                    placeholder="Select receiving STMS..."
                                    selectedStaff={staffList?.find(s => s.id === handovers?.[index]?.receivingStmsId)}
                                />
                              )}
                              
                              {watch(`handovers.${index}.receivingStmsName`) && !isExternal && (
                                <p className="text-sm text-muted-foreground px-1">NZTA ID: {watch(`handovers.${index}.receivingStmsNztaId`) || 'N/A'}</p>
                              )}
                              <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenSignatureDialog({ type: 'handover', index })}>
                                <Signature className="mr-2 h-4 w-4" />
                                {watch(`handovers.${index}.receivingStmsSignatureDataUrl`) ? "Update Signature" : "Sign for Handover"}
                              </Button>
                              {watch(`handovers.${index}.receivingStmsSignatureDataUrl`) && (
                                  <div className="p-2 border rounded-md bg-muted/50 flex justify-center">
                                      <Image src={watch(`handovers.${index}.receivingStmsSignatureDataUrl`)} alt="Handover Signature" width={200} height={80} style={{ objectFit: 'contain' }} className="bg-white"/>
                                  </div>
                              )}
                               <FormField
                                  control={control}
                                  name={`handovers.${index}.briefingCompleted`}
                                  render={({ field }) => (
                                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                      <FormControl>
                                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                          <FormLabel>Tick to confirm handover briefing completed (To be completed by the receiving STMS)</FormLabel>
                                      </div>
                                      </FormItem>
                                  )}
                              />
                          </div>
                        )
                      })}
                      <Button type="button" variant="outline" size="sm" onClick={() => appendHandover({ isExternal: false, receivingStmsId: '', receivingStmsName: '', briefingCompleted: false, receivingStmsSignatureDataUrl: '' })}>
                          <PlusCircle className="mr-2 h-4 w-4"/> Add Handover
                      </Button>
                  </div>
              </div>
              
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Delegation</h3>
                   <div className="space-y-4">
                      {delegationFields.map((field, index) => (
                          <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeDelegation(index)}>
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                              <StaffSelector
                                  staffList={staffList || []}
                                  onSelectStaff={(staff) => {
                                      if (staff) {
                                          setValue(`delegations.${index}.delegatedPersonId`, staff.id, { shouldValidate: true });
                                          setValue(`delegations.${index}.delegatedPersonName`, staff.name);
                                          setValue(`delegations.${index}.delegatedPersonNztaId`, staff.nztaId || 'N/A');
                                      }
                                  }}
                                  placeholder="Select person to delegate to..."
                                  selectedStaff={staffList?.find(s => s.id === delegations?.[index]?.delegatedPersonId)}
                              />
                               {watch(`delegations.${index}.delegatedPersonName`) && (
                                <p className="text-sm text-muted-foreground px-1">NZTA ID: {watch(`delegations.${index}.delegatedPersonNztaId`) || 'N/A'}</p>
                              )}
                              <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenSignatureDialog({ type: 'delegation', index })}>
                                <Signature className="mr-2 h-4 w-4" />
                                {watch(`delegations.${index}.delegatedPersonSignatureDataUrl`) ? "Update Signature" : "Sign for Delegation"}
                              </Button>
                              {watch(`delegations.${index}.delegatedPersonSignatureDataUrl`) && (
                                  <div className="p-2 border rounded-md bg-muted/50 flex justify-center">
                                      <Image src={watch(`delegations.${index}.delegatedPersonSignatureDataUrl`)} alt="Delegation Signature" width={200} height={80} style={{ objectFit: 'contain' }} className="bg-white"/>
                                  </div>
                              )}
                               <FormField
                                  control={control}
                                  name={`delegations.${index}.briefingCompleted`}
                                  render={({ field }) => (
                                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                      <FormControl>
                                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                          <FormLabel>Tick to confirm handover briefing completed</FormLabel>
                                      </div>
                                      </FormItem>
                                  )}
                              />
                          </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => appendDelegation({ delegatedPersonId: '', delegatedPersonName: '', briefingCompleted: false, delegatedPersonSignatureDataUrl: '' })}>
                          <PlusCircle className="mr-2 h-4 w-4"/> Add Delegation
                      </Button>
                  </div>
              </div>

               <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Worksite Monitoring</h3>
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Check Type</TableHead>
                          <TableHead className="min-w-[280px]">Date &amp; Time</TableHead>
                          <TableHead className="min-w-[150px]">Signature</TableHead>
                          <TableHead className="min-w-[200px]">Comments</TableHead>
                          <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {worksiteFields.map((field, index) => {
                          const signatureDataUrl = watch(`worksiteMonitoring.${index}.signatureDataUrl`);
                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Input value={field.checkType} disabled className="bg-muted"/>
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={control}
                                  name={`worksiteMonitoring.${index}.dateTime`}
                                  render={({ field }) => (
                                    <DateTimePicker {...field} />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                {signatureDataUrl ? (
                                    <div className="flex items-center gap-2">
                                        <Image src={signatureDataUrl} alt="Signature" width={100} height={40} style={{ objectFit: 'contain' }} className="bg-white rounded-sm border" />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setValue(`worksiteMonitoring.${index}.signatureDataUrl`, '', { shouldValidate: true })}
                                        >
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button type="button" variant="outline" onClick={() => handleOpenSignatureDialog({ type: 'worksite', index })}>
                                        <Signature className="mr-2 h-4 w-4" />
                                        Sign
                                    </Button>
                                )}
                            </TableCell>
                              <TableCell>
                                <FormField
                                  control={control}
                                  name={`worksiteMonitoring.${index}.comments`}
                                  render={({ field }) => (
                                    <FormControl><Textarea {...field} /></FormControl>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                {worksiteFields.length > 1 && (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeWorksite(index)}>
                                    <Trash className="h-4 w-4 text-destructive"/>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {showAddCheckButton && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddWorksiteCheck}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Site Check
                    </Button>
                  )}
                  {worksiteFields.length > 0 && worksiteFields[worksiteFields.length - 1].checkType !== 'Unattended/Removal' && (
                     <FormField
                        control={control}
                        name={`worksiteMonitoring.${worksiteFields.length - 1}.isNextCheckRequired`}
                        render={({ field }) => (
                          <FormItem className="p-4 border rounded-md">
                            <FormLabel>Is another 2-hour site check required?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex items-center space-x-4 pt-2"
                              >
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl><RadioGroupItem value="Yes" /></FormControl>
                                  <FormLabel className="font-normal">Yes</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl><RadioGroupItem value="No" /></FormControl>
                                  <FormLabel className="font-normal">No (final check will be Unattended/Removal)</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                  )}
              </div>
              
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Temporary Speed Limit Details</h3>
                   <div className="space-y-4">
                        {tslFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeTsl(index)}>
                                    <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                                <FormField control={control} name={`temporarySpeedLimits.${index}.streetName`} render={({ field }) => (<FormItem><FormLabel>Street Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={control} name={`temporarySpeedLimits.${index}.dateTimeInstalled`} render={({ field }) => (<FormItem><FormLabel>Date &amp; Time Installed</FormLabel><FormControl><DateTimePicker {...field} /></FormControl><FormMessage /></FormItem>)} />
                                  <FormField control={control} name={`temporarySpeedLimits.${index}.dateTimeTslRemoved`} render={({ field }) => (<FormItem><FormLabel>Date &amp; Time TSL Removed</FormLabel><FormControl><DateTimePicker {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={control} name={`temporarySpeedLimits.${index}.placementFrom`} render={({ field }) => (<FormItem><FormLabel>Placement From</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                  <FormField control={control} name={`temporarySpeedLimits.${index}.placementTo`} render={({ field }) => (<FormItem><FormLabel>Placement To</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={control} name={`temporarySpeedLimits.${index}.tslSpeed`} render={({ field }) => (<FormItem><FormLabel>TSL Speed (km/h)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={control} name={`temporarySpeedLimits.${index}.lengthOfTsl`} render={({ field }) => (<FormItem><FormLabel>Length of TSL (m)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={control} name={`temporarySpeedLimits.${index}.dateTslRemainsInPlace`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date TSL Remains in Place</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTsl({
                                streetName: '',
                                placementFrom: '',
                                placementTo: '',
                                tslSpeed: 0,
                                lengthOfTsl: 0,
                                dateTimeInstalled: new Date(),
                            })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add TSL
                        </Button>
                    </div>
              </div>
              
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Comments / Site Adjustments</h3>
                   <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p>Comments will be listed here.</p>
                       <Button type="button" variant="outline" size="sm" className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/> Add Comment</Button>
                  </div>
              </div>

            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Form
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Provide Signature</DialogTitle>
                <DialogDescription>
                    Please sign in the box below to confirm.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <SignaturePad ref={signaturePadRef} />
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => signaturePadRef.current?.clear()}>Clear</Button>
                <Button type="button" onClick={handleConfirmSignature}>Confirm Signature</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

