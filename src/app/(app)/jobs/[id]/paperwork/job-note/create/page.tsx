
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, JobNote, Staff, Attachment } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Calendar as CalendarIcon, File, Trash, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useCollection } from "@/firebase/firestore/use-collection";
import { JobSelector } from "@/components/jobs/job-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffSelector } from "@/components/staff/staff-selector";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/ai/flows/upload-file-flow";

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
});

const jobNoteSchema = z.object({
  jobId: z.string().min(1, 'A job must be selected.'),
  noteType: z.enum(['General', 'Safety', 'Client Request', 'Variation'], { required_error: 'Note type is required.'}),
  raisedById: z.string().min(1, 'Please select who raised the note.'),
  dateRaised: z.date(),
  description: z.string().min(1, "Note description cannot be empty."),
  updates: z.string().optional(),
  attachments: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});

export default function CreateJobNotePage() {
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
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [raisedByStaff, setRaisedByStaff] = useState<Staff | null>(null);

  const { data: allJobs, isLoading: areJobsLoading } = useCollection<Job>(useMemoFirebase(() => firestore ? collection(firestore, 'job_packs') : null, [firestore]));
  const { data: staffList, isLoading: areStaffLoading } = useCollection<Staff>(useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]));
  const { data: formToEdit, isLoading: isFormLoading } = useDoc<JobNote>(useMemoFirebase(() => (firestore && formId) ? doc(firestore, 'job_packs', jobId, 'job_notes', formId) : null, [firestore, jobId, formId]));

  const form = useForm<z.infer<typeof jobNoteSchema>>({
    resolver: zodResolver(jobNoteSchema),
    defaultValues: {
        jobId: jobId,
        dateRaised: new Date(),
        description: "",
        updates: "",
        attachments: [],
    },
  });

  const { control, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "attachments"
  });
  const attachments = watch("attachments");


  useEffect(() => {
    if (allJobs && jobId) {
      const job = allJobs.find(j => j.id === jobId);
      if(job) setSelectedJob(job);
    }
  }, [allJobs, jobId]);

  useEffect(() => {
    if (formToEdit && staffList) {
        const job = allJobs?.find(j => j.id === formToEdit.jobId);
        const staff = staffList.find(s => s.id === formToEdit.raisedById);
        setSelectedJob(job || null);
        setRaisedByStaff(staff || null);
        form.reset({
            ...formToEdit,
            dateRaised: formToEdit.dateRaised.toDate(),
        });
    }
  }, [formToEdit, staffList, allJobs, form]);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jobId) return;

    setIsUploading(true);
    try {
        const fileData = await toBase64(file);
        const result = await uploadFile({
            filePath: `jobs/${jobId}/job_notes_attachments/${file.name}`,
            fileData,
            fileName: file.name,
            fileType: file.type,
        });

        append({ name: file.name, url: result.downloadUrl });
        toast({ title: "File Attached", description: `${file.name} has been attached.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload file.' });
    } finally {
        setIsUploading(false);
    }
  };


  async function onSubmit(data: z.infer<typeof jobNoteSchema>) {
    if (!firestore || !raisedByStaff) return;
    setIsSubmitting(true);

    try {
        const payload = {
            ...data,
            raisedBy: raisedByStaff.name,
            dateRaised: Timestamp.fromDate(data.dateRaised),
            attachments: data.attachments || [],
        };

        if (isEditMode && formId) {
            await setDoc(doc(firestore, 'job_packs', jobId, 'job_notes', formId), { ...payload, createdAt: formToEdit?.createdAt || serverTimestamp() }, { merge: true });
            toast({ title: "Note Updated" });
        } else {
            await addDoc(collection(firestore, 'job_packs', jobId, 'job_notes'), { ...payload, createdAt: serverTimestamp() });
            toast({ title: "Note Submitted" });
        }
        router.push(`/paperwork/${jobId}`);
    } catch (error) {
        console.error("Error submitting note:", error);
        toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  const isLoading = areJobsLoading || areStaffLoading || (!!formId && isFormLoading);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isViewMode ? 'View' : (isEditMode ? 'Edit' : 'Create')} Job Note</CardTitle>
        <CardDescription>For Job: {selectedJob?.jobNumber || '...'} at {selectedJob?.location || '...'}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Job Details</h3>
                <JobSelector jobs={allJobs || []} selectedJob={selectedJob} onSelectJob={(job) => {
                    setSelectedJob(job);
                    setValue('jobId', job?.id || '', { shouldValidate: true });
                }} disabled={isViewMode}/>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
                     <div><p className="font-medium text-muted-foreground">Client Name</p><p>{selectedJob?.clientName || 'N/A'}</p></div>
                     <div><p className="font-medium text-muted-foreground">Site Location</p><p>{selectedJob?.location || 'N/A'}</p></div>
                     <div><p className="font-medium text-muted-foreground">STMS</p><p>{selectedJob?.stms || 'N/A'}</p></div>
                </div>
            </div>
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Note Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <FormField control={form.control} name="noteType" render={({ field }) => (<FormItem><FormLabel>Job Note Type</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Safety">Safety</SelectItem><SelectItem value="Client Request">Client Request</SelectItem><SelectItem value="Variation">Variation</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="raisedById" render={() => (<FormItem><FormLabel>Raised By</FormLabel><StaffSelector staffList={staffList || []} selectedStaff={raisedByStaff} onSelectStaff={(staff) => { setRaisedByStaff(staff); setValue('raisedById', staff?.id || '', { shouldValidate: true }); }} placeholder="Select staff..." disabled={isViewMode}/><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="dateRaised" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date Raised</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isViewMode}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={isViewMode}/></PopoverContent></Popover><FormMessage /></FormItem>)} />
                </div>
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Note Description</FormLabel><FormControl><Textarea className="min-h-[150px]" disabled={isViewMode} {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="updates" render={({ field }) => (<FormItem><FormLabel>Note Updates</FormLabel><FormControl><Textarea className="min-h-[100px]" disabled={isViewMode} {...field} /></FormControl><FormMessage /></FormItem>)} />

             <div className="space-y-4">
                <FormLabel>Attach any Files (Invoices, Documents, Emails etc)</FormLabel>
                {!isViewMode && (
                    <div className="relative">
                        <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        <Button type="button" asChild variant="outline" className="w-full cursor-pointer">
                            <label htmlFor="file-upload" className="flex items-center justify-center gap-2">
                                {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}
                                {isUploading ? "Uploading..." : "Choose File"}
                            </label>
                        </Button>
                    </div>
                )}
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-sm">
                            <File className="h-4 w-4 flex-shrink-0" />
                            <a href={field.url} target="_blank" rel="noopener noreferrer" className="flex-grow truncate hover:underline">{field.name}</a>
                            {!isViewMode && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(index)}><Trash className="h-4 w-4 text-destructive"/></Button>}
                        </div>
                    ))}
                    {attachments && attachments.length === 0 && <p className="text-xs text-center text-muted-foreground py-2">No files attached.</p>}
                </div>
            </div>


          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Back</Button>
            {!isViewMode && 
              <Button type="submit" disabled={isSubmitting || isUploading}>
                  {(isSubmitting || isUploading) && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Save Changes" : "Submit Note"}
              </Button>
            }
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
