
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LoaderCircle,
  PlusCircle,
  Camera,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Job, SitePhoto } from '@/lib/data';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Image from 'next/image';

export default function SitePhotosPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [itemToDelete, setItemToDelete] = useState<SitePhoto | null>(null);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const photosRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return collection(firestore, 'job_packs', jobId, 'site_photos');
  }, [firestore, jobId]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: sitePhotoSubmissions, isLoading: areItemsLoading } = useCollection<SitePhoto>(photosRef);

  const isLoading = isJobLoading || areItemsLoading;

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    deleteDocumentNonBlocking(doc(firestore, 'job_packs', jobId, 'site_photos', itemToDelete.id));
    toast({
        variant: "destructive",
        title: "Photo Submission Deleted",
        description: `The photo submission from ${format(itemToDelete.createdAt.toDate(), 'PPP')} has been deleted.`,
    });
    setItemToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Site Photos</CardTitle>
            <CardDescription>
              Photos submitted for job {job?.jobNumber || '...'}.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/jobs/${jobId}/paperwork/site-photos/create`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Photos
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : sitePhotoSubmissions && sitePhotoSubmissions.length > 0 ? (
            <div className="space-y-6">
              {sitePhotoSubmissions.map((submission) => (
                <Card key={submission.id} className="overflow-hidden">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg">Submission from {format(submission.createdAt.toDate(), 'PPP')}</CardTitle>
                                <CardDescription>Submitted by {submission.submittedBy}</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setItemToDelete(submission)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {submission.photos.map((photo, index) => (
                            <div key={index} className="space-y-2">
                                <div className="aspect-video bg-muted relative rounded-md overflow-hidden">
                                    <Image src={photo.url} alt={photo.comment || `Site photo ${index + 1}`} layout="fill" objectFit="cover" />
                                </div>
                                {photo.comment && <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">{photo.comment}</p>}
                            </div>
                        ))}
                    </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Camera className="mx-auto h-12 w-12" />
              <p className="mt-4 font-semibold">No Photos Submitted</p>
              <p>Click "Add Photos" to submit the first batch for this job.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this photo submission and all images within it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
