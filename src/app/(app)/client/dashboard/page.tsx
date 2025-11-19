
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp, getDocs } from 'firebase/firestore';
import { Staff, Job, Client } from '@/lib/data';
import { useMemo, useState, useEffect } from 'react';
import { LoaderCircle, MapPin, Calendar, Circle } from 'lucide-react';
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getDisplayedStatus = (job: Job) => {
  const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
  // A 'Pending' job is always 'Pending' until approved.
  if (job.status === 'Pending') {
      return 'Pending';
  }
  if (job.status === 'Upcoming' && isPast(startDate)) {
    return 'In Progress';
  }
  return job.status;
};

const getStatusVariant = (status: Job['status']) => {
  switch (status) {
    case 'Upcoming':
      return 'secondary';
    case 'In Progress':
      return 'default';
    case 'Cancelled':
      return 'destructive';
    case 'Completed':
      return 'outline';
    case 'Pending':
      return 'default'; // Use default variant but custom color class
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'In Progress':
        return 'fill-success';
      case 'Cancelled':
        return 'fill-destructive';
      case 'Pending':
        return 'fill-yellow-500'; // Yellow for pending
      default:
        return 'fill-muted-foreground';
    }
};

export default function ClientDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [clientId, setClientId] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string | null>(null);
    const [isClientInfoLoading, setIsClientInfoLoading] = useState(true);
    
    // This effect is the core of the fix. It reliably finds the clientId.
    useEffect(() => {
        if (isUserLoading || !user || !firestore) return;

        const findClientInfo = async () => {
            setIsClientInfoLoading(true);

            // 1. Find the user's staff profile using their email.
            const staffQuery = query(collection(firestore, 'staff'), where('email', '==', user.email));
            const staffSnapshot = await getDocs(staffQuery);

            if (staffSnapshot.empty) {
                setIsClientInfoLoading(false);
                return;
            }
            const staffProfile = staffSnapshot.docs[0].data() as Staff;
            
            // 2. Determine the clientId.
            let foundClientId: string | null = null;
            if (staffProfile.accessLevel === 'Client Staff' && staffProfile.clientId) {
                // If they are Client Staff, the clientId is directly on their profile.
                foundClientId = staffProfile.clientId;
            } else if (staffProfile.accessLevel === 'Client') {
                 // If they are a primary Client admin, find the client doc linked by their UID.
                const clientQuery = query(collection(firestore, 'clients'), where('userId', '==', user.uid));
                const clientSnapshot = await getDocs(clientQuery);
                if (!clientSnapshot.empty) {
                    foundClientId = clientSnapshot.docs[0].id;
                }
            }
            
            setClientId(foundClientId);
            
            // 3. Fetch company name using the found clientId.
            if (foundClientId) {
                 const clientQuery = query(collection(firestore, 'clients'), where('__name__', '==', foundClientId));
                 const clientSnapshot = await getDocs(clientQuery);
                 if (!clientSnapshot.empty) {
                    setCompanyName((clientSnapshot.docs[0].data() as Client).name);
                 }
            }
            setIsClientInfoLoading(false);
        };
        
        findClientInfo();
    }, [user, isUserLoading, firestore]);
    
    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !clientId) return null;
        // Fetch all jobs for this client, including pending ones.
        return query(collection(firestore, 'job_packs'), where('clientId', '==', clientId));
    }, [firestore, clientId]);
    
    const { data: jobData, isLoading: isJobsLoading } = useCollection<Job>(jobsQuery);

    const sortedJobs = useMemo(() => {
        if (!jobData) return [];
        return [...jobData].sort((a, b) => {
            const dateA = a.startDate instanceof Timestamp ? a.startDate.toDate() : new Date(a.startDate);
            const dateB = b.startDate instanceof Timestamp ? b.startDate.toDate() : new Date(b.startDate);
            return dateB.getTime() - dateA.getTime();
        });
    }, [jobData]);
    
    const isLoading = isUserLoading || isClientInfoLoading || isJobsLoading;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome, {companyName || 'Client'}!</CardTitle>
                    <CardDescription>This is your client portal. Here's an overview of your current and upcoming jobs.</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Jobs</CardTitle>
                    <CardDescription>All jobs currently associated with your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <LoaderCircle className="h-8 w-8 animate-spin" />
                        </div>
                    ) : sortedJobs && sortedJobs.length > 0 ? (
                        <div className="space-y-4">
                            {sortedJobs.map(job => {
                                const displayedStatus = getDisplayedStatus(job);
                                const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);

                                return (
                                    <Link href={`/jobs/${job.id}`} key={job.id} className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                 <p className="font-semibold text-base flex items-center gap-2">
                                                    {job.jobNumber || `Request from ${format(startDate, 'dd/MM/yy')}`}
                                                </p>
                                                <p className="text-lg flex items-center gap-2">
                                                     <MapPin className="h-5 w-5 text-primary"/>
                                                    {job.location}
                                                </p>
                                            </div>
                                            <Badge 
                                                variant={getStatusVariant(displayedStatus)}
                                                className={cn(
                                                    "flex items-center gap-2 w-fit", 
                                                    displayedStatus === 'In Progress' && 'bg-success/20 text-green-800 border-success',
                                                    displayedStatus === 'Pending' && 'bg-yellow-500/20 text-yellow-800 border-yellow-500'
                                                )}
                                            >
                                                <Circle className={cn("h-2 w-2", getStatusColor(displayedStatus))}/>
                                                {displayedStatus}
                                            </Badge>
                                        </div>
                                        <div className="border-t my-3"></div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4"/>
                                            {format(startDate, 'eeee, dd MMM yyyy')}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">You do not have any active jobs at the moment.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    
