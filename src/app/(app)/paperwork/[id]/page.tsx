
'use client';
import { useParams, useRouter } from 'next/navigation';
import { Job, Timesheet, TruckInspection } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { LoaderCircle, FileText, Circle } from 'lucide-react';
import Link from 'next/link';

const paperworkLinks = [
    { title: 'VIEW & EDIT Timesheets', href: 'timesheets' },
    { title: 'Truck Inspections', href: 'truck-inspections' },
    { title: 'Hazard ID', href: 'hazard-id' },
    { title: 'Hazard ID (NZGTTM)', href: 'hazard-id-nzgttm' },
    { title: 'TMP Checking Process', href: 'pre-installation-process' },
    { title: 'VIEW/EDIT On-Site Record (CoPTTM)', href: 'new-on-site-record' },
    { title: 'CREATE Mobile Ops On-Site Record', href: 'mobile-ops-on-site-record' },
    { title: 'CREATE Job Note', href: 'job-note' },
    { title: 'Take Site Photos', href: '#' },
    { title: 'CREATE Incident or Event Report', href: 'incident-or-event-report' },
    { title: 'CREATE Site Audit (CoPTTM SCR)', href: 'site-audit-copttm-scr' },
];

export default function PaperworkMenuPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;
    const firestore = useFirestore();

    const jobRef = useMemoFirebase(() => {
        if (!firestore || !jobId) return null;
        return doc(firestore, 'job_packs', jobId);
    }, [firestore, jobId]);

    const timesheetsRef = useMemoFirebase(() => {
        if (!firestore || !jobId) return null;
        return collection(firestore, 'job_packs', jobId, 'timesheets');
    }, [firestore, jobId]);
    
    const truckInspectionsRef = useMemoFirebase(() => {
        if (!firestore || !jobId) return null;
        return collection(firestore, 'job_packs', jobId, 'truck_inspections');
    }, [firestore, jobId]);

    const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
    const { data: timesheets, isLoading: areTimesheetsLoading } = useCollection<Timesheet>(timesheetsRef);
    const { data: truckInspections, isLoading: areInspectionsLoading } = useCollection<TruckInspection>(truckInspectionsRef);

    const isLoading = isJobLoading || areTimesheetsLoading || areInspectionsLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!job) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">Job Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The job you are looking for does not exist or could not be loaded.</p>
                </CardContent>
            </Card>
        );
    }

    const completedTimesheets = timesheets?.length || 0;
    const completedInspections = truckInspections?.length || 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Paperwork Menu</CardTitle>
                <CardDescription>
                    Select a form for job <span className="font-semibold">{job.jobNumber}</span> at <span className="font-semibold">{job.location}</span>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paperworkLinks.map((link) => {
                        let count = -1; // Default to not show count
                        let statusText = "Not yet completed";
                        let isCompleted = false;

                        if (link.href === 'timesheets') {
                            count = completedTimesheets;
                            statusText = `${count} timesheet${count === 1 ? '' : 's'} completed`;
                            isCompleted = count > 0;
                        } else if (link.href === 'truck-inspections') {
                            count = completedInspections;
                            statusText = `${count} inspection${count === 1 ? '' : 's'} completed`;
                            isCompleted = count > 0;
                        }

                        return (
                            <Link href={link.href === '#' ? '#' : `/jobs/${jobId}/paperwork/${link.href}`} key={link.title} className="block">
                                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex flex-col justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-primary"/>
                                        <span className="font-medium">{link.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Circle className={isCompleted ? "fill-success" : "fill-muted-foreground"}/>
                                        <span>{statusText}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
