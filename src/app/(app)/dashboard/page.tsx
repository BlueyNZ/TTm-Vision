import { UtilizationDashboard } from "@/components/dashboard/utilization-dashboard";
import { CertificationsExpiry } from "@/components/dashboard/certifications-expiry";
import { FleetServiceStatus } from "@/components/dashboard/fleet-service-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { jobData, staffData, truckData } from "@/lib/data";
import { Activity, Briefcase, Truck, Users } from "lucide-react";

export default function DashboardPage() {
  const activeJobs = jobData.filter(j => j.status === 'In Progress').length;
  const totalStaff = staffData.length;
  const totalTrucks = truckData.length;
  const trucksNeedingCheck = truckData.filter(t => t.status === 'Check Required').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Jobs
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              Jobs currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Staff
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              Active personnel
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrucks}</div>
            <p className="text-xs text-muted-foreground">
              Trucks in operation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Alerts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{trucksNeedingCheck}</div>
            <p className="text-xs text-muted-foreground">
              Trucks require checks
            </p>
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
