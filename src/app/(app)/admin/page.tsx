
'use client';
import { CertificationsExpiry } from "@/components/dashboard/certifications-expiry";
import { FleetServiceStatus } from "@/components/dashboard/fleet-service-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck as TruckType, Job } from "@/lib/data";
import { Activity, Briefcase, LoaderCircle, Truck, Users } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { Staff } from "@/lib/data";
import Link from "next/link";
import { isPast } from "date-fns";
import { useTenant } from "@/contexts/tenant-context";

const getDisplayedStatus = (job: Job) => {
  const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
  if (job.status === 'Upcoming' && isPast(startDate)) {
    return 'In Progress';
  }
  return job.status;
};


export default function AdminPage() {
  const firestore = useFirestore();
  const { tenantId } = useTenant();

  const staffCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'staff'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  const trucksCollection = useMemoFirebase(() => {
    if(!firestore || !tenantId) return null;
    return query(collection(firestore, 'trucks'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  const { data: truckData, isLoading: isTrucksLoading } = useCollection<TruckType>(trucksCollection);
  
  const jobsCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'job_packs'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  const { data: jobData, isLoading: isJobsLoading } = useCollection<Job>(jobsCollection);


  const totalStaff = staffData?.length ?? 0;
  const totalTrucks = truckData?.length ?? 0;
  const trucksNeedingCheck = truckData?.filter(t => t.status === 'Check Required').length ?? 0;
  const activeJobs = jobData?.filter(job => getDisplayedStatus(job) === 'In Progress').length ?? 0;

  const isLoading = isStaffLoading || isTrucksLoading || isJobsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Staff
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoaderCircle className="h-6 w-6 animate-spin" />
            ) : (
              <Link href="/staff" className="hover:underline">
                <div className="text-2xl font-bold">{totalStaff}</div>
                <p className="text-xs text-muted-foreground">
                  Active personnel
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <LoaderCircle className="h-6 w-6 animate-spin" />
            ) : (
              <Link href="/fleet" className="hover:underline">
                <div className="text-2xl font-bold">{totalTrucks}</div>
                <p className="text-xs text-muted-foreground">
                  Trucks in operation
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <LoaderCircle className="h-6 w-6 animate-spin" />
            ) : (
              <Link href="/jobs" className="hover:underline">
                <div className="text-2xl font-bold">{activeJobs}</div>
                <p className="text-xs text-muted-foreground">
                  Jobs currently in progress
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Alerts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <LoaderCircle className="h-6 w-6 animate-spin" />
            ) : (
               <Link href="/fleet" className="hover:underline">
                <div className="text-2xl font-bold">+{trucksNeedingCheck}</div>
                <p className="text-xs text-muted-foreground">
                  Trucks require checks
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CertificationsExpiry />
        <FleetServiceStatus />
      </div>
    </div>
  );
}
