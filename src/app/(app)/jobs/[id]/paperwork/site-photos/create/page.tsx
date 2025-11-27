
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Job, SitePhoto, Staff } from "@/lib/data";
import { doc, Timestamp, addDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Camera, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
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
import { format } from "date-fns";
import { JobSelector } from "@/components/jobs/job-selector";


const photoSchema = z.object({
  file: z.any().optional(), // Store file temporarily
  dataUrl: z.string().optional(),
  comment: z.string().optional(),
});

const sitePhotosSchema = z.object({
  jobId: z.string(),
  photos: z.array(photoSchema).max(4),
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
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: allJobs, isLoading: areJobsLoading } = useCollection<Job>(useMemoFirebase(() => firestore ? collection(firestore, 'job_packs') : null, [firestore]));
  const { data: staffList, isLoading: areStaffLoading } = useCollection<Staff>(useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]));

  const currentUserStaff = useMemo(() => {
    if (!user || !staffList) return null;
    return staffList.find(s => s.email === user.email);
  }, [user, staffList]);

  const form = useForm<z.infer<typeof sitePhotosSchema>>({
    resolver: zodResolver(sitePhotosSchema),
    defaultValues: {
      jobId: jobId,
      photos: Array(4).fill({ comment: '' }),
    },
  });

  const { control, setValue, watch } = form;
  const { fields } = useFieldArray({
    control,
    name: "photos"
  });

  useEffect(() => {
    if (allJobs && jobId) {
      const job = allJobs.find(j => j.id === jobId);
      if(job) setSelectedJob(job);
    }
  }, [allJobs, jobId]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const dataUrl = await toBase64(file);
      setValue(`photos.${index}.file`, file);
      setValue(`photos.${index}.dataUrl`, dataUrl);
    }
  };

  async function onSubmit(data: z.infer<typeof sitePhotosSchema>) {
    if (!firestore || !currentUserStaff) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    };
    if (data.photos.every(p => !p.dataUrl)) {
        toast({ title: "No Photos", description: "Please upload at least one photo.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    setIsUploading(true);

    try {
        const uploadedPhotos: { url: string; comment: string }[] = [];

        for (const photo of data.photos) {
            if (photo.file && photo.dataUrl) {
                 const fileName = `site_photo_${Date.now()}_${photo.file.name}`;
                 const uploadResult = await uploadFile({
                    filePath: `jobs/${jobId}/site_photos/${fileName}`,
                    fileData: photo.dataUrl,
                    fileName: fileName,
                    fileType: photo.file.type
                });
                uploadedPhotos.push({
                    url: uploadResult.downloadUrl,
                    comment: photo.comment || ''
                });
            }
        }
        
        setIsUploading(false);

        if (uploadedPhotos.length > 0) {
            const payload: Omit<SitePhoto, 'id'> = {
                jobId: data.jobId,
                photos: uploadedPhotos,
                submittedBy: currentUserStaff.name,
                submittedById: currentUserStaff.id,
                createdAt: Timestamp.now(),
            };
            await addDoc(collection(firestore, 'job_packs', jobId, 'site_photos'), payload);
            toast({ title: "Photos Submitted Successfully" });
            router.push(`/jobs/${jobId}/paperwork/site-photos`);
        } else {
             toast({ title: "No New Photos", description: "No new photos were uploaded.", variant: 'default' });
        }
    } catch (error) {
        console.error("Error submitting photos:", error);
        toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setIsUploading(false);
    }
  }

  const isLoading = areJobsLoading || areStaffLoading || isUserLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Site Photo Submission</CardTitle>
        <CardDescription>Add up to four photos with comments for this job.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Job Details</h3>
                <JobSelector jobs={allJobs || []} selectedJob={selectedJob} onSelectJob={(job) => {
                    setSelectedJob(job);
                    setValue('jobId', job?.id || '');
                }} />
                {selectedJob && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
                        <div><p className="font-medium text-muted-foreground">Job Date</p><p>{selectedJob.startDate instanceof Timestamp ? format(selectedJob.startDate.toDate(), "dd/MM/yyyy") : 'N/A'}</p></div>
                        <div><p className="font-medium text-muted-foreground">STMS</p><p>{selectedJob?.stms || 'N/A'}</p></div>
                        <div><p className="font-medium text-muted-foreground">Client Name</p><p>{selectedJob?.clientName || 'N/A'}</p></div>
                        <div className="lg:col-span-3"><p className="font-medium text-muted-foreground">Site Location</p><p>{selectedJob?.location || 'N/A'}</p></div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Site Photos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fields.map((field, index) => {
                      const photoUrl = watch(`photos.${index}.dataUrl`);
                      return (
                        <div key={field.id} className="space-y-2 p-4 border rounded-md">
                            <FormLabel>Photo {index + 1}</FormLabel>
                            {photoUrl ? (
                                 <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                                    <Image src={photoUrl} alt={`Preview ${index + 1}`} layout="fill" objectFit="contain" />
                                     <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setValue(`photos.${index}.dataUrl`, '')}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 w-full border-2 border-dashed rounded-md">
                                    <label htmlFor={`photo-upload-${index}`} className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                                        <Camera className="h-8 w-8"/>
                                        <span>Choose File</span>
                                    </label>
                                    <Input id={`photo-upload-${index}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, index)} />
                                </div>
                            )}
                            <FormField
                                control={control}
                                name={`photos.${index}.comment`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Photo {index + 1} Comment</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder={`Comment for photo ${index + 1}...`} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                      )
                    })}
                </div>
            </div>

          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {(isSubmitting || isUploading) && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Uploading...' : isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
