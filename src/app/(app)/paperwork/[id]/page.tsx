
'use client';
import { useParams, useRouter } from 'next/navigation';
import { Job } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { LoaderCircle, FileText } from 'lucide-react';
import Link from 'next/link';

const paperworkLinks = [
    { title: 'Timesheets', href: 'single-crew-timesheet' },
    { title: 'Truck Inspection', href: 'truck-inspection' },
    { title: 'ESTOP Inspection', href: 'estop-inspection' },
    { title: 'Stop/Go Briefing', href: 'stop-go-briefing' },
    { title: 'TSL Decision Matrix', href: 'tsl-decision-matrix' },
    { title: 'Hazard ID (NZGTTM)', href: 'hazard-id-nzgttm' },
    { title: 'Hazard ID', href: 'hazard-id' },
    { title: 'Site Induction Signatures', href: 'site-induction-signatures' },
    { title: 'Pre-Installation Process', href: 'pre-installation-process' },
    { title: 'NEW On-Site Record', href: 'new-on-site-record' },
    { title: 'Mobile Ops On-Site Record', href: 'mobile-ops-on-site-record' },
    { title: 'Job Note', href: 'job-note' },
    { title: 'Site Audit (COPTTM SCR)', href: 'site-audit-copttm-scr' },
    { title: 'Client Feedback', href: 'client-feedback' },
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

    const { data: job, isLoading } = useDoc<Job>(jobRef);

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
                            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3 h-full">
                                <FileText className="h-5 w-5 text-primary"/>
                                <span className="font-medium">{link.title}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
