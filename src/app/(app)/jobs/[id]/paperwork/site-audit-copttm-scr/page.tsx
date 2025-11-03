
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Job } from "@/lib/data";
import { doc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export default function SiteAuditCopttmScrPage() {
  const params = useParams();
  const jobId = params.id as string;
  const firestore = useFirestore();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const { data: job, isLoading } = useDoc<Job>(jobRef);

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
        <CardTitle>Site Audit (COPTTM SCR)</CardTitle>
        <CardDescription>
          For Job: {job?.jobNumber || '...'} at {job?.location || '...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This page is under construction. Please check back later.</p>
      </CardContent>
    </Card>
  );
}
