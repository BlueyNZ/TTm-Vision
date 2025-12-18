

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, IncidentReport, Staff, Truck } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Calendar as CalendarIcon, Upload, File as FileIcon, Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useEffect, useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useCollection } from "@/firebase/firestore/use-collection";
import { JobSelector } from "@/components/jobs/job-selector";
import { StaffSelector } from "@/components/staff/staff-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TruckSelector } from "@/components/fleet/truck-selector";
import { uploadFile } from "@/ai/flows/upload-file-flow";
import { useTenant } from "@/contexts/tenant-context";


const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const incidentReportSchema = z.object({
  jobId: z.string().min(1, "A job must be selected."),
  incidentReferenceNo: z.string(),
  copptmReference: z.string().optional().default(''),
  incidentDate: z.date({ required_error: "Incident date is required."}),
  incidentTime: z.string().min(1, "Incident time is required."),
  reportingCompany: z.string().min(1, "Reporting company is required."),
  reportedById: z.string().min(1, "Reporter is required."),
  stmsId: z.string().min(1, "STMS is required."),
  descriptionOfEvents: z.string().min(1, "Description is required."),
  incidentType: z.string().min(1, "Incident type is required."),
  operationType: z.enum(['Static', 'Mobile', 'Semi-static', 'Shoulder', 'Unattended']),
  phaseOfOperation: z.enum(['Install', 'Static', 'Mobile', 'Semi-Static', 'Removal']),
  damageTo: z.array(z.string()).optional(),
  injuries: z.object({
    roadWorkers: z.object({ minor: z.coerce.number().min(0).default(0), notifiable: z.coerce.number().min(0).default(0), fatal: z.coerce.number().min(0).default(0) }),
    roadUsers: z.object({ minor: z.coerce.number().min(0).default(0), notifiable: z.coerce.number().min(0).default(0), fatal: z.coerce.number().min(0).default(0) }),
  }),
  roadUserVehicles: z.array(z.object({ type: z.string().min(1), rego: z.string().min(1) })).optional(),
  tmaVehicles: z.array(z.object({ truckId: z.string().min(1), lane: z.string().min(1) })).optional(),
  policeAttended: z.boolean().default(false),
  policeOfficerDetails: z.string().optional().default(''),
  furtherInformation: z.string().optional().default(''),
  attachments: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
  investigation: z.object({
    assignedToId: z.string().optional().default(''),
    dateAssigned: z.date().optional(),
    status: z.string().optional().default('--None--'),
    summary: z.string().optional().default(''),
    potentialConsequence: z.string().optional().default('--None--'),
    canHappenAgain: z.string().optional().default('--None--'),
    classification: z.string().optional().default('--None--'),
    rootCause: z.string().optional().default('--None--'),
  }).optional(),
});

const damageItems = [
    { id: "vehicles", label: "Vehicles" },
    { id: "plant", label: "Plant" },
    { id: "ttmEquipment", label: "TTM equipment" },
];

export default function CreateIncidentReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const firestore = useFirestore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [incidentRefNo, setIncidentRefNo] = useState<string>("Loading...");
  
  const { data: allJobs, isLoading: areJobsLoading } = useCollection<Job>(useMemoFirebase(() => firestore ? collection(firestore, 'job_packs') : null, [firestore]));
  const { data: staffList, isLoading: areStaffLoading } = useCollection<Staff>(useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]));
  const { data: trucks, isLoading: areTrucksLoading } = useCollection<Truck>(useMemoFirebase(() => firestore ? collection(firestore, 'trucks') : null, [firestore]));

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedReporter, setSelectedReporter] = useState<Staff | null>(null);
  const [selectedStms, setSelectedStms] = useState<Staff | null>(null);
  const [assignedInvestigator, setAssignedInvestigator] = useState<Staff | null>(null);

  const form = useForm<z.infer<typeof incidentReportSchema>>({
    resolver: zodResolver(incidentReportSchema),
    defaultValues: {
      jobId: jobId,
      incidentReferenceNo: "",
      copptmReference: "",
      incidentDate: new Date(),
      incidentTime: "",
      reportingCompany: "Traffic Flow Kapiti",
      descriptionOfEvents: "",
      incidentType: "",
      operationType: "Static",
      phaseOfOperation: "Static",
      damageTo: [],
      injuries: { roadWorkers: { minor: 0, notifiable: 0, fatal: 0 }, roadUsers: { minor: 0, notifiable: 0, fatal: 0 } },
      roadUserVehicles: [],
      tmaVehicles: [],
      policeAttended: false,
      policeOfficerDetails: "",
      furtherInformation: "",
      attachments: [],
      investigation: { status: "--None--", potentialConsequence: "--None--", canHappenAgain: "--None--", classification: "--None--", rootCause: "--None--", summary: "", assignedToId: "" }
    },
  });

  const { control, watch, setValue } = form;
  const { fields: ruvFields, append: appendRuv, remove: removeRuv } = useFieldArray({ control, name: "roadUserVehicles" });
  const { fields: tmaFields, append: appendTma, remove: removeTma } = useFieldArray({ control, name: "tmaVehicles" });
  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({ control, name: "attachments" });

  useEffect(() => {
    const fetchLatestIncidentRef = async () => {
      if (!firestore) return;
      const incidentsCollection = collection(firestore, `job_packs/${jobId}/incident_reports`);
      const q = query(incidentsCollection, orderBy("createdAt", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const latestDoc = querySnapshot.docs[0].data() as IncidentReport;
        const latestNum = parseInt(latestDoc.incidentReferenceNo.split('-')[1], 10);
        setIncidentRefNo(`I-${String(latestNum + 1).padStart(5, '0')}`);
      } else {
        setIncidentRefNo('I-00001');
      }
    };
    fetchLatestIncidentRef();
  }, [firestore, jobId]);

  useEffect(() => {
    setValue('incidentReferenceNo', incidentRefNo);
  }, [incidentRefNo, setValue]);

  useEffect(() => {
    if (allJobs && jobId) {
      const job = allJobs.find(j => j.id === jobId);
      if (job) {
        setSelectedJob(job);
        setValue('jobId', job.id);
        const stms = staffList?.find(s => s.id === job.stmsId);
        if (stms) {
          setSelectedStms(stms);
          setValue('stmsId', stms.id);
        }
      }
    }
  }, [allJobs, jobId, staffList, setValue]);

  useEffect(() => {
      if(selectedReporter) {
          setValue('reportedById', selectedReporter.id);
      }
  }, [selectedReporter, setValue]);

  useEffect(() => {
      if(selectedStms) {
          setValue('stmsId', selectedStms.id);
      }
  }, [selectedStms, setValue]);

  useEffect(() => {
    if (assignedInvestigator) {
      setValue('investigation.assignedToId', assignedInvestigator.id);
    }
  }, [assignedInvestigator, setValue]);

  const { tenantId } = useTenant();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jobId || !tenantId) return;
    setIsUploading(true);
    try {
        const fileData = await toBase64(file);
        const result = await uploadFile({
            filePath: `tenants/${tenantId}/jobs/${jobId}/incident_attachments/${file.name}`,
            fileData,
            fileName: file.name,
            fileType: file.type,
        });
        appendAttachment({ name: file.name, url: result.downloadUrl });
        toast({ title: "File Attached", description: `${file.name} has been attached.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload file.' });
    } finally {
        setIsUploading(false);
    }
  };

  async function onSubmit(data: z.infer<typeof incidentReportSchema>) {
    if (!firestore || !selectedReporter || !selectedStms) return;
    setIsSubmitting(true);
    try {
        const payload: any = {
            ...data,
            reportedBy: selectedReporter.name,
            stmsName: selectedStms.name,
            roadLocation: selectedJob?.location || '',
            jobDescription: selectedJob?.name || '',
            createdAt: serverTimestamp(),
            attachments: data.attachments || [],
        };
        
        if (payload.investigation) {
            if (payload.investigation.dateAssigned) {
                payload.investigation.dateAssigned = Timestamp.fromDate(payload.investigation.dateAssigned);
            } else {
                delete payload.investigation.dateAssigned;
            }

            if (!payload.investigation.assignedToId) {
                payload.investigation.assignedToId = null;
            }
        }


        await addDoc(collection(firestore, 'job_packs', jobId, 'incident_reports'), payload);
        toast({ title: "Incident Report Submitted" });
        router.push(`/jobs/${jobId}/paperwork/incident-or-event-report`);
    } catch (error) {
        console.error("Error submitting incident report:", error);
        toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  const isLoading = areJobsLoading || areStaffLoading || areTrucksLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Incident or Event</CardTitle>
        <CardDescription>
          For Job: {selectedJob?.jobNumber} at {selectedJob?.location}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <h3 className="font-semibold text-lg border-b pb-2">Incident Reporting Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="jobId" render={() => (<FormItem><FormLabel>Job No</FormLabel><JobSelector jobs={allJobs || []} selectedJob={selectedJob} onSelectJob={setSelectedJob} /><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="incidentReferenceNo" render={({ field }) => (<FormItem><FormLabel>Incident Reference No</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="copptmReference" render={({ field }) => (<FormItem><FormLabel>CoPTTM Reference</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="incidentDate" render={({ field }) => (<FormItem><FormLabel>Date of Incident</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="incidentTime" render={({ field }) => (<FormItem><FormLabel>Time of Incident</FormLabel><FormControl><Input placeholder="e.g., 09:45 PM" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="reportedById" render={() => (<FormItem><FormLabel>Reported By</FormLabel><StaffSelector staffList={staffList || []} selectedStaff={selectedReporter} onSelectStaff={setSelectedReporter} /><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="reportingCompany" render={({ field }) => (<FormItem><FormLabel>Reporting Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="stmsId" render={() => (<FormItem><FormLabel>STMS</FormLabel><StaffSelector staffList={staffList?.filter(s => s.role === 'STMS') || []} selectedStaff={selectedStms} onSelectStaff={setSelectedStms} /><FormMessage /></FormItem>)} />
            </div>
             <FormField control={form.control} name="descriptionOfEvents" render={({ field }) => (<FormItem><FormLabel>Description of Events</FormLabel><FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="incidentType" render={({ field }) => (<FormItem><FormLabel>Incident Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="operationType" render={({ field }) => (<FormItem><FormLabel>Operation Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Static">Static</SelectItem><SelectItem value="Mobile">Mobile</SelectItem><SelectItem value="Semi-static">Semi-static</SelectItem><SelectItem value="Shoulder">Shoulder</SelectItem><SelectItem value="Unattended">Unattended</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phaseOfOperation" render={({ field }) => (<FormItem><FormLabel>Phase of Operation</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Install">Install</SelectItem><SelectItem value="Static">Static</SelectItem><SelectItem value="Mobile">Mobile</SelectItem><SelectItem value="Semi-Static">Semi-Static</SelectItem><SelectItem value="Removal">Removal</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>

            <FormField control={form.control} name="damageTo" render={() => (<FormItem><FormLabel>Damage To</FormLabel><div className="grid grid-cols-3 gap-4 pt-2">{damageItems.map((item) => (<FormField key={item.id} control={form.control} name="damageTo" render={({ field }) => { return (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.label)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item.label]) : field.onChange(field.value?.filter((value) => value !== item.label))}}/></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem> )}} />))}</div><FormMessage /></FormItem>)} />

            <Separator/>
            
            <div>
              <h4 className="font-semibold text-base mb-2">Injuries</h4>
              <div className="space-y-4 rounded-md border p-4">
                <p className="font-medium">Road Workers</p>
                 <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="injuries.roadWorkers.minor" render={({ field }) => (<FormItem><FormLabel>Minor</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="injuries.roadWorkers.notifiable" render={({ field }) => (<FormItem><FormLabel>Notifiable</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="injuries.roadWorkers.fatal" render={({ field }) => (<FormItem><FormLabel>Fatal</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                 </div>
                 <p className="font-medium">Road Users</p>
                 <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="injuries.roadUsers.minor" render={({ field }) => (<FormItem><FormLabel>Minor</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="injuries.roadUsers.notifiable" render={({ field }) => (<FormItem><FormLabel>Notifiable</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="injuries.roadUsers.fatal" render={({ field }) => (<FormItem><FormLabel>Fatal</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                 </div>
              </div>
            </div>
            
            <Separator />

             <div>
                <div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-base">Road User Vehicles</h4><Button type="button" variant="outline" size="sm" onClick={() => appendRuv({ type: '', rego: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                {ruvFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 mb-2 p-2 border rounded-md"><FormField control={form.control} name={`roadUserVehicles.${index}.type`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Vehicle Type</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name={`roadUserVehicles.${index}.rego`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Vehicle Rego</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeRuv(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                ))}
            </div>

            <div>
                <div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-base">TMA Vehicles</h4><Button type="button" variant="outline" size="sm" onClick={() => appendTma({ truckId: '', lane: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                {tmaFields.map((field, index) => (
                     <div key={field.id} className="flex items-end gap-2 mb-2 p-2 border rounded-md"><FormField control={form.control} name={`tmaVehicles.${index}.truckId`} render={() => (<FormItem className="flex-1"><FormLabel>Vehicle Name</FormLabel><TruckSelector trucks={trucks || []} onSelectTruck={(truck) => setValue(`tmaVehicles.${index}.truckId`, truck?.id || '')} /><FormMessage /></FormItem>)} /><FormField control={form.control} name={`tmaVehicles.${index}.lane`} render={({ field }) => (<FormItem className="w-1/4"><FormLabel>Which Lane</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeTma(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                ))}
            </div>
            
            <Separator/>
            
            <FormField control={form.control} name="policeAttended" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Police Attended?</FormLabel></div></FormItem>)} />
            {watch('policeAttended') && <FormField control={form.control} name="policeOfficerDetails" render={({ field }) => (<FormItem><FormLabel>Police Attended (Officer name/number)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
            <FormField control={form.control} name="furtherInformation" render={({ field }) => (<FormItem><FormLabel>Further information</FormLabel><FormControl><Textarea {...field} /></FormControl><FormDescription>For a more detailed internal report (contact)</FormDescription></FormItem>)} />
            
             <div className="space-y-4">
                <FormLabel>Crash Diagram or Photos</FormLabel>
                <div className="relative"><Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} /><Button type="button" asChild variant="outline" className="w-full cursor-pointer"><label htmlFor="file-upload" className="flex items-center justify-center gap-2">{isUploading ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}{isUploading ? "Uploading..." : "Choose File"}</label></Button></div>
                <div className="space-y-2">{attachmentFields.map((field, index) => (<div key={field.id} className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-sm"><FileIcon className="h-4 w-4 flex-shrink-0" /><a href={field.url} target="_blank" rel="noopener noreferrer" className="flex-grow truncate hover:underline">{field.name}</a><Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttachment(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>))}</div>
            </div>

            <Separator />
            <h3 className="font-semibold text-lg border-b pb-2">Incident & Event Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="investigation.assignedToId" render={() => (<FormItem><FormLabel>Assigned To</FormLabel><StaffSelector staffList={staffList || []} selectedStaff={assignedInvestigator} onSelectStaff={setAssignedInvestigator} /><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="investigation.dateAssigned" render={({ field }) => (<FormItem><FormLabel>Date Assigned</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="investigation.status" render={({ field }) => (<FormItem><FormLabel>Investigation Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="--None--" /></SelectTrigger></FormControl><SelectContent><SelectItem value="--None--">--None--</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent></Select></FormItem>)} />
            <FormField control={form.control} name="investigation.summary" render={({ field }) => (<FormItem><FormLabel>Investigation & Analysis Summary</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="investigation.potentialConsequence" render={({ field }) => (<FormItem><FormLabel>Potential Consequence</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="--None--" /></SelectTrigger></FormControl><SelectContent><SelectItem value="--None--">--None--</SelectItem></SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="investigation.canHappenAgain" render={({ field }) => (<FormItem><FormLabel>Can this Happen Again</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="--None--" /></SelectTrigger></FormControl><SelectContent><SelectItem value="--None--">--None--</SelectItem><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="investigation.classification" render={({ field }) => (<FormItem><FormLabel>Classification</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="--None--" /></SelectTrigger></FormControl><SelectContent><SelectItem value="--None--">--None--</SelectItem></SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="investigation.rootCause" render={({ field }) => (<FormItem><FormLabel>Root Cause</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="--None--" /></SelectTrigger></FormControl><SelectContent><SelectItem value="--None--">--None--</SelectItem></SelectContent></Select></FormItem>)} />
            </div>

          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
                {(isSubmitting || isUploading) && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    

    