import { truckData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, Wrench, MoreHorizontal, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

const getTruckStatus = (truck: typeof truckData[0]) => {
  if (truck.status === 'In Service') return { label: 'In Service', variant: 'destructive' as const };
  if (truck.status === 'Check Required') return { label: 'Check Required', variant: 'warning' as const };

  const daysUntilService = differenceInDays(truck.service.nextServiceDate, new Date());
  const kmsUntilService = truck.service.nextServiceKms - truck.currentKms;

  if (daysUntilService <= 14 || kmsUntilService <= 1000) {
    return { label: 'Service Soon', variant: 'warning' as const };
  }
  
  return { label: 'Operational', variant: 'success' as const };
}


export default function FleetPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Management</CardTitle>
        <CardDescription>
          Track vehicle status, maintenance schedules, and fuel logs.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            {truckData.map((truck) => {
              const status = getTruckStatus(truck);
              return (
              <TableRow key={truck.id}>
                <TableCell>
                  <div className="font-medium">{truck.name}</div>
                  <div className="text-sm text-muted-foreground">{truck.plate}</div>
                </TableCell>
                <TableCell>{truck.currentKms.toLocaleString()} km</TableCell>
                <TableCell className="hidden md:table-cell">{format(truck.service.nextServiceDate, 'dd MMM yyyy')}</TableCell>
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
                      <DropdownMenuItem>
                        <Fuel className="mr-2 h-4 w-4" />
                        Log Fuel
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Wrench className="mr-2 h-4 w-4" />
                        Report Defect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
