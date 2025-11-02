
'use client';

import { Truck } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Edit, LoaderCircle, Circle, HardHat, Gauge, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, Timestamp } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { AddTruckDialog } from "@/components/fleet/add-truck-dialog";

const getTruckStatus = (truck: Truck) => {
  if (truck.status === 'In Service') return { label: 'In Service', variant: 'destructive' as const };
  if (truck.status === 'Check Required') return { label: 'Check Required', variant: 'warning' as const };

  const nextServiceDate = truck.service.nextServiceDate instanceof Timestamp
    ? truck.service.nextServiceDate.toDate()
    : new Date(truck.service.nextServiceDate);

  const daysUntilService = differenceInDays(nextServiceDate, new Date());
  const kmsUntilService = truck.service.nextServiceKms - truck.currentKms;

  if (daysUntilService <= 14 || kmsUntilService <= 1000) {
    return { label: 'Service Soon', variant: 'warning' as const };
  }
  
  return { label: 'Operational', variant: 'success' as const };
};

export default function TruckProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const firestore = useFirestore();
  const params = useParams();
  const router = useRouter();
  const truckId = params.id as string;

  const truckRef = useMemoFirebase(() => {
    if (!firestore || !truckId) return null;
    return doc(firestore, 'trucks', truckId);
  }, [firestore, truckId]);

  const { data: truck, isLoading } = useDoc<Truck>(truckRef);
  
  const handleEditTruck = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!truck) {
    return <p>Truck not found.</p>;
  }
  
  const status = getTruckStatus(truck);
  const nextServiceDate = truck.service.nextServiceDate instanceof Timestamp 
    ? truck.service.nextServiceDate.toDate() 
    : new Date(truck.service.nextServiceDate);
  const lastServiceDate = truck.service.lastServiceDate instanceof Timestamp
    ? truck.service.lastServiceDate.toDate()
    : new Date(truck.service.lastServiceDate);


  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{truck.name}</CardTitle>
                    <Badge variant="outline">{truck.plate}</Badge>
                </div>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                     <Circle className={cn(
                        "h-2.5 w-2.5",
                        status.variant === 'success' && 'fill-success',
                        status.variant === 'warning' && 'fill-warning',
                        status.variant === 'destructive' && 'fill-destructive'
                    )}/>
                    {status.label}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  <div className="flex items-center gap-4">
                      <Gauge className="h-5 w-5 text-muted-foreground" />
                      <div className="text-sm">
                          <p className="font-medium">Current KMs</p>
                          <p className="text-muted-foreground">{truck.currentKms.toLocaleString()} km</p>
                      </div>
                  </div>
                   <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                       <div className="text-sm">
                          <p className="font-medium">Last Service</p>
                          <p className="text-muted-foreground">{format(lastServiceDate, "dd MMM yyyy")}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                       <div className="text-sm">
                          <p className="font-medium">Next Service</p>
                          <p className="text-muted-foreground">{format(nextServiceDate, "dd MMM yyyy")} or at {truck.service.nextServiceKms.toLocaleString()} km</p>
                      </div>
                  </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Truck
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Log</CardTitle>
              <CardDescription>
                Recent fuel entries for {truck.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {truck.fuelLog && truck.fuelLog.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Volume (L)</TableHead>
                              <TableHead className="text-right">Cost</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {truck.fuelLog.map((log, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{format(new Date(log.date), "dd MMM yyyy")}</TableCell>
                                <TableCell>{log.volumeLiters}</TableCell>
                                <TableCell className="text-right">${log.cost.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (
                  <div className="text-center py-10 text-muted-foreground">
                      <Wrench className="mx-auto h-12 w-12" />
                      <p className="mt-4">No fuel logs on record.</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {isEditing && (
        <AddTruckDialog
          truckToEdit={truck}
          onDialogClose={handleEditTruck}
          open={isEditing}
          onOpenChange={(isOpen) => !isOpen && setIsEditing(false)}
        >
          <></>
        </AddTruckDialog>
      )}
    </>
  );
}
