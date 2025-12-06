
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Fuel, Wrench, MoreHorizontal, Circle, PlusCircle, Trash2, Edit, Eye, LoaderCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, Timestamp, query, where } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { AddTruckDialog } from '@/components/fleet/add-truck-dialog';
import { useTenant } from '@/contexts/tenant-context';

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

export default function FleetPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [deletingTruck, setDeletingTruck] = useState<Truck | null>(null);

  const trucksCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'trucks'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  
  const { data: truckData, isLoading } = useCollection<Truck>(trucksCollection);

  const handleDeleteTruck = () => {
    if (!firestore || !deletingTruck) return;
    const truckDocRef = doc(firestore, 'trucks', deletingTruck.id);
    deleteDocumentNonBlocking(truckDocRef);
    toast({
      title: "Truck Removed",
      description: `${deletingTruck.name} has been removed from the fleet.`,
      variant: "destructive",
    });
    setDeletingTruck(null);
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fleet Management</CardTitle>
            <CardDescription>
              Track vehicle status, maintenance schedules, and fuel logs.
            </CardDescription>
          </div>
           <AddTruckDialog onDialogClose={() => {}}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Truck
            </Button>
          </AddTruckDialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
              </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Truck</TableHead>
                <TableHead>Current KMs</TableHead>
                <TableHead className="hidden md:table-cell">Next Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {truckData?.map((truck) => {
                const status = getTruckStatus(truck);
                 const nextServiceDate = truck.service.nextServiceDate instanceof Timestamp
                  ? truck.service.nextServiceDate.toDate()
                  : new Date(truck.service.nextServiceDate);
                return (
                <TableRow key={truck.id}>
                  <TableCell>
                    <div className="font-medium">{truck.name}</div>
                    <div className="text-sm text-muted-foreground">{truck.plate}</div>
                  </TableCell>
                  <TableCell>{truck.currentKms.toLocaleString()} km</TableCell>
                  <TableCell className="hidden md:table-cell">{format(nextServiceDate, 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-2 w-fit">
                      <Circle className={cn(
                        "h-2 w-2",
                        status.variant === 'success' && 'fill-success',
                        status.variant === 'warning' && 'fill-warning',
                        status.variant === 'destructive' && 'fill-destructive'
                      )}/>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => router.push(`/fleet/${truck.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingTruck(truck)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Fuel className="mr-2 h-4 w-4" />
                          Log Fuel
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Wrench className="mr-2 h-4 w-4" />
                          Report Defect
                        </DropdownMenuItem>
                         <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingTruck(truck)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {editingTruck && (
        <AddTruckDialog
          truckToEdit={editingTruck}
          onDialogClose={() => setEditingTruck(null)}
          open={!!editingTruck}
          onOpenChange={(isOpen) => !isOpen && setEditingTruck(null)}
        >
          <></>
        </AddTruckDialog>
      )}

      <AlertDialog open={!!deletingTruck} onOpenChange={(open) => !open && setDeletingTruck(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the truck
               <span className="font-semibold"> {deletingTruck?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTruck}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
