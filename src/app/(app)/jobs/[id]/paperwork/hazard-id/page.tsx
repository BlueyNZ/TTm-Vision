
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, Staff, HazardId } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Trash, CheckCircle, Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { StaffSelector } from "@/components/staff/staff-selector";

const hazardSchema = z.object({
  present: z.enum(['Yes', 'No']),
  control: z.string().optional(),
});

const siteHazardSchema = z.object({
  description: z.string().optional(),
  control: z.string().optional(),
});

const ppeItems = [
  { id: "highVisVest", label: "High Vis Vest" },
  { id: "safetyFootwear", label: "Safety Footwear" },
  { id: "hardHat", label: "Hard Hat" },
  { id: "safetyEyewear", label: "Safety Eyewear" },
  { id: "hearingProtection", label: "Hearing Protection" },
  { id: "gloves", label: "Gloves (To be carried at all times)" },
  { id: "uniform", label: "Uniform (Long sleeves, long pants)" },
  { id: "specificGloves", label: "Specific Gloves" },
  { id: "faceShield", label: "Face Shield" },
  { id: "respirator", label: "Respirator" },
  { id: "dustMask", label: "Dust Mask" },
  { id: "fallArrest", label: "Fall Arrest" },
];


const hazardIdSchema = z.object({
  jobId: z.string(),
  performedBy: z.string().min(1, "Please select who performed the hazard ID."),
  signees: z.coerce.number().min(0, 'Number of signees must be positive'),
  performedAt: z.date(),
  commonHazards: z.object({
    contractorMovements: hazardSchema,
    poorRoadSurface: hazardSchema,
    mobilityScooters: hazardSchema,
    largeVehicles: hazardSchema,
    weather: hazardSchema,
    cyclists: hazardSchema,
    excessSpeed: hazardSchema,
    pedestriansFootpathClosed: hazardSchema,
    pedestriansFootpathDetour: hazardSchema,
    trafficVehicles: hazardSchema,
    visibility: hazardSchema,
  }),
  siteSpecificHazards: z.array(siteHazardSchema).optional(),
  siteAccessExit: z.string().optional(),
  safetyZones: z.string().optional(),
  evacuationPoints: z.string().optional(),
  adjustmentsToSite: z.string().optional(),
  nearestMedicalCentre: z.string().optional(),
  other: z.string().optional(),
  requiredPpe: z.array(z.string()).optional(),
});


const HazardCheck = ({ form, name, label, disabled }: { form: any, name: string, label: string, disabled?: boolean }) => {
    return (
        <div className="space-y-3 rounded-lg border p-4">
            <Label className="font-semibold">{label}</Label>
            <FormField
                control={form.control}
                name={`${name}.present`}
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
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
                            </RadioGroup>
                        </FormControl>
                    </FormItem>
                )}
            />
            {form.watch(`${name}.present`) === 'Yes' && (
                 <FormField
                    control={form.control}
                    name={`${name}.control`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Eliminate & Minimise</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe control measures..." {...field} disabled={disabled} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
};


export default function HazardIdPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hazardIdNo, setHazardIdNo] = useState<string>('Loading...');

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

  const [selectedPerformer, setSelectedPerformer] = useState<Staff | null>(null);

  const form = useForm<z.infer<typeof hazardIdSchema>>({
    resolver: zodResolver(hazardIdSchema),
    defaultValues: {
      jobId: jobId,
      performedAt: new Date(),
      signees: 0,
      commonHazards: {
        contractorMovements: { present: 'No' },
        poorRoadSurface: { present: 'No' },
        mobilityScooters: { present: 'No' },
        largeVehicles: { present: 'No' },
        weather: { present: 'No' },
        cyclists: { present: 'No' },
        excessSpeed: { present: 'No' },
        pedestriansFootpathClosed: { present: 'No' },
        pedestriansFootpathDetour: { present: 'No' },
        trafficVehicles: { present: 'No' },
        visibility: { present: 'No' },
      },
      siteSpecificHazards: [{ description: '', control: '' }],
      requiredPpe: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "siteSpecificHazards",
  });

   useEffect(() => {
    const fetchLatestHazardId = async () => {
      if (!firestore) return;
      const hazardFormsCollection = collection(firestore, `job_packs/${jobId}/hazard_ids`);
      const q = query(hazardFormsCollection, orderBy("createdAt", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const latestDoc = querySnapshot.docs[0].data() as HazardId;
        const latestNum = parseInt(latestDoc.hazardIdNo.split('-')[1], 10);
        setHazardIdNo(`H-${String(latestNum + 1).padStart(5, '0')}`);
      } else {
        setHazardIdNo('H-00001');
      }
    };
    fetchLatestHazardId();
  }, [firestore, jobId]);


  useEffect(() => {
    if (selectedPerformer) {
      form.setValue('performedBy', selectedPerformer.id);
    }
  }, [selectedPerformer, form]);
  
  const isLoading = isJobLoading || isUserLoading || isStaffListLoading;

  async function onSubmit(data: z.infer<typeof hazardIdSchema>) {
    if (!firestore || !jobId) return;

    setIsSubmitting(true);

    try {
        const hazardCollectionRef = collection(firestore, 'job_packs', jobId, 'hazard_ids');
        const payload: Omit<HazardId, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
            ...data,
            hazardIdNo,
            performedAt: Timestamp.fromDate(data.performedAt),
            createdAt: Timestamp.now(),
        };

        await addDoc(hazardCollectionRef, payload);
        toast({
            title: "Hazard ID Submitted",
            description: `The hazard identification form ${hazardIdNo} has been saved.`,
        });
        router.push(`/jobs/${jobId}/paperwork`);

    } catch (error) {
        console.error("Error submitting Hazard ID:", error);
        toast({ title: "Submission Failed", description: "Could not submit form. Please try again.", variant: 'destructive' });
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
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Hazard ID</CardTitle>
                <CardDescription>
                For Job: {job?.jobNumber || '...'} at {job?.location || '...'}
                </CardDescription>
            </div>
            <div className="text-right">
                <p className="text-sm font-semibold">Hazard ID No</p>
                <p className="text-lg font-bold">{hazardIdNo}</p>
            </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Job &amp; Personnel Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="performedBy"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Performed By</FormLabel>
                                <StaffSelector 
                                    staffList={staffList || []}
                                    selectedStaff={selectedPerformer}
                                    onSelectStaff={setSelectedPerformer}
                                    placeholder="Select staff member..."
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="signees"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>No of Signees</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="performedAt"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Date & Time Performed</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                                    >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Common Hazards &amp; Controls</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <HazardCheck form={form} name="commonHazards.contractorMovements" label="Lots of contractor movements" />
                    <HazardCheck form={form} name="commonHazards.poorRoadSurface" label="Poor Road Surface" />
                    <HazardCheck form={form} name="commonHazards.mobilityScooters" label="Mobility Scooters" />
                    <HazardCheck form={form} name="commonHazards.largeVehicles" label="Large Vehicles" />
                    <HazardCheck form={form} name="commonHazards.weather" label="Weather" />
                    <HazardCheck form={form} name="commonHazards.cyclists" label="Cyclists (cycle lane diversion/allowance)" />
                    <HazardCheck form={form} name="commonHazards.excessSpeed" label="Excess Speed" />
                    <HazardCheck form={form} name="commonHazards.pedestriansFootpathClosed" label="Pedestrians (footpath closed)" />
                    <HazardCheck form={form} name="commonHazards.pedestriansFootpathDetour" label="Pedestrians (footpath detour)" />
                    <HazardCheck form={form} name="commonHazards.trafficVehicles" label="Traffic/Vehicles" />
                    <HazardCheck form={form} name="commonHazards.visibility" label="Visibility" />
                 </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Other Site Specific Hazards</h3>
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                         <FormField
                            control={form.control}
                            name={`siteSpecificHazards.${index}.description`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Describe Hazard</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`siteSpecificHazards.${index}.control`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Eliminate & Minimise</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                        {fields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', control: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Another Hazard
                </Button>
            </div>
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Site Induction / ToolBox</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="siteAccessExit" render={({ field }) => (<FormItem><FormLabel>Site Access / Exit</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="safetyZones" render={({ field }) => (<FormItem><FormLabel>Safety Zones</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="evacuationPoints" render={({ field }) => (<FormItem><FormLabel>Evacuation Points</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="adjustmentsToSite" render={({ field }) => (<FormItem><FormLabel>Adjustments to Site</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="nearestMedicalCentre" render={({ field }) => (<FormItem><FormLabel>Nearest Medical Centre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="other" render={({ field }) => (<FormItem><FormLabel>Other</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                 </div>
            </div>

            <div className="space-y-4">
                 <h3 className="font-semibold text-lg border-b pb-2">Required PPE</h3>
                <FormField
                    control={form.control}
                    name="requiredPpe"
                    render={() => (
                        <FormItem>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {ppeItems.map((item) => (
                            <FormField
                                key={item.id}
                                control={form.control}
                                name="requiredPpe"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.label)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...(field.value || []), item.label])
                                                : field.onChange(
                                                    field.value?.filter(
                                                        (value) => value !== item.label
                                                    )
                                                    )
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                            ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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
  );
}
