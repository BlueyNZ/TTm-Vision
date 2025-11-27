'use client';
import { useParams, useRouter } from 'next/navigation';
import { Job, Timesheet, TruckInspection, HazardId, HazardIdNzgttm, TmpCheckingProcess, OnSiteRecord } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { LoaderCircle, FileText, Circle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const paperworkLinks = [
    { title: 'Timesheets', href: '/jobs/[id]/paperwork/timesheets', collection: 'timesheets' },
    { title: 'Truck Inspections', href: '/jobs/[id]/paperwork/truck-inspections', collection: 'truck_inspections' },
    { title: 'Hazard ID', href: '/jobs/[id]/paperwork/hazard-id', collection: 'hazard_ids' },
    { title: 'Hazard ID (NZGTTM)', href: '/jobs/[id]/paperwork/hazard-id-nzgttm', collection: 'hazard_ids_nzgttm' },
    { title: 'TMP Checking Process', href: '/jobs/[id]/paperwork/pre-installation-process', collection: 'tmp_checking_processes' },
    { title: 'On-Site Record (CoPTTM)', href: '/jobs/[id]/paperwork/on-site-record', collection: 'on_site_records' },
    { title: 'Mobile Ops On-Site Record', href: '/jobs/[id]/paperwork/mobile-ops-on-site-record', collection: 'mobile_ops_records' },
    { title: 'Job Note', href: '/jobs/[id]/paperwork/job-note', collection: 'job_notes' },
    { title: 'Take Site Photos', href: '#', collection: 'site_photos', status: 'not_implemented' },
    { title: 'Incident or Event Report', href: '/jobs/[id]/paperwork/incident-or-event-report', collection: 'incident_reports' },
    { title: 'Site Audit (CoPTTM SCR)', href: '/jobs/[id]/paperwork/site-audit-copttm-scr', collection: 'site_audits' },
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
    const onSiteRecordsRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'on_site_records') : null, [firestore, jobId]);
    const mobileOpsRecordsRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'mobile_ops_records') : null, [firestore, jobId]);
    const jobNotesRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'job_notes') : null, [firestore, jobId]);
    const sitePhotosRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'site_photos') : null, [firestore, jobId]);
    const incidentReportsRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'incident_reports') : null, [firestore, jobId]);
    const siteAuditsRef = useMemoFirebase(() => firestore ? collection(firestore, 'job_packs', jobId, 'site_audits') : null, [firestore, jobId]);

    const { data: timesheets, isLoading: areTimesheetsLoading } = useCollection<Timesheet>(timesheetsRef);
    const { data: truckInspections, isLoading: areInspectionsLoading } = useCollection(truckInspectionsRef);
    const { data: hazardIds, isLoading: areHazardIdsLoading } = useCollection(hazardIdsRef);
    const { data: hazardIdsNzgttm, isLoading: areHazardIdsNzgttmLoading } = useCollection(hazardIdsNzgttmRef);
    const { data: tmpCheckingProcesses, isLoading: areTmpCheckingProcessesLoading } = useCollection(tmpCheckingProcessesRef);
    const { data: onSiteRecords, isLoading: areOnSiteRecordsLoading } = useCollection(onSiteRecordsRef);
    const { data: mobileOpsRecords, isLoading: areMobileOpsRecordsLoading } = useCollection(mobileOpsRecordsRef);
    const { data: jobNotes, isLoading: areJobNotesLoading } = useCollection(jobNotesRef);
    const { data: sitePhotos, isLoading: areSitePhotosLoading } = useCollection(sitePhotosRef);
    const { data: incidentReports, isLoading: areIncidentReportsLoading } = useCollection(incidentReportsRef);
    const { data: siteAudits, isLoading: areSiteAuditsLoading } = useCollection(siteAuditsRef);


    const isLoading = isJobLoading || areTimesheetsLoading || areInspectionsLoading || areHazardIdsLoading || areHazardIdsNzgttmLoading || areTmpCheckingProcessesLoading || areOnSiteRecordsLoading || areMobileOpsRecordsLoading || areJobNotesLoading || areSitePhotosLoading || areIncidentReportsLoading || areSiteAuditsLoading;

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
        timesheets,
        truck_inspections: truckInspections,
        hazard_ids: hazardIds,
        hazard_ids_nzgttm: hazardIdsNzgttm,
        tmp_checking_processes: tmpCheckingProcesses,
        on_site_records: onSiteRecords,
        mobile_ops_records: mobileOpsRecords,
        job_notes: jobNotes,
        site_photos: sitePhotos,
        incident_reports: incidentReports,
        site_audits: siteAudits,
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

                        if (isLoading) {
                            statusText = "Loading...";
                        } else if (link.collection) {
                           statusText = `${count} submission${count === 1 ? '' : 's'}`;
                        }
                        
                        const targetHref = link.href.replace('[id]', jobId);
                        const isNotImplemented = link.status === 'not_implemented';

                        const Wrapper = isNotImplemented ? 'div' : Link;
                        const wrapperProps = isNotImplemented ? {} : { href: targetHref };

                        return (
                            <Wrapper {...wrapperProps} key={link.title} className={cn(!isNotImplemented && "block")}>
                                <div className={cn("p-4 border rounded-lg transition-colors flex flex-col justify-between gap-3 h-full", isNotImplemented ? "bg-muted/50 cursor-not-allowed" : "hover:bg-muted/50")}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-primary"/>
                                            <span className="font-medium">{link.title}</span>
                                        </div>
                                        {isNotImplemented && (
                                            <Badge variant="outline" className="text-xs bg-yellow-400/20 text-yellow-400 font-semibold border-yellow-500">Not Implemented</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Circle className={cn(isCompleted ? "fill-success" : "fill-muted-foreground", isNotImplemented && "fill-yellow-500")} />
                                        <span>{isNotImplemented ? "Feature coming soon" : statusText}</span>
                                    </div>
                                </div>
                            </Wrapper>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
