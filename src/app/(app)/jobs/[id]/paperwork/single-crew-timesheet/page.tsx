
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, Timesheet } from "@/lib/data";
import { doc, Timestamp, addDoc, collection } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { LoaderCircle, Trash, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRef, useState } from "react";
import { SignaturePad, type SignaturePadRef } from "@/components/ui/signature-pad";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";


const timesheetSchema = z.object({
  signatureDataUrl: z.string().min(1, "A signature is required to submit the timesheet."),
});


export default function SingleCrewTimesheetPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);

  const form = useForm<z.infer<typeof timesheetSchema>>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      signatureDataUrl: "",
    },
  });

  const isLoading = isJobLoading || isUserLoading;

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
    form.setValue("signatureDataUrl", "", { shouldValidate: true });
  };

  const handleConfirmSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        const dataUrl = signaturePadRef.current.toDataURL();
        form.setValue("signatureDataUrl", dataUrl, { shouldValidate: true });
        setIsSignatureDialogOpen(false);
    } else {
        form.setError("signatureDataUrl", { type: "manual", message: "Please provide a signature before confirming." });
    }
  };

  async function onSubmit(data: z.infer<typeof timesheetSchema>) {
    if (!firestore || !jobId || !user?.displayName) return;

    setIsSubmitting(true);

    try {
        const timesheetPayload: Omit<Timesheet, 'id'> = {
            jobId: jobId,
            staffName: user.displayName,
            signatureDataUrl: data.signatureDataUrl,
            createdAt: Timestamp.now(),
        };

        const timesheetsCollectionRef = collection(firestore, 'job_packs', jobId, 'timesheets');
        await addDoc(timesheetsCollectionRef, timesheetPayload);

        toast({
            title: "Timesheet Submitted",
            description: `Timesheet for ${user.displayName} has been successfully submitted.`,
        });

        router.push(`/paperwork/${jobId}`);

    } catch (error) {
        console.error("Error submitting timesheet:", error);
        toast({ title: "Submission Failed", description: "Could not submit timesheet. Please try again.", variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
}

  const signatureDataUrlValue = form.watch("signatureDataUrl");

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
        <CardTitle>Single Crew Timesheet</CardTitle>
        <CardDescription>
          For Job: {job?.jobNumber || '...'} at {job?.location || '...'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
                control={form.control}
                name="signatureDataUrl"
                render={({ field }) => (
                    <FormItem>
                         <FormLabel>Sign Off</FormLabel>
                         <FormControl>
                           <div className="space-y-4">
                             <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        {signatureDataUrlValue ? (
                                            <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Timesheet Signed (Click to re-sign)</>
                                        ) : (
                                            "Sign Off Timesheet"
                                        )}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Sign Timesheet</DialogTitle>
                                        <DialogDescription>
                                            By signing, you confirm that the hours and allowances claimed are true and correct.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <SignaturePad 
                                            ref={signaturePadRef}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={handleClearSignature}>
                                            <Trash className="mr-2 h-4 w-4" />
                                            Clear
                                        </Button>
                                        <Button type="button" onClick={handleConfirmSignature}>
                                            Confirm Signature
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                             </Dialog>
                              {signatureDataUrlValue && (
                                <div className="p-4 border-dashed border-2 rounded-md flex justify-center items-center bg-muted/50">
                                    <Image src={signatureDataUrlValue} alt="Staff signature" width={300} height={100} className="bg-white shadow-sm"/>
                                </div>
                              )}
                           </div>
                         </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Submit Timesheet
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
