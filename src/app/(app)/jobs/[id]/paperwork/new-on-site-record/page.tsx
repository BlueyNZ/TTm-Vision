
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, Staff, OnSiteRecord } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { LoaderCircle, PlusCircle, Trash, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useCollection } from "@/firebase/firestore/use-collection";
import { StaffSelector } from "@/components/staff/staff-selector";
import { SignaturePad, SignaturePadRef } from "@/components/ui/signature-pad";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


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
});


export default function NewOnSiteRecordPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const firestore = useFirestore();

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    },
  });

  const { watch, setValue } = form;
  const isStmsInChargeOfWorkingSpace = watch('isStmsInChargeOfWorkingSpace');

  useEffect(() => {
    if (selectedStms) {
      setValue('stmsInChargeId', selectedStms.id);
    }
  }, [selectedStms, setValue]);

  useEffect(() => {
    if(job?.startDate) {
        const date = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
        setValue('jobDate', date);
    }
  }, [job, setValue]);

  async function onSubmit(data: z.infer<typeof onSiteRecordSchema>) {
    console.log("Form data:", data);
    toast({ title: "Form is under construction.", description: "Saving is not yet implemented."});
  }

  const isLoading = isJobLoading || isStaffLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
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
                <h3 className="font-semibold text-lg border-b pb-2">Location Details</h3>
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Location details table will be implemented here.</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">TTM STMS</h3>
                 <FormField
                    control={form.control}
                    name="stmsInChargeId"
                    render={({ field }) => (
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
                 {/* Signature placeholder */}
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>STMS Signature pad will be here.</p>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Working Space</h3>
                <FormField
                    control={form.control}
                    name="isStmsInChargeOfWorkingSpace"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
                        <FormField control={form.control} name="workingSpacePerson" render={({ field }) => (<FormItem><FormLabel>Person responsible for working space</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="workingSpaceContact" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                         {/* Signature placeholder */}
                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>Working Space Signature pad will be here.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">TTM STMS Handover</h3>
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Handover functionality will be implemented here.</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Delegation</h3>
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Delegation functionality will be implemented here.</p>
                </div>
            </div>
            
             <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Temporary Speed Limits Details</h3>
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>TSL management will be implemented here.</p>
                    <Button type="button" variant="outline" size="sm" className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/> Add TSL</Button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Worksite Monitoring</h3>
                 <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Worksite monitoring checks will be listed here.</p>
                     <Button type="button" variant="outline" size="sm" className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/> Add Site Check</Button>
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
  );
}
