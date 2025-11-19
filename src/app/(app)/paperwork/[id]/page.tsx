
'use client';
import { useParams, useRouter } from 'next/navigation';
import { Job, Timesheet } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { LoaderCircle, FileText, Circle } from 'lucide-react';
import Link from 'next/link';

const paperworkLinks = [
    { title: 'Timesheets', href: 'timesheets', status: 'pending' },
    { title: 'Truck Inspection', href: 'truck-inspection', status: 'incomplete' },
    { title: 'ESTOP Inspection', href: 'estop-inspection', status: 'incomplete' },
    { title: 'Stop/Go Briefing', href: 'stop-go-briefing', status: 'incomplete' },
    { title: 'TSL Decision Matrix', href: 'tsl-decision-matrix', status: 'incomplete' },
    { title: 'Hazard ID (NZGTTM)', href: 'hazard-id-nzgttm', status: 'incomplete' },
    { title: 'Hazard ID', href: 'hazard-id', status: 'incomplete' },
    { title: 'Site Induction Signatures', href: 'site-induction-signatures', status: 'incomplete' },
    { title: 'Pre-Installation Process', href: 'pre-installation-process', status: 'incomplete' },
    { title: 'On-Site Record', href: 'new-on-site-record', status: 'incomplete' },
    { title: 'Mobile Ops On-Site Record', href: 'mobile-ops-on-site-record', status: 'incomplete' },
    { title: 'Job Note', href: 'job-note', status: 'incomplete' },
    { title: 'Site Audit (COPTTM SCR)', href: 'site-audit-copttm-scr', status: 'incomplete' },
    { title: 'Client Feedback', href: 'client-feedback', status: 'incomplete' },
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

    const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
    const { data: timesheets, isLoading: areTimesheetsLoading } = useCollection<Timesheet>(timesheetsRef);

    const isLoading = isJobLoading || areTimesheetsLoading;

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
                    {paperworkLinks.map((link) => (
                        <Link href={`/jobs/${jobId}/paperwork/${link.href}`} key={link.href} className="block">
                            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex flex-col justify-between gap-3 h-full">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary"/>
                                    <span className="font-medium">{link.title}</span>
                                </div>
                                {link.title === 'Timesheets' ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Circle className="h-2 w-2 fill-muted-foreground"/>
                                        <span>{completedTimesheets} timesheets completed</span>
                                    </div>
                                ) : (
                                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Circle className="h-2 w-2 fill-muted-foreground"/>
                                        <span>Not yet completed</span>
                                     </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
