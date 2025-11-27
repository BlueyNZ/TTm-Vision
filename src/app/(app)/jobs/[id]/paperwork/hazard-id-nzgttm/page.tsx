
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, Staff, HazardIdNzgttm } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, query, orderBy, limit, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Checkbox } from "@/components/ui/checkbox";
import { StaffSelector } from "@/components/staff/staff-selector";

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

const hazardIdNzgttmSchema = z.object({
  jobId: z.string(),
  performedBy: z.string().min(1, "Please select who performed the hazard ID."),
  performedAt: z.date(),
  signees: z.coerce.number().min(0, 'Number of signees must be positive'),
  signaturesObtained: z.coerce.number().min(0, 'Number of signatures must be positive'),
  siteAccessExit: z.string().optional(),
  safetyZones: z.string().optional(),
  evacuationPoints: z.string().optional(),
  adjustmentsToSite: z.string().optional(),
  nearestMedicalCentre: z.string().optional(),
  other: z.string().optional(),
  requiredPpe: z.array(z.string()).optional(),
  otherPpe: z.string().optional(),
  otherPpeDescription: z.string().optional(),
});


export default function HazardIdNzgttmPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const jobId = params.id as string;
  const formId = searchParams.get('edit') || searchParams.get('view');
  
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hazardIdNo, setHazardIdNo] = useState<string>('Loading...');

  const jobRef = useMemoFirebase(() => (firestore && jobId) ? doc(firestore, 'job_packs', jobId) : null, [firestore, jobId]);
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);

  const staffCollection = useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staffList, isLoading: isStaffListLoading } = useCollection<Staff>(staffCollection);

  const formToEditRef = useMemoFirebase(() => (firestore && formId) ? doc(firestore, 'job_packs', jobId, 'hazard_ids_nzgttm', formId) : null, [firestore, jobId, formId]);
  const { data: formToEdit, isLoading: isFormLoading } = useDoc<HazardIdNzgttm>(formToEditRef);

  const [selectedPerformer, setSelectedPerformer] = useState<Staff | null>(null);

  const form = useForm<z.infer<typeof hazardIdNzgttmSchema>>({
    resolver: zodResolver(hazardIdNzgttmSchema),
    defaultValues: {
      jobId: jobId,
      performedAt: new Date(),
      signees: 0,
      signaturesObtained: 0,
      siteAccessExit: "",
      safetyZones: "",
      evacuationPoints: "",
      adjustmentsToSite: "",
      nearestMedicalCentre: "",
      other: "",
      requiredPpe: [],
      otherPpe: "",
      otherPpeDescription: "",
    },
  });

  useEffect(() => {
    const fetchLatestHazardId = async () => {
      if (!firestore || formId) return;
      const hazardFormsCollection = collection(firestore, `job_packs/${jobId}/hazard_ids_nzgttm`);
      const q = query(hazardFormsCollection, orderBy("createdAt", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const latestDoc = querySnapshot.docs[0].data() as HazardIdNzgttm;
        const latestNum = parseInt(latestDoc.hazardIdNo.split(':')[1], 10);
        setHazardIdNo(`N-Hazard:${String(latestNum + 1).padStart(5, '0')}`);
      } else {
        setHazardIdNo('N-Hazard:00001');
      }
    };
    fetchLatestHazardId();
  }, [firestore, jobId, formId]);

  useEffect(() => {
    if (formToEdit && staffList) {
      setHazardIdNo(formToEdit.hazardIdNo);
      const performer = staffList.find(s => s.id === formToEdit.performedBy);
      setSelectedPerformer(performer || null);
      form.reset({
        ...formToEdit,
        performedAt: formToEdit.performedAt instanceof Timestamp ? formToEdit.performedAt.toDate() : new Date(formToEdit.performedAt),
      });
    }
  }, [formToEdit, staffList, form]);

  useEffect(() => {
    if (selectedPerformer) {
      form.setValue('performedBy', selectedPerformer.id);
    }
  }, [selectedPerformer, form]);
  
  const isLoading = isJobLoading || isStaffListLoading || isFormLoading;

  async function onSubmit(data: z.infer<typeof hazardIdNzgttmSchema>) {
    if (!firestore || !jobId) return;
    setIsSubmitting(true);

    try {
        const payload = {
            ...data,
            hazardIdNo,
            performedAt: Timestamp.fromDate(data.performedAt),
        };
        
        if (formId) {
            const docRef = doc(firestore, 'job_packs', jobId, 'hazard_ids_nzgttm', formId);
            await setDoc(docRef, { ...payload, createdAt: formToEdit?.createdAt || serverTimestamp() }, { merge: true });
            toast({ title: "Hazard ID (NZGTTM) Updated" });
        } else {
            await addDoc(collection(firestore, 'job_packs', jobId, 'hazard_ids_nzgttm'), { ...payload, createdAt: serverTimestamp() });
            toast({ title: "Hazard ID (NZGTTM) Submitted" });
        }
        router.push(`/paperwork/${jobId}`);
    } catch (error) {
        console.error("Error submitting Hazard ID (NZGTTM):", error);
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
                <CardTitle>Hazard ID (NZGTTM)</CardTitle>
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
                <h3 className="font-semibold text-lg border-b pb-2">Job & Personnel Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="performedBy"
                        render={() => (
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
                        name="performedAt"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date & Time Performed</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <FormField control={form.control} name="signees" render={({ field }) => (<FormItem><FormLabel>No of Signees</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="signaturesObtained" render={({ field }) => (<FormItem><FormLabel>No of Signatures</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormItem><FormLabel>No of Common Hazards</FormLabel><FormControl><Input value={0} disabled /></FormControl></FormItem>
                     <FormItem><FormLabel>No of Site Specific</FormLabel><FormControl><Input value={0} disabled /></FormControl></FormItem>
                </div>
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
                                render={({ field }) => (
                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.label)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...(field.value || []), item.label])
                                                : field.onChange(field.value?.filter((value) => value !== item.label))
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
                                    </FormItem>
                                )}
                            />
                            ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="otherPpe"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Other PPE?</FormLabel>
                                <FormControl><Input placeholder="Specify any other required PPE..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="otherPpeDescription"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Other PPE Description</FormLabel>
                                <FormControl><Input placeholder="Describe the other PPE..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {formId ? 'Save Changes' : 'Submit Form'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
