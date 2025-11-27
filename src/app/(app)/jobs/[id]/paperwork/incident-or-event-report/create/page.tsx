
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, IncidentReport, Staff } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useCollection } from "@/firebase/firestore/use-collection";

const incidentReportSchema = z.object({
  incidentDate: z.date({ required_error: "Incident date is required."}),
  incidentTime: z.string().min(1, "Incident time is required."),
  location: z.string().min(1, "Location is required."),
  description: z.string().min(1, "Description is required."),
  personsInvolved: z.string().min(1, "Please list persons involved."),
  witnesses: z.string().optional(),
  actionsTaken: z.string().min(1, "Please describe actions taken."),
});

export default function CreateIncidentReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const jobId = params.id as string;
  const editId = searchParams.get('edit');
  const viewId = searchParams.get('view');
  const formId = editId || viewId;
  const isEditMode = !!editId;
  const isViewMode = !!viewId;
  
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobRef = useMemoFirebase(() => (firestore && jobId) ? doc(firestore, 'job_packs', jobId) : null, [firestore, jobId]);
  const formRef = useMemoFirebase(() => (firestore && jobId && formId) ? doc(firestore, 'job_packs', jobId, 'incident_reports', formId) : null, [firestore, jobId, formId]);
  
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: formToEdit, isLoading: isFormLoading } = useDoc<IncidentReport>(formRef);
  const staffCollection = useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staffList, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  const currentUserStaff = useMemo(() => {
    if (!user || !staffList) return null;
    return staffList.find(s => s.email === user.email);
  }, [user, staffList]);

  const form = useForm<z.infer<typeof incidentReportSchema>>({
    resolver: zodResolver(incidentReportSchema),
    defaultValues: {
        incidentDate: new Date(),
        incidentTime: "",
        location: "",
        description: "",
        personsInvolved: "",
        witnesses: "",
        actionsTaken: ""
    },
  });

  useEffect(() => {
    if (formToEdit) {
      form.reset({
        ...formToEdit,
        incidentDate: formToEdit.incidentDate.toDate(),
      });
    } else if (job) {
        form.setValue('location', job.location);
    }
  }, [formToEdit, job, form]);

  async function onSubmit(data: z.infer<typeof incidentReportSchema>) {
    if (!firestore || !currentUserStaff) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    };
    setIsSubmitting(true);

    try {
        const payload = {
            ...data,
            jobId,
            incidentDate: Timestamp.fromDate(data.incidentDate),
            reportedBy: currentUserStaff.name,
            reportedById: currentUserStaff.id,
        };

        if (isEditMode && formId) {
            await setDoc(formRef!, { ...payload, createdAt: formToEdit?.createdAt || serverTimestamp() }, { merge: true });
            toast({ title: "Report Updated" });
        } else {
            await addDoc(collection(firestore, 'job_packs', jobId, 'incident_reports'), { ...payload, createdAt: serverTimestamp() });
            toast({ title: "Report Submitted" });
        }
        router.push(`/paperwork/${jobId}`);
    } catch (error) {
        console.error("Error submitting report:", error);
        toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  const isLoading = isJobLoading || isUserLoading || isStaffLoading || (!!formId && isFormLoading);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isViewMode ? 'View' : (isEditMode ? 'Edit' : 'Create')} Incident Report</CardTitle>
        <CardDescription>For Job: {job?.jobNumber} at {job?.location}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date of Incident</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isViewMode}>
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
                 <FormField control={form.control} name="incidentTime" render={({ field }) => (<FormItem><FormLabel>Time of Incident</FormLabel><FormControl><Input placeholder="e.g., 14:30" {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location of Incident</FormLabel><FormControl><Input {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Full Description of Incident</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="personsInvolved" render={({ field }) => (<FormItem><FormLabel>Persons Involved (include contact details if known)</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="witnesses" render={({ field }) => (<FormItem><FormLabel>Witnesses (include contact details if known)</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="actionsTaken" render={({ field }) => (<FormItem><FormLabel>Immediate Actions Taken</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)} />

          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Back</Button>
            {!isViewMode && 
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Save Changes" : "Submit Report"}
              </Button>
            }
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
