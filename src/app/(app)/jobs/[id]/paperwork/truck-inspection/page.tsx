
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { Job, Staff, Truck } from "@/lib/data";
import { doc, collection } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { LoaderCircle, CalendarIcon } from "lucide-react";
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

const checkStatus = z.enum(["Yes", "No", "N/A"]);

const inspectionCheckSchema = z.object({
  status: checkStatus,
  comments: z.string().optional(),
});

const truckInspectionSchema = z.object({
  jobId: z.string().min(1, "Please select a job."),
  truckId: z.string().min(1, "Please select a vehicle."),
  driverId: z.string().min(1, "Please select a driver."),
  regoExpires: z.date({ required_error: "Rego expiry date is required."}),
  wofExpires: z.date({ required_error: "WOF/COF expiry date is required." }),
  rucExpires: z.string().min(1, "RUC details are required."),
  odoStart: z.coerce.number().min(0),
  odoEnd: z.coerce.number().min(0),
  hubStart: z.coerce.number().min(0),
  hubEnd: z.coerce.number().min(0),
  
  engineOil: inspectionCheckSchema,
  coolant: inspectionCheckSchema,
  brakeFluid: inspectionCheckSchema,
  adBlue: inspectionCheckSchema,
  brakes: inspectionCheckSchema,
  airBrakes: inspectionCheckSchema,
  tyres: inspectionCheckSchema,
  steering: inspectionCheckSchema,
  lights: inspectionCheckSchema,
  arrowBoard: inspectionCheckSchema,
  pad: inspectionCheckSchema,
  horn: inspectionCheckSchema,
  mirrors: inspectionCheckSchema,
  windscreen: inspectionCheckSchema,
  wipers: inspectionCheckSchema,
  cameras: inspectionCheckSchema,
  cabInterior: inspectionCheckSchema,
  seatBelts: inspectionCheckSchema,
  vehicleExterior: inspectionCheckSchema,
  gateLatches: inspectionCheckSchema,
  
  firstAidKit: inspectionCheckSchema,
  spillKit: inspectionCheckSchema,
  fireExtinguisher: inspectionCheckSchema,
  wheelChocks: inspectionCheckSchema,

  additionalComments: z.string().optional(),
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
};

function InspectionCheck({ form, name, label, description, showNA = true }: InspectionCheckProps) {
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
                            <Input placeholder="Comments..." {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    </div>
  );
}

const DateInput = ({ value, onChange, onBlur, ...props }: { value: Date | undefined, onChange: (date: Date | undefined) => void, onBlur: () => void }) => {
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
                    {...props}
                />
                <PopoverTrigger asChild>
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
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data fetching
  const { data: jobData, isLoading: isJobLoading } = useDoc<Job>(useMemoFirebase(() => firestore ? doc(firestore, 'job_packs', jobId) : null, [firestore, jobId]));
  const { data: allJobs, isLoading: areJobsLoading } = useCollection<Job>(useMemoFirebase(() => firestore ? collection(firestore, 'job_packs') : null, [firestore]));
  const { data: trucks, isLoading: areTrucksLoading } = useCollection<Truck>(useMemoFirebase(() => firestore ? collection(firestore, 'trucks') : null, [firestore]));
  const { data: staff, isLoading: areStaffLoading } = useCollection<Staff>(useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]));

  // Form state
  const [selectedJob, setSelectedJob] = useState<Job | null>(jobData);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Staff | null>(null);

  const form = useForm<z.infer<typeof truckInspectionSchema>>({
    resolver: zodResolver(truckInspectionSchema),
    defaultValues: {
        jobId: jobId,
        inspectionDate: new Date(),
        engineOil: { status: 'Yes' },
        coolant: { status: 'Yes' },
        brakeFluid: { status: 'Yes' },
        adBlue: { status: 'N/A' },
        brakes: { status: 'Yes' },
        airBrakes: { status: 'N/A' },
        tyres: { status: 'Yes' },
        steering: { status: 'Yes' },
        lights: { status: 'Yes' },
        arrowBoard: { status: 'N/A' },
        pad: { status: 'N/A' },
        horn: { status: 'Yes' },
        mirrors: { status: 'Yes' },
        windscreen: { status: 'Yes' },
        wipers: { status: 'Yes' },
        cameras: { status: 'N/A' },
        cabInterior: { status: 'Yes' },
        seatBelts: { status: 'Yes' },
        vehicleExterior: { status: 'Yes' },
        gateLatches: { status: 'N/A' },
        firstAidKit: { status: 'Yes' },
        spillKit: { status: 'N/A' },
        fireExtinguisher: { status: 'Yes' },
        wheelChocks: { status: 'N/A' },
    },
  });
  
  const { watch, setValue } = form;
  const odoStart = watch('odoStart');
  const odoEnd = watch('odoEnd');
  const hubStart = watch('hubStart');
  const hubEnd = watch('hubEnd');

  const odoDistance = useMemo(() => (odoEnd > odoStart ? odoEnd - odoStart : 0), [odoStart, odoEnd]);
  const hubDistance = useMemo(() => (hubEnd > hubStart ? hubEnd - hubStart : 0), [hubStart, hubEnd]);


  const isLoading = isJobLoading || areJobsLoading || areTrucksLoading || areStaffLoading;

  async function onSubmit(data: z.infer<typeof truckInspectionSchema>) {
    console.log(data);
    toast({ title: "Form Submitted", description: "Your truck inspection has been recorded." });
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
        <CardTitle>Truck Inspection</CardTitle>
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
                }} />
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
                }}/>
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
                }} placeholder="Select driver..."/>
            </div>

             <Separator />

             <div className="space-y-4">
                <h3 className="font-semibold text-lg">Expiry Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="regoExpires" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rego Expires On</FormLabel>
                            <FormControl>
                                <DateInput {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="wofExpires" render={({ field }) => (
                        <FormItem>
                            <FormLabel>WOF/COF Expires On</FormLabel>
                            <FormControl>
                                <DateInput {...field} />
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="rucExpires" render={({ field }) => (<FormItem><FormLabel>RUC Expires (km)</FormLabel><FormControl><Input placeholder="e.g. 155000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>

             <Separator />

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">HUB & ODO Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField control={form.control} name="odoStart" render={({ field }) => (<FormItem><FormLabel>ODO Start</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="odoEnd" render={({ field }) => (<FormItem><FormLabel>ODO End</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <div className="space-y-2"><Label>ODO Distance</Label><div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">{odoDistance} km</div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField control={form.control} name="hubStart" render={({ field }) => (<FormItem><FormLabel>HUB Start</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="hubEnd" render={({ field }) => (<FormItem><FormLabel>HUB End</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="space-y-2"><Label>HUB Distance</Label><div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">{hubDistance} km</div></div>
                </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vehicle Inspection Checks</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InspectionCheck form={form} name="engineOil" label="Engine Oil OK?" description="Level, No Leaks" showNA={false}/>
                    <InspectionCheck form={form} name="coolant" label="Water / Radiator Coolant OK?" description="Level, No Leaks" showNA={false}/>
                    <InspectionCheck form={form} name="brakeFluid" label="Brake Fluid OK?" description="Level, No Leaks" showNA={false}/>
                    <InspectionCheck form={form} name="adBlue" label="Ad Blue OK?" description="At the correct level" />
                    <InspectionCheck form={form} name="brakes" label="Brakes OK?" description="Foot, hand & park all operational" showNA={false}/>
                    <InspectionCheck form={form} name="airBrakes" label="Air Brakes OK?" description="No leaks, tanks drained daily" />
                    <InspectionCheck form={form} name="tyres" label="Tyres OK?" description="Correct pressure, tread in safe limits, no damage, nut indicators correct" showNA={false}/>
                    <InspectionCheck form={form} name="steering" label="Steering OK?" description="All Operational" showNA={false}/>
                    <InspectionCheck form={form} name="lights" label="Lights and lenses OK?" description="Head lamps, tail lamps, indicators, brake lights all operational" />
                    <InspectionCheck form={form} name="arrowBoard" label="Arrow board & Beacon Lights OK?" description="All operational. Functions on Arrow Board work" />
                    <InspectionCheck form={form} name="pad" label="PAD OK?" description="Operates Correctly" />
                    <InspectionCheck form={form} name="horn" label="HORN OK?" description="Operational" showNA={false}/>
                    <InspectionCheck form={form} name="mirrors" label="MIRRORS OK?" description="Clean, no defects, all mirrors checked" showNA={false}/>
                    <InspectionCheck form={form} name="windscreen" label="WINDSCREEN OK?" description="Clear, Free from Cracks & Chips" showNA={false}/>
                    <InspectionCheck form={form} name="wipers" label="WINDSCREEN WIPERS AND WASHERS OK?" description="Operational" showNA={false}/>
                    <InspectionCheck form={form} name="cameras" label="CAMERAS OK?" description="Are All Cameras Working?" />
                    <InspectionCheck form={form} name="cabInterior" label="CAB INTERIOR OK?" description="Clean, No Damage, No Loose Objects" showNA={false}/>
                    <InspectionCheck form={form} name="seatBelts" label="SEAT BELTS OK?" description="Operational & in good condition" showNA={false}/>
                    <InspectionCheck form={form} name="vehicleExterior" label="VEHICLE EXTERIOR OK?" description="Clean, No Damage, Dents" showNA={false}/>
                    <InspectionCheck form={form} name="gateLatches" label="GATE SAFETY CATCH / LATCHES OK?" description="Operational" />
                </div>
            </div>

            <Separator />

             <div className="space-y-4">
                <h3 className="font-semibold text-lg">Equipment Inspection Checks</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InspectionCheck form={form} name="firstAidKit" label="FIRST AID KIT OK?" description="Clean and Well Stocked" />
                    <InspectionCheck form={form} name="spillKit" label="SPILL KIT OK?" description="Stocked & Complete" />
                    <InspectionCheck form={form} name="fireExtinguisher" label="FIRE EXTINGUISHER GOOD?" description="In Test & In Good Condition" />
                    <InspectionCheck form={form} name="wheelChocks" label="WHEEL CHOCKS OK?" description="On Board & Available for Use" />
                </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Submit Inspection
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    