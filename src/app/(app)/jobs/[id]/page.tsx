
'use client';
import { useParams } from 'next/navigation';
import { jobData, Staff } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Info, MapPin, FileText, Edit, Users, UserSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [formattedDate, setFormattedDate] = useState('');
  const firestore = useFirestore();

  const job = jobData.find((j) => j.id === jobId);

  const staffCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);

  const { data: staffList } = useCollection<Staff>(staffCollection);

  const stms = staffList?.find(s => s.name === job?.stms);
  const tcs = staffList?.filter(s => job?.tcs.includes(s.name));


  useEffect(() => {
    if (job) {
      setFormattedDate(format(new Date(job.startDate), 'eeee, dd MMMM yyyy, p'));
    }
  }, [job]);


  if (!job) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Job not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{job.location}</h1>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/jobs/${job.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Job
            </Link>
          </Button>
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
                    <p className="text-muted-foreground">{formattedDate || 'Loading...'}</p>
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

      <Card>
          <CardHeader>
            <CardTitle>Assigned Personnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-start gap-4">
                <UserSquare className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Site Traffic Management Supervisor (STMS)</p>
                    {stms ? (
                      <div className="flex items-center gap-3 mt-2">
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://picsum.photos/seed/${stms.id}/200/200`} />
                              <AvatarFallback>{stms.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-medium text-sm">{stms.name}</p>
                              <p className="text-xs text-muted-foreground">{stms.role}</p>
                          </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-1">{job.stms || 'Not Assigned'}</p>
                    )}
                </div>
            </div>
            <div className="flex items-start gap-4">
                <Users className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">Traffic Controllers (TCs)</p>
                    {tcs && tcs.length > 0 ? (
                      <div className="mt-2 space-y-3">
                        {tcs.map(tc => (
                          <div key={tc.id} className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                  <AvatarImage src={`https://picsum.photos/seed/${tc.id}/200/200`} />
                                  <AvatarFallback>{tc.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="font-medium text-sm">{tc.name}</p>
                                  <p className="text-xs text-muted-foreground">{tc.role}</p>
                              </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-1">No traffic controllers assigned.</p>
                    )}
                </div>
            </div>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
                <FileText className="h-6 w-6 text-primary" />
                <p className="text-muted-foreground">{job.name}</p>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
