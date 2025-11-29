
'use client';
import { useState } from "react";
import Link from "next/link";
import { Staff } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash2, Edit, LoaderCircle, Eye } from "lucide-react";
import { AddStaffDialog } from "@/components/staff/add-staff-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";

const getOverallCertStatus = (staff: Staff) => {
  if (!staff.certifications || staff.certifications.length === 0) {
    return { label: 'No Certs', variant: 'outline' as const };
  }

  const expiringCerts = staff.certifications.filter(c => c.name !== 'TTMW');

  if (expiringCerts.length === 0) {
    // This means the user only has TTMW or no expiring certs
    if (staff.certifications.some(c => c.name === 'TTMW')) {
      return { label: 'Certified', variant: 'outline' as const };
    }
    // This case should ideally not be hit if the first check is for length 0
    return { label: 'No Certs', variant: 'outline' as const };
  }

  let soonestExpiry = Infinity;
  let isExpired = false;

  for (const cert of expiringCerts) {
    const expiryDate = cert.expiryDate instanceof Date ? cert.expiryDate : (cert.expiryDate as any).toDate?.() || new Date(cert.expiryDate);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    if (daysUntilExpiry < 0) {
      isExpired = true;
      break;
    }
    if (daysUntilExpiry < soonestExpiry) {
      soonestExpiry = daysUntilExpiry;
    }
  }

  if (isExpired) return { label: 'Expired', variant: 'destructive' as const };
  if (soonestExpiry <= 30) return { label: 'Expires Soon', variant: 'warning' as const };
  return { label: 'Valid', variant: 'success' as const };
};


export default function StaffPage() {
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  
  const staffCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);
  
  const { data: staffData, isLoading } = useCollection<Staff>(staffCollection);


  const handleDeleteStaff = (staff: Staff) => {
    if (!firestore) return;
    const staffDocRef = doc(firestore, 'staff', staff.id);
    deleteDocumentNonBlocking(staffDocRef);
    toast({
      title: "Staff Member Removed",
      description: `${staff.name} has been removed from the staff list.`,
      variant: "destructive",
    });
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff Management</CardTitle>
          <CardDescription>
            View and manage all staff members and their certification status.
          </CardDescription>
        </div>
        <AddStaffDialog onDialogClose={() => {}}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </AddStaffDialog>
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
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffData && staffData.map((staff) => {
                const status = getOverallCertStatus(staff);
                return (
                <TableRow key={staff.id}>
                  <TableCell>
                    <Link href={`/staff/${staff.id}`} className="font-medium hover:underline">{staff.name}</Link>
                  </TableCell>
                  <TableCell>{staff.role}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className={cn(
                          status.variant === "destructive" && "bg-destructive/20 text-destructive-foreground border-destructive",
                          status.variant === "warning" && "bg-warning/20 text-yellow-800 border-warning",
                          status.variant === "success" && "bg-success/20 text-green-800 border-success"
                      )}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => router.push(`/staff/${staff.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingStaff(staff)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteStaff(staff)}
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
     {editingStaff && (
        <AddStaffDialog
          staffToEdit={editingStaff}
          onDialogClose={() => setEditingStaff(null)}
          open={!!editingStaff}
          onOpenChange={(isOpen) => !isOpen && setEditingStaff(null)}
        >
          {/* This is a controlled dialog, trigger is not needed here */}
          <></>
        </AddStaffDialog>
      )}
    </>
  );
}
