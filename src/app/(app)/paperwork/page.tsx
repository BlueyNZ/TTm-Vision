
'use client';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "@/components/ui/card";
import { Job, Staff } from "@/lib/data";
import { LoaderCircle, FileText, ShieldAlert } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, Timestamp, getDocs } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/tenant-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PaperworkPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { tenantId, isLoading: isTenantLoading } = useTenant();
    const [persistedJobs, setPersistedJobs] = useState<Job[] | undefined>(undefined);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userAccessLevel, setUserAccessLevel] = useState<string | null>(null);
    const [staffId, setStaffId] = useState<string | null>(null);
    const [isCheckingAccess, setIsCheckingAccess] = useState(true);

    // Check if user is STMS or Admin and get their staff ID
    useEffect(() => {
        if (!firestore || !tenantId || !user?.email) {
            setIsCheckingAccess(false);
            return;
        }

        const checkAccess = async () => {
            try {
                const staffQuery = query(
                    collection(firestore, 'staff'),
                    where('email', '==', user.email),
                    where('tenantId', '==', tenantId)
                );
                const staffSnapshot = await getDocs(staffQuery);

                if (!staffSnapshot.empty) {
                    const staffData = staffSnapshot.docs[0].data() as Staff;
                    setUserRole(staffData.role);
                    setUserAccessLevel(staffData.accessLevel);
                    setStaffId(staffSnapshot.docs[0].id);
                }
            } catch (error) {
                console.error('Error checking user access:', error);
            } finally {
                setIsCheckingAccess(false);
            }
        };

        checkAccess();
    }, [firestore, tenantId, user?.email]);

    const jobsCollection = useMemoFirebase(() => {
        if (!firestore || !tenantId) return null;
        
        // Admins see all jobs, STMS only see their assigned jobs
        if (userAccessLevel === 'Admin') {
            return query(
                collection(firestore, 'job_packs'),
                where('tenantId', '==', tenantId),
                where('status', '!=', 'Pending')
            );
        } else if (staffId) {
            return query(
                collection(firestore, 'job_packs'),
                where('tenantId', '==', tenantId),
                where('stmsId', '==', staffId),
                where('status', '!=', 'Pending')
            );
        }
        
        return null;
    }, [firestore, tenantId, staffId, userAccessLevel]);

    const { data: jobData, isLoading: isJobsLoading } = useCollection<Job>(jobsCollection);
    
    // Keep jobs persisted even during Fast Refresh
    useEffect(() => {
        if (jobData && jobData.length > 0) {
            setPersistedJobs(jobData);
        }
    }, [jobData]);

    // Use persisted jobs if current data is undefined (during Fast Refresh)
    const displayJobs = jobData || persistedJobs;
    const isLoading = isTenantLoading || isCheckingAccess || (isJobsLoading && !persistedJobs);

    const sortedJobs = useMemo(() => {
        return displayJobs?.sort((a, b) => {
            const dateA = a.startDate instanceof Timestamp ? a.startDate.toDate() : new Date(a.startDate);
            const dateB = b.startDate instanceof Timestamp ? b.startDate.toDate() : new Date(b.startDate);
            return dateB.getTime() - dateA.getTime();
        });
    }, [displayJobs]);

  // Check if user has STMS role or Admin access
  const hasAccess = userRole === 'STMS' || userAccessLevel === 'Admin';
  
  if (!isLoading && !hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paperwork Hub</CardTitle>
          <CardDescription>
            Access restricted to STMS (Site Traffic Management Supervisor) roles and Admins only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must be assigned as an STMS or have Admin access to view the Paperwork Hub. Please contact your administrator if you believe this is an error.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paperwork Hub</CardTitle>
        <CardDescription>
          {userAccessLevel === 'Admin' 
            ? 'View and complete paperwork for all jobs.' 
            : 'View and complete paperwork for jobs where you are assigned as STMS.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
         {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
            ) : sortedJobs && sortedJobs.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job No.</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="hidden lg:table-cell">Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedJobs.map((job) => {
                            const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
                            return (
                            <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.jobNumber}</TableCell>
                                <TableCell>{job.location}</TableCell>
                                <TableCell>{job.clientName}</TableCell>
                                <TableCell className="hidden lg:table-cell text-muted-foreground">
                                    {format(startDate, 'dd MMM yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild size="sm">
                                        <Link href={`/paperwork/${job.id}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            View Paperwork
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            ) : (
                 <div className="text-center py-10 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="mt-4">No active or completed jobs found.</p>
                </div>
            )}
      </CardContent>
    </Card>
  );
}
