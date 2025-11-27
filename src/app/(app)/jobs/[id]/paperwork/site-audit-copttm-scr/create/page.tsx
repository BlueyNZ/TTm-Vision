
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, SiteAudit, Staff } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Calendar as CalendarIcon, CheckCircle, Signature as SignatureIcon, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useCollection } from "@/firebase/firestore/use-collection";
import { StaffSelector } from "@/components/staff/staff-selector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { SignaturePad, type SignaturePadRef } from "@/components/ui/signature-pad";
import Image from "next/image";

const siteAuditSchema = z.object({
  auditDate: z.date({ required_error: "Audit date is required." }),
  summary: z.string().min(1, "Audit summary is required."),
  correctiveActions: z.string().optional(),
  signatureDataUrl: z.string().min(1, "Auditor signature is required."),
});

export default function CreateSiteAuditPage() {
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
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [auditor, setAuditor] = useState<Staff | null>(null);

  const jobRef = useMemoFirebase(() => (firestore && jobId) ? doc(firestore, 'job_packs', jobId) : null, [firestore, jobId]);
  const formRef = useMemoFirebase(() => (firestore && jobId && formId) ? doc(firestore, 'job_packs', jobId, 'site_audits', formId) : null, [firestore, jobId, formId]);
  
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: formToEdit, isLoading: isFormLoading } = useDoc<SiteAudit>(formRef);
  const staffCollection = useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staffList, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  const currentUserStaff = useMemo(() => {
    if (!user || !staffList) return null;
    return staffList.find(s => s.email === user.email);
  }, [user, staffList]);

  const form = useForm<z.infer<typeof siteAuditSchema>>({
    resolver: zodResolver(siteAuditSchema),
    defaultValues: { auditDate: new Date(), summary: "", correctiveActions: "", signatureDataUrl: "" },
  });

  const signatureDataUrlValue = form.watch("signatureDataUrl");

  useEffect(() => {
    if (formToEdit) {
      const auditor = staffList?.find(s => s.id === formToEdit.auditorId);
      setAuditor(auditor || null);
      form.reset({
        ...formToEdit,
        auditDate: formToEdit.auditDate.toDate(),
      });
    }
  }, [formToEdit, form, staffList]);

  useEffect(() => {
    if (!formId && currentUserStaff) {
      setAuditor(currentUserStaff);
    }
  }, [currentUserStaff, formId]);

  const handleConfirmSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        const dataUrl = signaturePadRef.current.toDataURL();
        form.setValue("signatureDataUrl", dataUrl, { shouldValidate: true });
        setIsSignatureDialogOpen(false);
    } else {
        form.setError("signatureDataUrl", { type: "manual", message: "Please provide a signature." });
    }
  };

  async function onSubmit(data: z.infer<typeof siteAuditSchema>) {
    if (!firestore || !auditor) {
        toast({ title: "Error", description: "Auditor information is missing.", variant: "destructive" });
        return;
    };
    setIsSubmitting(true);

    try {
        const payload = {
            ...data,
            jobId,
            auditDate: Timestamp.fromDate(data.auditDate),
            auditorName: auditor.name,
            auditorId: auditor.id,
        };

        if (isEditMode && formId) {
            await setDoc(formRef!, { ...payload, createdAt: formToEdit?.createdAt || serverTimestamp() }, { merge: true });
            toast({ title: "Audit Updated" });
        } else {
            await addDoc(collection(firestore, 'job_packs', jobId, 'site_audits'), { ...payload, createdAt: serverTimestamp() });
            toast({ title: "Audit Submitted" });
        }
        router.push(`/paperwork/${jobId}`);
    } catch (error) {
        console.error("Error submitting audit:", error);
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
    <>
    <Card>
      <CardHeader>
        <CardTitle>{isViewMode ? 'View' : (isEditMode ? 'Edit' : 'Create')} Site Audit</CardTitle>
        <CardDescription>For Job: {job?.jobNumber} at {job?.location}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="auditDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date of Audit</FormLabel>
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
                <FormItem>
                    <FormLabel>Auditor</FormLabel>
                    <StaffSelector staffList={staffList || []} selectedStaff={auditor} onSelectStaff={setAuditor} placeholder="Select auditor..." disabled={isViewMode}/>
                </FormItem>
            </div>
            <FormField control={form.control} name="summary" render={({ field }) => (<FormItem><FormLabel>Audit Summary</FormLabel><FormControl><Textarea placeholder="Summary of audit findings..." className="min-h-[150px]" {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="correctiveActions" render={({ field }) => (<FormItem><FormLabel>Corrective Actions Required (if any)</FormLabel><FormControl><Textarea placeholder="Describe any corrective actions..." className="min-h-[150px]" {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)} />

            <FormField
                control={form.control}
                name="signatureDataUrl"
                render={() => (
                    <FormItem>
                         <FormLabel>Auditor Signature</FormLabel>
                         <FormControl>
                           <div className="space-y-2">
                            <Button type="button" variant="outline" className="w-full" onClick={() => setIsSignatureDialogOpen(true)} disabled={isViewMode}>
                                <SignatureIcon className="mr-2 h-4 w-4" />
                                {signatureDataUrlValue ? "Update Signature" : "Provide Signature"}
                            </Button>
                            {signatureDataUrlValue && (
                                <div className="p-2 border-dashed border-2 rounded-md flex justify-center items-center bg-muted/50">
                                    <Image src={signatureDataUrlValue} alt="Auditor signature" width={200} height={80} style={{ objectFit: 'contain' }} className="bg-white shadow-sm"/>
                                </div>
                            )}
                           </div>
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
                  {isEditMode ? "Save Changes" : "Submit Audit"}
              </Button>
            }
          </CardFooter>
        </form>
      </Form>
    </Card>

    <Dialog open={isSignatureDialogOpen} onOpenChange={isViewMode ? undefined : setIsSignatureDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Provide Signature</DialogTitle>
                <DialogDescription>
                    By signing, you confirm that this audit is accurate.
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
