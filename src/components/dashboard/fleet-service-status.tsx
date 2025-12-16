
'use client';
import { Truck as TruckType } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Circle, LoaderCircle } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, Timestamp, query, where } from "firebase/firestore";
import { useTenant } from "@/contexts/tenant-context";

function getTruckStatus(truck: TruckType): { variant: "success" | "warning" | "destructive" } {
  if (truck.status === 'In Service') return { variant: "destructive" };
  if (truck.status === 'Check Required') return { variant: "warning" };

  const nextServiceDate = truck.service.nextServiceDate instanceof Timestamp 
    ? truck.service.nextServiceDate.toDate() 
    : new Date(truck.service.nextServiceDate);

  const daysUntilService = differenceInDays(nextServiceDate, new Date());
  const kmsUntilService = truck.service.nextServiceKms - truck.currentKms;

  if (daysUntilService <= 14 || kmsUntilService <= 1000) {
    return { variant: "warning" };
  }
  
  return { variant: "success" };
}

export function FleetServiceStatus() {
  const firestore = useFirestore();
  const { tenantId } = useTenant();
  const trucksCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'trucks'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  const { data: truckData, isLoading } = useCollection<TruckType>(trucksCollection);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Service Status</CardTitle>
        <CardDescription>Overview of truck maintenance and status.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead>Truck</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead className="hidden md:table-cell">Current KMs</TableHead>
                <TableHead>Next Service</TableHead>
                <TableHead className="text-right">Alerts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {truckData?.map(truck => {
                const status = getTruckStatus(truck);
                const kmsUntilService = truck.service.nextServiceKms - truck.currentKms;
                const nextServiceDate = truck.service.nextServiceDate instanceof Timestamp
                  ? truck.service.nextServiceDate.toDate()
                  : new Date(truck.service.nextServiceDate);

                return (
                  <TableRow key={truck.id}>
                    <TableCell>
                      <Circle className={cn("h-4 w-4",
                          status.variant === "success" && "fill-success text-success",
                          status.variant === "warning" && "fill-warning text-warning",
                          status.variant === "destructive" && "fill-destructive text-destructive"
                      )} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{truck.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{truck.plate}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{truck.currentKms.toLocaleString()} km</TableCell>
                    <TableCell>
                      {format(nextServiceDate, "dd MMM yyyy")} or {truck.service.nextServiceKms.toLocaleString()} km
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "text-sm",
                        status.variant === "warning" && "text-yellow-600 font-medium",
                        status.variant === "destructive" && "text-destructive font-bold"
                      )}>
                        {truck.status !== 'Operational' ? truck.status : (kmsUntilService <= 1000 ? `${kmsUntilService.toLocaleString()}km to service` : 'OK')}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
