
'use client';
import { useState } from "react";
import Link from "next/link";
import { staffData, Staff } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { differenceInDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash2, Edit } from "lucide-react";
import { AddStaffDialog } from "@/components/staff/add-staff-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const getOverallCertStatus = (staff: Staff) => {
  if (staff.certifications.length === 0) return { label: 'No Certs', variant: 'outline' as const };
  
  let soonestExpiry = Infinity;
  let isExpired = false;

  for (const cert of staff.certifications) {
    const daysUntilExpiry = differenceInDays(cert.expiryDate, new Date());
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
}


export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>(staffData);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const { toast } = useToast();
  // We use a simple counter to force re-renders when staffData is mutated.
  const [version, setVersion] = useState(0);

  const forceRerender = () => setVersion(v => v + 1);

  const handleAddStaff = (newStaff: Omit<Staff, 'id' | 'avatarUrl'>) => {
    const newStaffMember: Staff = {
      ...newStaff,
      id: (staffData.length + 1).toString(),
      avatarUrl: `https://picsum.photos/seed/${staffData.length + 1}/200/200`,
    };
    staffData.push(newStaffMember);
    forceRerender();
  };
  
  const handleEditStaff = (updatedStaff: Staff) => {
    const staffIndex = staffData.findIndex(staff => staff.id === updatedStaff.id);
    if (staffIndex !== -1) {
      staffData[staffIndex] = updatedStaff;
    }
    setEditingStaff(null);
    forceRerender();
  };

  const handleDeleteStaff = (staffId: string) => {
    const staffIndex = staffData.findIndex(staff => staff.id === staffId);
    if (staffIndex !== -1) {
      const staffToDelete = staffData[staffIndex];
      staffData.splice(staffIndex, 1);
      toast({
        title: "Staff Member Removed",
        description: `${staffToDelete?.name} has been removed from the staff list.`,
        variant: "destructive",
      });
      forceRerender();
    }
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
        <AddStaffDialog onAddStaff={handleAddStaff}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </AddStaffDialog>
      </CardHeader>
      <CardContent>
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
            {staffData.map((staff) => {
              const status = getOverallCertStatus(staff);
              return (
              <TableRow key={staff.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://picsum.photos/seed/${staff.id}/200/200`} />
                      <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Link href={`/staff/${staff.id}`} className="font-medium hover:underline">{staff.name}</Link>
                  </div>
                </TableCell>
                <TableCell>{staff.role}</TableCell>
                <TableCell>
                   <Badge variant="outline" className={cn(
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
                       <DropdownMenuItem onClick={() => setEditingStaff(staff)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteStaff(staff.id)}
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
      </CardContent>
    </Card>
     {editingStaff && (
        <AddStaffDialog
          staffToEdit={editingStaff}
          onAddStaff={()=>{}} // Not used in edit mode
          onEditStaff={handleEditStaff}
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
