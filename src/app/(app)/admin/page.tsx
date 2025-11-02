
'use client';
import { UtilizationDashboard } from "@/components/dashboard/utilization-dashboard";
import { CertificationsExpiry } from "@/components/dashboard/certifications-expiry";
import { FleetServiceStatus } from "@/components/dashboard/fleet-service-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck as TruckType } from "@/lib/data";
import { Activity, LoaderCircle, Truck, Users } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Staff } from "@/lib/data";

export default function AdminPage() {
  const firestore = useFirestore();

  const staffCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);
  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  const trucksCollection = useMemoFirebase(() => {
    if(!firestore) return null;
    return collection(firestore, 'trucks');
  }, [firestore]);
  const { data: truckData, isLoading: isTrucksLoading } = useCollection<TruckType>(trucksCollection);

  const totalStaff = staffData?.length ?? 0;
  const totalTrucks = truckData?.length ?? 0;
  const trucksNeedingCheck = truckData?.filter(t => t.status === 'Check Required').length ?? 0;
  const isLoading = isStaffLoading || isTrucksLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <>
                <div className="text-2xl font-bold">{totalStaff}</div>
                <p className="text-xs text-muted-foreground">
                  Active personnel
                </p>
              </>
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
              <>
                <div className="text-2xl font-bold">{totalTrucks}</div>
                <p className="text-xs text-muted-foreground">
                  Trucks in operation
                </p>
              </>
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
              <>
                <div className="text-2xl font-bold">+{trucksNeedingCheck}</div>
                <p className="text-xs text-muted-foreground">
                  Trucks require checks
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <UtilizationDashboard />
        <CertificationsExpiry />
      </div>
      <div>
        <FleetServiceStatus />
      </div>
    </div>
  );
}
