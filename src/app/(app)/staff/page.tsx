
'use client';
import { useState } from "react";
import { staffData, Staff } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { differenceInDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AddStaffDialog } from "@/components/staff/add-staff-dialog";

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

  const handleAddStaff = (newStaff: Omit<Staff, 'id' | 'avatarUrl'>) => {
    const newStaffMember: Staff = {
      ...newStaff,
      id: (staffList.length + 1).toString(),
      avatarUrl: `https://picsum.photos/seed/${staffList.length + 1}/200/200`,
    };
    setStaffList([...staffList, newStaffMember]);
  };

  return (
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
              <TableHead className="hidden md:table-cell">Expiring Cert.</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffList.map((staff) => {
              const soonestExpiringCert = [...staff.certifications].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())[0];
              const status = getOverallCertStatus(staff);
              return (
              <TableRow key={staff.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://picsum.photos/seed/${staff.id}/200/200`} />
                      <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{staff.name}</div>
                  </div>
                </TableCell>
                <TableCell>{staff.role}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {soonestExpiringCert ? `${soonestExpiringCert.name} on ${format(soonestExpiringCert.expiryDate, 'dd MMM yyyy')}` : 'N/A'}
                </TableCell>
                <TableCell>
                   <Badge variant="outline" className={cn(
                        status.variant === "destructive" && "bg-destructive/20 text-destructive-foreground border-destructive",
                        status.variant === "warning" && "bg-warning/20 text-yellow-800 border-warning",
                        status.variant === "success" && "bg-success/20 text-green-800 border-success"
                    )}>{status.label}</Badge>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
