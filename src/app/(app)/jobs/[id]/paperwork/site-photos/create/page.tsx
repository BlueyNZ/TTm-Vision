
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, SitePhoto, Staff } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useCollection } from "@/firebase/firestore/use-collection";
import Image from "next/image";
import { uploadFile } from "@/ai/flows/upload-file-flow";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


const sitePhotoSchema = z.object({
  description: z.string().min(1, "Description cannot be empty."),
  photoDataUrl: z.string().min(1, "A photo is required."),
});

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
});


export default function CreateSitePhotoPage() {
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);


  const jobRef = useMemoFirebase(() => (firestore && jobId) ? doc(firestore, 'job_packs', jobId) : null, [firestore, jobId]);
  const formRef = useMemoFirebase(() => (firestore && jobId && formId) ? doc(firestore, 'job_packs', jobId, 'site_photos', formId) : null, [firestore, jobId, formId]);
  
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: formToEdit, isLoading: isFormLoading } = useDoc<SitePhoto>(formRef);
  const staffCollection = useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staffList, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  const currentUserStaff = useMemo(() => {
    if (!user || !staffList) return null;
    return staffList.find(s => s.email === user.email);
  }, [user, staffList]);

  const form = useForm<z.infer<typeof sitePhotoSchema>>({
    resolver: zodResolver(sitePhotoSchema),
    defaultValues: { description: "", photoDataUrl: "" },
  });

  const photoDataUrl = form.watch("photoDataUrl");

  // Camera logic
  useEffect(() => {
    if (!showCamera) {
      // Stop camera stream when not in use
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      return;
    }

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions.' });
      }
    };
    getCameraPermission();
  }, [showCamera, toast]);


  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            form.setValue('photoDataUrl', dataUrl, { shouldValidate: true });
            setShowCamera(false);
        }
    }
  };


  useEffect(() => {
    if (formToEdit) {
      form.reset({
        description: formToEdit.description,
        photoDataUrl: formToEdit.photoUrl,
      });
    }
  }, [formToEdit, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setPhotoFile(file);
        const dataUrl = await toBase64(file);
        form.setValue('photoDataUrl', dataUrl, { shouldValidate: true });
    }
  };

  async function onSubmit(data: z.infer<typeof sitePhotoSchema>) {
    if (!firestore || !currentUserStaff) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    };
    setIsSubmitting(true);

    try {
        let finalPhotoUrl = data.photoDataUrl;

        // If it's a new photo (not just an existing URL), upload it
        if (data.photoDataUrl.startsWith('data:image')) {
            const fileName = `site_photo_${Date.now()}.jpg`;
            const uploadResult = await uploadFile({
                filePath: `jobs/${jobId}/site_photos/${fileName}`,
                fileData: data.photoDataUrl,
                fileName: fileName,
                fileType: 'image/jpeg'
            });
            finalPhotoUrl = uploadResult.downloadUrl;
        }

        const payload = {
            jobId,
            description: data.description,
            photoUrl: finalPhotoUrl,
            takenBy: currentUserStaff.name,
            takenById: currentUserStaff.id,
        };

        if (isEditMode && formId) {
            await setDoc(formRef!, { ...payload, createdAt: formToEdit?.createdAt || serverTimestamp() }, { merge: true });
            toast({ title: "Photo Updated" });
        } else {
            await addDoc(collection(firestore, 'job_packs', jobId, 'site_photos'), { ...payload, createdAt: serverTimestamp() });
            toast({ title: "Photo Submitted" });
        }
        router.push(`/paperwork/${jobId}`);
    } catch (error) {
        console.error("Error submitting photo:", error);
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
        <CardTitle>{isViewMode ? 'View' : (isEditMode ? 'Edit' : 'Take')} Site Photo</CardTitle>
        <CardDescription>For Job: {job?.jobNumber} at {job?.location}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <FormField
                name="photoDataUrl"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                         <FormLabel>Photo</FormLabel>
                         <FormControl>
                            <div className="space-y-4">
                                {photoDataUrl ? (
                                    <div className="relative aspect-video w-full max-w-lg mx-auto bg-muted rounded-md overflow-hidden">
                                        <Image src={photoDataUrl} alt="Site photo preview" layout="fill" objectFit="contain" />
                                        {!isViewMode && (
                                            <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => form.setValue('photoDataUrl', '', { shouldValidate: true })}>
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed rounded-md gap-2">
                                        <Camera className="h-10 w-10 text-muted-foreground"/>
                                        <p className="text-muted-foreground">No photo selected</p>
                                    </div>
                                )}
                                {!isViewMode && !photoDataUrl && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button type="button" onClick={() => setShowCamera(true)}><Camera className="mr-2 h-4 w-4" /> Use Camera</Button>
                                        <Button type="button" asChild><label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center"><Upload className="mr-2 h-4 w-4" /> Upload File</label></Button>
                                        <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </div>
                                )}
                            </div>
                         </FormControl>
                         <FormMessage />
                    </FormItem>
                )}
             />

            {showCamera && (
                <div className="space-y-4">
                    <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                    <canvas ref={canvasRef} className="hidden" />
                    {hasCameraPermission === false && (
                         <Alert variant="destructive">
                            <AlertTitle>Camera Access Denied</AlertTitle>
                            <AlertDescription>Please allow camera access in your browser settings to use this feature.</AlertDescription>
                        </Alert>
                    )}
                    <div className="flex gap-4">
                        <Button type="button" onClick={takePicture} disabled={!hasCameraPermission}>Take Picture</Button>
                        <Button type="button" variant="ghost" onClick={() => setShowCamera(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Pre-work photo of site setup..."
                      className="min-h-[100px]"
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
                  {isEditMode ? "Save Changes" : "Submit Photo"}
              </Button>
            }
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
