
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { Job, Staff, Truck, TruckInspection } from "@/lib/data";
import { doc, collection, addDoc, setDoc, Timestamp } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, CalendarIcon, CheckCircle, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { SignaturePad, SignaturePadRef } from "@/components/ui/signature-pad";
import { useRef, useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { JobSelector } from '@/components/jobs/job-selector';
import { TruckSelector } from '@/components/fleet/truck-selector';
import { StaffSelector } from '@/components/staff/staff-selector';
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

const checkStatus = z.enum(["Yes", "No", "N/A"]);

const inspectionCheckSchema = z.object({
  status: checkStatus,
  comments: z.string().optional().default(''),
});

const truckInspectionSchema = z.object({
  jobId: z.string().min(1, "Please select a job."),
  truckId: z.string().min(1, "Please select a vehicle."),
  driverId: z.string().min(1, "Please select a driver."),
  regoExpires: z.date({ required_error: "Rego expiry date is required."}),
  wofExpires: z.date({ required_error: "WOF/COF expiry date is required." }),
  rucExpires: z.string().min(1, "RUC details are required.").default(''),
  odoStart: z.coerce.number().min(0).default(0),
  odoEnd: z.coerce.number().min(0).default(0),
  hubStart: z.coerce.number().min(0).default(0),
  hubEnd: z.coerce.number().min(0).default(0),
  
  engineOil: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  coolant: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  brakeFluid: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  adBlue: inspectionCheckSchema.default({ status: "N/A", comments: "" }),
  brakes: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  airBrakes: inspectionCheckSchema.default({ status: "N/A", comments: "" }),
  tyres: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  steering: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  lights: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  arrowBoard: inspectionCheckSchema.default({ status: "N/A", comments: "" }),
  pad: inspectionCheckSchema.default({ status: "N/A", comments: "" }),
  horn: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  mirrors: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  windscreen: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  wipers: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  cameras: inspectionCheckSchema.default({ status: "N/A", comments: "" }),
  cabInterior: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  seatBelts: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  vehicleExterior: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  gateLatches: inspectionCheckSchema.default({ status: "N/A", comments: "" }),
  
  firstAidKit: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  spillKit: inspectionCheckSchema.default({ status: "N/A", comments: "" }),
  fireExtinguisher: inspectionCheckSchema.default({ status: "Yes", comments: "" }),
  wheelChocks: inspectionCheckSchema.default({ status: "N/A", comments: "" }),

  additionalComments: z.string().optional().default(''),
  inspectionDate: z.date(),
  inspectedById: z.string(),
  signatureDataUrl: z.string().min(1, "A signature is required."),
});

type InspectionCheckProps = {
  form: any;
  name: keyof z.infer<typeof truckInspectionSchema>;
  label: string;
  description: string;
  showNA?: boolean;
  disabled?: boolean;
};

function InspectionCheck({ form, name, label, description, showNA = true, disabled = false }: InspectionCheckProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
        <div>
            <h4 className="font-semibold">{label}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-6">
            <FormField
            control={form.control}
            name={`${name}.status`}
            render={({ field }) => (
                <FormItem className="flex-grow">
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    disabled={disabled}
                    >
                    <FormItem className="flex items-center space-x-2">
                        <FormControl><RadioGroupItem value="Yes" /></FormControl>
                        <FormLabel className="font-normal">Yes</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                        <FormControl><RadioGroupItem value="No" /></FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                    </FormItem>
                    {showNA && (
                        <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="N/A" /></FormControl>
                            <FormLabel className="font-normal">N/A</FormLabel>
                        </FormItem>
                    )}
                    </RadioGroup>
                </FormControl>
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name={`${name}.comments`}
                render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormControl>
                            <Input placeholder="Comments..." {...field} disabled={disabled}/>
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    </div>
  );
}

const DateInput = ({ value, onChange, onBlur, disabled, ...props }: { value: Date | undefined, onChange: (date: Date | undefined) => void, onBlur: () => void, disabled?: boolean }) => {
    const [inputValue, setInputValue] = useState(value ? format(value, 'dd/MM/yyyy') : '');
    const [popoverOpen, setPopoverOpen] = useState(false);
    
    useEffect(() => {
        setInputValue(value ? format(value, 'dd/MM/yyyy') : '');
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const parsedDate = parse(e.target.value, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
            onChange(parsedDate);
            setInputValue(format(parsedDate, 'dd/MM/yyyy'));
        } else {
           onChange(undefined);
           setInputValue('');
        }
        onBlur();
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            onChange(date);
            setInputValue(format(date, 'dd/MM/yyyy'));
            setPopoverOpen(false);
        }
    };

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <div className="relative">
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="dd/MM/yyyy"
                    className="pr-10"
                    disabled={disabled}
                    {...props}
                />
                <PopoverTrigger asChild disabled={disabled}>
                    <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
            </div>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
};


export default function TruckInspectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const editId = searchParams.get('edit');
  const viewId = searchParams.get('view');
  const inspectionId = editId || viewId;
  const isEditMode = !!editId;
  const isViewMode = !!viewId;


  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);

  // Data fetching
  const { data: jobData, isLoading: isJobLoading } = useDoc<Job>(useMemoFirebase(() => firestore ? doc(firestore, 'job_packs', jobId) : null, [firestore, jobId]));
  const { data: allJobs, isLoading: areJobsLoading } = useCollection<Job>(useMemoFirebase(() => firestore ? collection(firestore, 'job_packs') : null, [firestore]));
  const { data: trucks, isLoading: areTrucksLoading } = useCollection<Truck>(useMemoFirebase(() => firestore ? collection(firestore, 'trucks') : null, [firestore]));
  const { data: staff, isLoading: areStaffLoading } = useCollection<Staff>(useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]));
  const { data: inspectionToEdit, isLoading: isInspectionLoading } = useDoc<TruckInspection>(useMemoFirebase(() => (firestore && inspectionId) ? doc(firestore, 'job_packs', jobId, 'truck_inspections', inspectionId) : null, [firestore, jobId, inspectionId]));


  // Form state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Staff | null>(null);

  const form = useForm<z.infer<typeof truckInspectionSchema>>({
    resolver: zodResolver(truckInspectionSchema),
    defaultValues: {
        jobId: jobId,
        truckId: '',
        driverId: '',
        rucExpires: '',
        odoStart: 0,
        odoEnd: 0,
        hubStart: 0,
        hubEnd: 0,
        inspectionDate: new Date(),
        engineOil: { status: 'Yes', comments: '' },
        coolant: { status: 'Yes', comments: '' },
        brakeFluid: { status: 'Yes', comments: '' },
        adBlue: { status: 'N/A', comments: '' },
        brakes: { status: 'Yes', comments: '' },
        airBrakes: { status: 'N/A', comments: '' },
        tyres: { status: 'Yes', comments: '' },
        steering: { status: 'Yes', comments: '' },
        lights: { status: 'Yes', comments: '' },
        arrowBoard: { status: 'N/A', comments: '' },
        pad: { status: 'N/A', comments: '' },
        horn: { status: 'Yes', comments: '' },
        mirrors: { status: 'Yes', comments: '' },
        windscreen: { status: 'Yes', comments: '' },
        wipers: { status: 'Yes', comments: '' },
        cameras: { status: 'N/A', comments: '' },
        cabInterior: { status: 'Yes', comments: '' },
        seatBelts: { status: 'Yes', comments: '' },
        vehicleExterior: { status: 'Yes', comments: '' },
        gateLatches: { status: 'N/A', comments: '' },
        firstAidKit: { status: 'Yes', comments: '' },
        spillKit: { status: 'N/A', comments: '' },
        fireExtinguisher: { status: 'Yes', comments: '' },
        wheelChocks: { status: 'N/A', comments: '' },
        additionalComments: "",
        inspectedById: "",
        signatureDataUrl: ""
    },
  });
  
  const { watch, setValue, reset } = form;
  const odoStart = watch('odoStart');
  const odoEnd = watch('odoEnd');
  const hubStart = watch('hubStart');
  const hubEnd = watch('hubEnd');
  const signatureDataUrlValue = watch("signatureDataUrl");

  const odoDistance = useMemo(() => (odoEnd > odoStart ? odoEnd - odoStart : 0), [odoStart, odoEnd]);
  const hubDistance = useMemo(() => (hubEnd > hubStart ? hubEnd - hubStart : 0), [hubStart, hubEnd]);
  
  useEffect(() => {
    if (jobData && !inspectionId) {
      setSelectedJob(jobData);
      setValue('jobId', jobData.id);
    }
  }, [jobData, setValue, inspectionId]);

  useEffect(() => {
    if (inspectionId && inspectionToEdit && allJobs && trucks && staff) {
        const job = allJobs.find(j => j.id === inspectionToEdit.jobId);
        const truck = trucks.find(t => t.id === inspectionToEdit.truckId);
        const driver = staff.find(s => s.id === inspectionToEdit.driverId);
        
        setSelectedJob(job || null);
        setSelectedTruck(truck || null);
        setSelectedDriver(driver || null);

        const formValues: any = {};
        Object.keys(inspectionToEdit).forEach(key => {
            const typedKey = key as keyof TruckInspection;
            if (inspectionToEdit[typedKey] instanceof Timestamp) {
                formValues[typedKey] = (inspectionToEdit[typedKey] as Timestamp).toDate();
            } else {
                formValues[typedKey] = inspectionToEdit[typedKey];
            }
        });
        reset(formValues);
    }
}, [inspectionId, inspectionToEdit, allJobs, trucks, staff, reset]);


  const isLoading = isJobLoading || areJobsLoading || areTrucksLoading || areStaffLoading || (!!inspectionId && isInspectionLoading);

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

  async function onSubmit(data: z.infer<typeof truckInspectionSchema>) {
    if (!firestore || !data.jobId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Job ID is missing.'});
        return;
    };

    setIsSubmitting(true);

    try {
        const inspectionPayload: Omit<TruckInspection, 'id'> = {
            ...data,
            regoExpires: Timestamp.fromDate(data.regoExpires),
            wofExpires: Timestamp.fromDate(data.wofExpires),
            inspectionDate: Timestamp.fromDate(data.inspectionDate),
            createdAt: isEditMode && inspectionToEdit ? inspectionToEdit.createdAt : Timestamp.now(),
        };

        if (isEditMode && inspectionId) {
            const inspectionDocRef = doc(firestore, 'job_packs', data.jobId, 'truck_inspections', inspectionId);
            await setDoc(inspectionDocRef, inspectionPayload, { merge: true });
            toast({ title: 'Inspection Updated', description: 'Your changes have been saved.' });
        } else {
            const inspectionsCollectionRef = collection(firestore, 'job_packs', data.jobId, 'truck_inspections');
            await addDoc(inspectionsCollectionRef, inspectionPayload);
            toast({ title: "Inspection Submitted", description: "Your truck inspection has been recorded." });
        }
        
        router.push(`/jobs/${data.jobId}/paperwork/truck-inspections`);

    } catch (error) {
        console.error("Error submitting inspection:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'An error occurred. Please try again.' });
    } finally {
        setIsSubmitting(false);
    }
  }

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
        <CardTitle>{isEditMode ? 'Edit' : (isViewMode ? 'View' : 'Create')} Truck Inspection</CardTitle>
        <CardDescription>
          Pre-start vehicle inspection checklist.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Job Details</h3>
                <JobSelector jobs={allJobs || []} selectedJob={selectedJob} onSelectJob={(job) => {
                    setSelectedJob(job);
                    setValue('jobId', job?.id || '');
                }} disabled={isViewMode} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-4">
                     <div>
                        <p className="text-sm font-medium text-muted-foreground">Client Name</p>
                        <p className="text-sm">{selectedJob?.clientName || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Site Location</p>
                        <p className="text-sm">{selectedJob?.location || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vehicle Details</h3>
                <TruckSelector trucks={trucks || []} selectedTruck={selectedTruck} onSelectTruck={(truck) => {
                    setSelectedTruck(truck);
                    setValue('truckId', truck?.id || '');
                }} disabled={isViewMode}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-4">
                     <div>
                        <p className="text-sm font-medium text-muted-foreground">Fleet No</p>
                        <p className="text-sm">{selectedTruck?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Registration</p>
                        <p className="text-sm">{selectedTruck?.plate || 'N/A'}</p>
                    </div>
                </div>
                <StaffSelector staffList={staff || []} selectedStaff={selectedDriver} onSelectStaff={(staff) => {
                    setSelectedDriver(staff);
                    setValue('driverId', staff?.id || '');
                    setValue('inspectedById', staff?.id || '');
                }} placeholder="Select driver..." disabled={isViewMode}/>
            </div>

             <Separator />

             <div className="space-y-4">
                <h3 className="font-semibold text-lg">Expiry Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="regoExpires" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rego Expires On</FormLabel>
                            <FormControl>
                                <DateInput {...field} disabled={isViewMode}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="wofExpires" render={({ field }) => (
                        <FormItem>
                            <FormLabel>WOF/COF Expires On</FormLabel>
                            <FormControl>
                                <DateInput {...field} disabled={isViewMode}/>
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="rucExpires" render={({ field }) => (<FormItem><FormLabel>RUC Expires (km)</FormLabel><FormControl><Input placeholder="e.g. 155000" {...field} disabled={isViewMode}/></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>

             <Separator />

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">HUB & ODO Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField control={form.control} name="odoStart" render={({ field }) => (<FormItem><FormLabel>ODO Start</FormLabel><FormControl><Input type="number" placeholder="0" {...field} disabled={isViewMode}/></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="odoEnd" render={({ field }) => (<FormItem><FormLabel>ODO End</FormLabel><FormControl><Input type="number" placeholder="0" {...field} disabled={isViewMode}/></FormControl><FormMessage /></FormItem>)} />
                     <div className="space-y-2"><Label>ODO Distance</Label><div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">{odoDistance} km</div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField control={form.control} name="hubStart" render={({ field }) => (<FormItem><FormLabel>HUB Start</FormLabel><FormControl><Input type="number" placeholder="0" {...field} disabled={isViewMode}/></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="hubEnd" render={({ field }) => (<FormItem><FormLabel>HUB End</FormLabel><FormControl><Input type="number" placeholder="0" {...field} disabled={isViewMode}/></FormControl><FormMessage /></FormItem>)} />
                    <div className="space-y-2"><Label>HUB Distance</Label><div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">{hubDistance} km</div></div>
                </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vehicle Inspection Checks</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InspectionCheck form={form} name="engineOil" label="Engine Oil OK?" description="Level, No Leaks" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="coolant" label="Water / Radiator Coolant OK?" description="Level, No Leaks" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="brakeFluid" label="Brake Fluid OK?" description="Level, No Leaks" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="adBlue" label="Ad Blue OK?" description="At the correct level" disabled={isViewMode}/>
                    <InspectionCheck form={form} name="brakes" label="Brakes OK?" description="Foot, hand & park all operational" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="airBrakes" label="Air Brakes OK?" description="No leaks, tanks drained daily" disabled={isViewMode}/>
                    <InspectionCheck form={form} name="tyres" label="Tyres OK?" description="Correct pressure, tread in safe limits, no damage, nut indicators correct" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="steering" label="Steering OK?" description="All Operational" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="lights" label="Lights and lenses OK?" description="Head lamps, tail lamps, indicators, brake lights all operational" disabled={isViewMode}/>
                    <InspectionCheck form={form} name="arrowBoard" label="Arrow board & Beacon Lights OK?" description="All operational. Functions on Arrow Board work" disabled={isViewMode}/>
                    <InspectionCheck form={form} name="pad" label="PAD OK?" description="Operates Correctly" disabled={isViewMode}/>
                    <InspectionCheck form={form} name="horn" label="HORN OK?" description="Operational" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="mirrors" label="MIRRORS OK?" description="Clean, no defects, all mirrors checked" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="windscreen" label="WINDSCREEN OK?" description="Clear, Free from Cracks & Chips" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="wipers" label="WINDSCREEN WIPERS AND WASHERS OK?" description="Operational" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="cameras" label="CAMERAS OK?" description="Are All Cameras Working?" disabled={isViewMode}/>
                    <InspectionCheck form={form} name="cabInterior" label="CAB INTERIOR OK?" description="Clean, No Damage, No Loose Objects" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="seatBelts" label="SEAT BELTS OK?" description="Operational & in good condition" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="vehicleExterior" label="VEHICLE EXTERIOR OK?" description="Clean, No Damage, Dents" showNA={false} disabled={isViewMode}/>
                    <InspectionCheck form={form} name="gateLatches" label="GATE SAFETY CATCH / LATCHES OK?" description="Operational" disabled={isViewMode}/>
                </div>
            </div>

            <Separator />

             <div className="space-y-4">
                <h3 className="font-semibold text-lg">Equipment Inspection Checks</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InspectionCheck form={form} name="firstAidKit" label="FIRST AID KIT OK?" description="Clean and Well Stocked" disabled={isViewMode}/>
                    <InspectionCheck form={form} name="spillKit" label="SPILL KIT OK?" description="Stocked & Complete" disabled={isViewMode}/>
                    <InspectionCheck form={form} name="fireExtinguisher" label="FIRE EXTINGUISHER GOOD?" description="In Test & In Good Condition" disabled={isViewMode}/>
                    <InspectionCheck form={form} name="wheelChocks" label="WHEEL CHOCKS OK?" description="On Board & Available for Use" disabled={isViewMode}/>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Sign Off</h3>
                <FormField
                    control={form.control}
                    name="additionalComments"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Additional Comments?</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Add any final notes or comments..."
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
                            <FormLabel>Signature</FormLabel>
                            <FormControl>
                            <div className="space-y-4">
                                <Dialog open={isSignatureDialogOpen} onOpenChange={isViewMode ? undefined : setIsSignatureDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full" disabled={isViewMode}>
                                            {signatureDataUrlValue ? (
                                                <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Signed (Click to re-sign)</>
                                            ) : (
                                                "Provide Signature"
                                            )}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Sign Inspection</DialogTitle>
                                            <DialogDescription>
                                                By signing, you confirm that this inspection is accurate to the best of your knowledge.
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
                                        <Image src={signatureDataUrlValue} alt="Driver signature" width={0} height={0} sizes="100vw" style={{ width: 'auto', height: '100px' }} className="bg-white shadow-sm"/>
                                    </div>
                                )}
                            </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>


          </CardContent>
          <CardFooter className="justify-end gap-2">
            {isViewMode ? (
                 <Button type="button" onClick={() => router.back()}>Back</Button>
            ) : (
                <>
                    <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Save Changes' : 'Submit Inspection'}
                    </Button>
                </>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
