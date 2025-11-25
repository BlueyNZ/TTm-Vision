
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, Staff, TmpCheckingProcess } from "@/lib/data";
import { doc, Timestamp, addDoc, collection } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { LoaderCircle, Trash, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { StaffSelector } from "@/components/staff/staff-selector";
import { SignaturePad, SignaturePadRef } from "@/components/ui/signature-pad";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";


const checkSchema = z.object({
  status: z.enum(['Yes', 'No', 'N/A']),
});

const sectionSchema = z.object({
  comment: z.string().optional(),
});

const tmpCheckingProcessSchema = z.object({
  jobId: z.string(),
  tmpNumber: z.string().min(1, "TMP Number is required."),
  tmdNumber: z.string().min(1, "TMD No(s) is required."),
  tmpType: z.enum(['GENERIC', 'SITE_SPECIFIC'], { required_error: "You must select a TMP type."}),
  locationDetails: sectionSchema.extend({
    correctRoadLevel: checkSchema,
    trafficCountConfirmed: checkSchema,
  }),
  shape: sectionSchema.extend({
    intersections: checkSchema,
    verticalCurves: checkSchema,
    horizontalCurves: checkSchema,
    sufficientAdvanceWarning: checkSchema,
  }),
  directionAndProtection: sectionSchema.extend({
    sufficientLength: checkSchema,
    sufficientWidth: checkSchema,
    adequateSightDistance: checkSchema,
    sufficientRoomForTtc: checkSchema,
  }),
  requiredSpeedRestrictions: sectionSchema.extend({
    correctTsl: checkSchema,
  }),
  plantAndEquipment: sectionSchema.extend({
    plantFits: checkSchema,
  }),
  personalSafety: sectionSchema.extend({
    workersInWorkingSpace: checkSchema,
  }),
  layoutDiagrams: sectionSchema.extend({
    diagramsMatch: checkSchema,
    manageHeavyVehicles: checkSchema,
    changesRequired: checkSchema,
  }),
  completedBy: z.array(z.object({
    staffId: z.string(),
    staffName: z.string(),
    signatureDataUrl: z.string().min(1, "Signature is required."),
    dateSigned: z.date(),
    qualification: z.string(),
  })).min(1, "At least one signature is required."),
});

type SectionCheckProps = {
  form: any;
  sectionName: keyof z.infer<typeof tmpCheckingProcessSchema>;
  title: string;
  checks: { name: string; label: string }[];
  isSiteSpecific?: boolean;
};

const SectionCheck = ({ form, sectionName, title, checks, isSiteSpecific = false }: SectionCheckProps) => {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h4 className="font-semibold">{title}</h4>
      <div className="space-y-3">
        <p className="text-sm font-medium">Points to consider</p>
        {checks.map(check => (
          <FormField
            key={check.name}
            control={form.control}
            name={`${sectionName}.${check.name}.status`}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-3">
                <FormLabel className="text-sm">{check.label}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex space-x-2"
                  >
                    <FormItem className="flex items-center space-x-1.5"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="text-xs font-normal">Yes</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-1.5"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="text-xs font-normal">No</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-1.5"><FormControl><RadioGroupItem value="N/A" /></FormControl><FormLabel className="text-xs font-normal">N/A</FormLabel></FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </div>
       {isSiteSpecific && sectionName === 'shape' && (
         <p className="text-sm text-muted-foreground p-1">Are the following catered for in the generic TMP?</p>
      )}
      <FormField
        control={form.control}
        name={`${sectionName}.comment`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Comment / Mitigation</FormLabel>
            <FormControl><Textarea placeholder="Add comments or mitigation strategies..." {...field} /></FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};


export default function PreInstallationProcessPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const [staffForSignature, setStaffForSignature] = useState<Staff | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);

  const jobRef = useMemoFirebase(() => (firestore && jobId) ? doc(firestore, 'job_packs', jobId) : null, [firestore, jobId]);
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);

  const staffCollection = useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staffList, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  const form = useForm<z.infer<typeof tmpCheckingProcessSchema>>({
    resolver: zodResolver(tmpCheckingProcessSchema),
    defaultValues: {
      jobId: jobId,
      tmpNumber: "",
      tmdNumber: "",
      locationDetails: { correctRoadLevel: { status: 'N/A' }, trafficCountConfirmed: { status: 'N/A' }, comment: "" },
      shape: { intersections: { status: 'N/A' }, verticalCurves: { status: 'N/A' }, horizontalCurves: { status: 'N/A' }, sufficientAdvanceWarning: { status: 'N/A' }, comment: "" },
      directionAndProtection: { sufficientLength: { status: 'N/A' }, sufficientWidth: { status: 'N/A' }, adequateSightDistance: { status: 'N/A' }, sufficientRoomForTtc: { status: 'N/A' }, comment: "" },
      requiredSpeedRestrictions: { correctTsl: { status: 'N/A' }, comment: "" },
      plantAndEquipment: { plantFits: { status: 'N/A' }, comment: "" },
      personalSafety: { workersInWorkingSpace: { status: 'N/A' }, comment: "" },
      layoutDiagrams: { diagramsMatch: { status: 'N/A' }, manageHeavyVehicles: { status: 'N/A' }, changesRequired: { status: 'N/A' }, comment: "" },
      completedBy: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "completedBy"
  });

  const tmpType = form.watch('tmpType');
  const isLoading = isJobLoading || isStaffLoading;

  const handleOpenSignatureDialog = (staff: Staff | null) => {
    if (staff) {
      setStaffForSignature(staff);
      setIsSignatureDialogOpen(true);
    }
  };

  const handleConfirmSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty() && staffForSignature) {
      const signatureDataUrl = signaturePadRef.current.toDataURL();
      const qualification = staffForSignature.certifications.map(c => c.name).join(', ') || 'N/A';
      
      append({
        staffId: staffForSignature.id,
        staffName: staffForSignature.name,
        signatureDataUrl: signatureDataUrl,
        dateSigned: new Date(),
        qualification: qualification,
      });
      
      setIsSignatureDialogOpen(false);
      setStaffForSignature(null);
      signaturePadRef.current.clear();
    } else {
        toast({ title: "Signature Required", description: "Please provide a signature.", variant: "destructive"})
    }
  };

  async function onSubmit(data: z.infer<typeof tmpCheckingProcessSchema>) {
    if (!firestore || !jobId) return;
    setIsSubmitting(true);
    try {
        const payload: Omit<TmpCheckingProcess, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
            ...data,
            completedBy: data.completedBy.map(signer => ({...signer, dateSigned: Timestamp.fromDate(signer.dateSigned)})),
            createdAt: Timestamp.now(),
        };

        await addDoc(collection(firestore, 'job_packs', jobId, 'tmp_checking_processes'), payload);

        toast({
            title: "TMP Checking Process Submitted",
            description: "The form has been successfully saved.",
        });
        router.push(`/jobs/${jobId}/paperwork`);

    } catch (error) {
        console.error("Error submitting form:", error);
        toast({ title: "Submission Failed", description: "An error occurred. Please try again.", variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Installation Process</CardTitle>
        <CardDescription>CoPTTM Checking Process for TMPs: APR 2019</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Job Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><span className="font-medium">Job No:</span> {job?.jobNumber}</p>
                <p><span className="font-medium">Client:</span> {job?.clientName}</p>
                <p className="md:col-span-2"><span className="font-medium">Location:</span> {job?.location}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="tmpNumber" render={({ field }) => (<FormItem><FormLabel>TMP Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="tmdNumber" render={({ field }) => (<FormItem><FormLabel>TMD No(s)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField
                control={form.control} name="tmpType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Select the type of TMP being used on this site</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="GENERIC" /></FormControl><FormLabel className="font-normal">Generic TMP</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="SITE_SPECIFIC" /></FormControl><FormLabel className="font-normal">Site Specific TMP</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {tmpType === 'SITE_SPECIFIC' && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Location Details (Site Specific)</h3>
                    <div className="rounded-lg border p-4 text-center text-muted-foreground bg-muted/30">
                        <p>This section will be automatically populated with data when you add them using the "Add Location" button or if you have already added them via the On-Site Record, the location details will appear after saving the TMP Checking Process</p>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Street Name</TableHead>
                                <TableHead>RP</TableHead>
                                <TableHead>Suburb</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">No locations added.</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <Button type="button" variant="outline" size="sm" disabled><PlusCircle className="mr-2 h-4 w-4" /> Add Location</Button>
                </div>
            )}
            
            <SectionCheck form={form} sectionName="locationDetails" title="Road Level" isSiteSpecific={tmpType === 'SITE_SPECIFIC'} checks={[ { name: 'correctRoadLevel', label: 'Is this at the correct road level?' }, { name: 'trafficCountConfirmed', label: 'Does your traffic count confirm the traffic volume in the TMP?' } ]} />
            <SectionCheck form={form} sectionName="shape" title="Shape" isSiteSpecific={tmpType === 'SITE_SPECIFIC'} checks={[ { name: 'intersections', label: 'Intersections' }, { name: 'verticalCurves', label: 'Vertical Curves (hills)' }, { name: 'horizontalCurves', label: 'Horizontal Curves (corners)' }, { name: 'sufficientAdvanceWarning', label: 'Sufficient advance warning' } ]} />
            <SectionCheck form={form} sectionName="directionAndProtection" title="Direction and Protection" isSiteSpecific={tmpType === 'SITE_SPECIFIC'} checks={[ { name: 'sufficientLength', label: 'Sufficient length to place the planned direction and protection' }, { name: 'sufficientWidth', label: 'Sufficient road width to place the planned direction and protection i.e. minimum lane width is 2.75m and protection' }, { name: 'adequateSightDistance', label: 'Adequate sight distance on both sides' }, { name: 'sufficientRoomForTtc', label: 'Sufficient room to accommodate required positive traffic control' } ]} />
            <SectionCheck form={form} sectionName="requiredSpeedRestrictions" title="Required Speed Restrictions" isSiteSpecific={tmpType === 'SITE_SPECIFIC'} checks={[ { name: 'correctTsl', label: 'Has the correct TSL been selected for the work activity and worksite?' } ]} />
            <SectionCheck form={form} sectionName="plantAndEquipment" title="Plant and equipment" isSiteSpecific={tmpType === 'SITE_SPECIFIC'} checks={[ { name: 'plantFits', label: 'Will plant and equipment fit within the designated working space?' } ]} />
            <SectionCheck form={form} sectionName="personalSafety" title="Personal safety" isSiteSpecific={tmpType === 'SITE_SPECIFIC'} checks={[ { name: 'workersInWorkingSpace', label: 'Are all workers able to carry out their work within the designated working space?' } ]} />
            <SectionCheck form={form} sectionName="layoutDiagrams" title="Layout diagrams" isSiteSpecific={tmpType === 'SITE_SPECIFIC'} checks={[ { name: 'diagramsMatch', label: 'Does the diagram(s) match the road environment at the site?' }, { name: 'manageHeavyVehicles', label: 'Will the installed TTM manage heavy vehicles passing through the worksite?' }, { name: 'changesRequired', label: 'Are any changes required to the TMD?' } ]} />


            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Completed By</h3>
                <FormMessage>{form.formState.errors.completedBy?.message}</FormMessage>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div className="flex items-center gap-3">
                                <Image src={field.signatureDataUrl} alt="Signature" width={100} height={40} className="bg-white rounded-sm" />
                                <div>
                                    <p className="font-medium">{field.staffName}</p>
                                    <p className="text-xs text-muted-foreground">{field.qualification}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Label>Add Signatory</Label>
                <StaffSelector 
                    staffList={staffList || []}
                    onSelectStaff={handleOpenSignatureDialog}
                    placeholder="Select staff member to sign..."
                    disabledIds={fields.map(f => f.staffId)}
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
       <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Signature for {staffForSignature?.name}</DialogTitle>
                  <DialogDescription>
                      By signing, you confirm you have participated in this TMP checking process.
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
    </Card>
  );
}
