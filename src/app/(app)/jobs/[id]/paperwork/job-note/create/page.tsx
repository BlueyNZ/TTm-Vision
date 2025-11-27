
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, JobNote, Staff } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useCollection } from "@/firebase/firestore/use-collection";

const jobNoteSchema = z.object({
  note: z.string().min(1, "Note cannot be empty."),
});

export default function CreateJobNotePage() {
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
  const formRef = useMemoFirebase(() => (firestore && jobId && formId) ? doc(firestore, 'job_packs', jobId, 'job_notes', formId) : null, [firestore, jobId, formId]);
  
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: formToEdit, isLoading: isFormLoading } = useDoc<JobNote>(formRef);
  const staffCollection = useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staffList, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  const currentUserStaff = useMemo(() => {
    if (!user || !staffList) return null;
    return staffList.find(s => s.email === user.email);
  }, [user, staffList]);

  const form = useForm<z.infer<typeof jobNoteSchema>>({
    resolver: zodResolver(jobNoteSchema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    if (formToEdit) {
      form.reset({
        note: formToEdit.note,
      });
    }
  }, [formToEdit, form]);

  async function onSubmit(data: z.infer<typeof jobNoteSchema>) {
    if (!firestore || !currentUserStaff) {
        toast({ title: "Error", description: "You must be logged in to submit a note.", variant: "destructive" });
        return;
    };
    setIsSubmitting(true);

    try {
        const payload = {
            ...data,
            jobId,
            createdBy: currentUserStaff.name,
            createdById: currentUserStaff.id,
        };

        if (isEditMode && formId) {
            await setDoc(formRef!, { ...payload, createdAt: formToEdit?.createdAt || serverTimestamp() }, { merge: true });
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

  const isLoading = isJobLoading || isUserLoading || isStaffLoading || (!!formId && isFormLoading);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isViewMode ? 'View' : (isEditMode ? 'Edit' : 'Create')} Job Note</CardTitle>
        <CardDescription>For Job: {job?.jobNumber} at {job?.location}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any relevant notes for this job..."
                      className="min-h-[200px]"
                      disabled={isViewMode}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Back</Button>
            {!isViewMode && 
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Save Changes" : "Submit Note"}
              </Button>
            }
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
