
'use client';
import { useParams, useRouter } from 'next/navigation';
import { Job, Timesheet, TruckInspection, HazardId, HazardIdNzgttm, TmpCheckingProcess } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { LoaderCircle, FileText, Circle } from 'lucide-react';
import Link from 'next/link';

const paperworkLinks = [
    { title: 'Timesheets', href: 'timesheets', collection: 'timesheets' },
    { title: 'Truck Inspections', href: 'truck-inspections', collection: 'truck_inspections' },
    { title: 'Hazard ID', href: 'hazard-id', collection: 'hazard_ids' },
    { title: 'Hazard ID (NZGTTM)', href: 'hazard-id-nzgttm', collection: 'hazard_ids_nzgttm' },
    { title: 'TMP Checking Process', href: 'pre-installation-process', collection: 'tmp_checking_processes' },
    { title: 'On-Site Record (CoPTTM)', href: 'new-on-site-record' },
    { title: 'Mobile Ops On-Site Record', href: 'mobile-ops-on-site-record' },
    { title: 'Job Note', href: 'job-note' },
    { title: 'Take Site Photos', href: '#' },
    { title: 'Incident or Event Report', href: 'incident-or-event-report' },
    { title: 'Site Audit (CoPTTM SCR)', href: 'site-audit-copttm-scr' },
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

    const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);

    const timesheetsRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'timesheets') : null, [firestore, jobId]);
    const truckInspectionsRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'truck_inspections') : null, [firestore, jobId]);
    const hazardIdsRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'hazard_ids') : null, [firestore, jobId]);
    const hazardIdsNzgttmRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'hazard_ids_nzgttm') : null, [firestore, jobId]);
    const tmpCheckingProcessesRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'tmp_checking_processes') : null, [firestore, jobId]);

    const { data: timesheets, isLoading: areTimesheetsLoading } = useCollection<Timesheet>(timesheetsRef);
    const { data: truckInspections, isLoading: areInspectionsLoading } = useCollection<TruckInspection>(truckInspectionsRef);
    const { data: hazardIds, isLoading: areHazardIdsLoading } = useCollection<HazardId>(hazardIdsRef);
    const { data: hazardIdsNzgttm, isLoading: areHazardIdsNzgttmLoading } = useCollection<HazardIdNzgttm>(hazardIdsNzgttmRef);
    const { data: tmpCheckingProcesses, isLoading: areTmpCheckingProcessesLoading } = useCollection<TmpCheckingProcess>(tmpCheckingProcessesRef);


    const isLoading = isJobLoading || areTimesheetsLoading || areInspectionsLoading || areHazardIdsLoading || areHazardIdsNzgttmLoading || areTmpCheckingProcessesLoading;

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

    const collectionDataMap: { [key: string]: any[] | undefined } = {
        timesheets: timesheets,
        truck_inspections: truckInspections,
        hazard_ids: hazardIds,
        hazard_ids_nzgttm: hazardIdsNzgttm,
        tmp_checking_processes: tmpCheckingProcesses,
    };

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
                        const associatedCollection = collectionDataMap[link.collection || ''];
                        const count = associatedCollection?.length || 0;
                        const isCompleted = count > 0;
                        let statusText = "Not yet completed";

                        if (link.collection) {
                           statusText = `${count} submission${count === 1 ? '' : 's'}`;
                        }

                        return (
                            <Link href={link.href === '#' ? '#' : `/jobs/${jobId}/paperwork/${link.href}`} key={link.title} className="block">
                                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex flex-col justify-between gap-3 h-full">
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
