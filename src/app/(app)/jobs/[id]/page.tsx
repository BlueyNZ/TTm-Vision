
'use client';
import { useParams } from 'next/navigation';
import { jobData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Info, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const getStatusVariant = (status: (typeof jobData)[0]['status']) => {
  switch (status) {
    case 'Upcoming':
      return 'default';
    case 'In Progress':
      return 'success';
    case 'On Hold':
      return 'warning';
    case 'Completed':
      return 'outline';
    default:
      return 'secondary';
  }
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const job = jobData.find((j) => j.id === jobId);

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Job not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <MapPin className="h-8 w-8 text-muted-foreground" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{job.location}</h1>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Overview of the job assignment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Date & Time</p>
                    <p className="text-muted-foreground">{format(new Date(job.startDate), 'eeee, dd MMMM yyyy, p')}</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <User className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Site Traffic Management Supervisor (STMS)</p>
                    <p className="text-muted-foreground">{job.stms}</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Info className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Status</p>
                    <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
