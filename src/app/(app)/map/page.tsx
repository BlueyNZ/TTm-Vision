'use client';
import { Job } from "@/lib/data";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isPast } from "date-fns";
import { LoaderCircle, MapPin, UserSquare } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import dynamic from 'next/dynamic';
import './map.css';

// Dynamic import should be at the top level of the module.
const DynamicMapComponent = dynamic(() => import('@/components/map/map-component'), {
    ssr: false,
});


const getDisplayedStatus = (job: Job) => {
    const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
    if (job.status === 'Upcoming' && isPast(startDate)) {
      return 'In Progress';
    }
    return job.status;
};

export default function RealTimeMapPage() {
    const firestore = useFirestore();

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'job_packs'), where('status', 'in', ['Upcoming', 'In Progress']));
    }, [firestore]);

    const { data: jobData, isLoading } = useCollection<Job>(jobsQuery);
    
    const activeJobs = useMemo(() => {
        if (!jobData) return [];
        return jobData.filter(job => getDisplayedStatus(job) === 'In Progress');
    }, [jobData]);

    // useMemo is used inside the component to memoize the component itself
    const Map = useMemo(() => DynamicMapComponent, []);
    
    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                <div className="lg:col-span-2 h-full relative rounded-lg overflow-hidden border">
                    <Map />
                     <div className="absolute bottom-4 left-4 z-[1000]">
                        <h2 className="text-2xl font-bold text-white shadow-lg [text-shadow:_0_2px_4px_rgb(0_0_0_/_50%)]">Live Operations Map</h2>
                        <p className="text-white/90 shadow-sm [text-shadow:_0_1px_3px_rgb(0_0_0_/_40%)]">Showing {activeJobs.length} active job sites</p>
                    </div>
                </div>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Active Jobs</CardTitle>
                        <CardDescription>A list of all jobs currently in progress.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow p-0">
                        <ScrollArea className="h-[calc(100vh-14rem)]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <LoaderCircle className="h-8 w-8 animate-spin" />
                                </div>
                            ) : activeJobs.length > 0 ? (
                                <div className="space-y-4 p-6 pt-0">
                                    {activeJobs.map(job => (
                                        <Link href={`/jobs/${job.id}`} key={job.id} className="block border p-3 rounded-lg hover:bg-muted transition-colors">
                                            <p className="font-semibold">{job.jobNumber}</p>
                                            <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4"/>
                                                    <span>{job.location}</span>
                                                </div>
                                                 <div className="flex items-center gap-2">
                                                    <UserSquare className="h-4 w-4"/>
                                                    <span>STMS: {job.stms || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                                    <p>No jobs are currently in progress.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
